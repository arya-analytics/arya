// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import {
  type UnknownAction,
  type Dispatch,
  type Middleware,
  type MiddlewareAPI,
  type Action,
} from "@reduxjs/toolkit";
import { MAIN_WINDOW } from "@synnaxlabs/drift";
import { debounce, deep, type UnknownRecord } from "@synnaxlabs/x";
import { appWindow } from "@tauri-apps/api/window";

import { TauriKV } from "@/persist/kv";
import { type Version } from "@/version";

const PERSISTED_STATE_KEY = "console-persisted-state";
const DB_VERSION_KEY = "console-version";

export interface RequiredState extends Version.StoreState {}

export interface Config<S extends RequiredState> {
  migrator?: (state: S) => S;
  exclude: Array<deep.Key<S>>;
}

export const REVERT_STATE: Action = {
  type: "persist.revert-state",
};

export const CLEAR_STATE: Action = {
  type: "persist.clear-state",
};

const persistedStateKey = (version: number): string =>
  `${PERSISTED_STATE_KEY}.${version}`;

interface StateVersionValue {
  version: number;
}

const KEEP_HISTORY = 4;

export const open = async <S extends RequiredState>({
  exclude = [],
  migrator,
}: Config<S>): Promise<[S | undefined, Middleware<UnknownRecord, S>]> => {
  if (appWindow.label !== MAIN_WINDOW) return [undefined, noOpMiddleware];
  const db = new TauriKV();
  let version: number = (await db.get<StateVersionValue>(DB_VERSION_KEY))?.version ?? 0;
  let state = (await db.get<S>(persistedStateKey(version))) ?? undefined;
  if (state != null && migrator != null) {
    state = migrator(state);
    await db.set(PERSISTED_STATE_KEY, state).catch(console.error);
  }

  const revert = async (): Promise<void> => {
    if (appWindow.label !== MAIN_WINDOW) return;
    version--;
    await db.set(DB_VERSION_KEY, { version });
    window.location.reload();
  };

  const clear = async (): Promise<void> => {
    if (appWindow.label !== MAIN_WINDOW) return;
    for (let i = version; i >= version - KEEP_HISTORY - 1; i--)
      await db.delete(persistedStateKey(i));
    version = 0;
    await db.set(DB_VERSION_KEY, { version });
    window.location.reload();
  };

  const persist = debounce((store: MiddlewareAPI<Dispatch<UnknownAction>, S>) => {
    if (appWindow.label !== MAIN_WINDOW) return;
    version++;
    // We need to make a deep copy here to make immer happy
    // when we do deep deletes.
    const deepCopy = deep.copy(store.getState());
    const filtered = deep.deleteD<S>(deepCopy, ...exclude);
    db.set(persistedStateKey(version), filtered).catch(console.error);
    db.set(DB_VERSION_KEY, { version }).catch(console.error);
    db.delete(persistedStateKey(version - KEEP_HISTORY)).catch(console.error);
  }, 500);

  return [
    state,
    (store) => (next) => (action) => {
      const result = next(action);
      const type = (action as Action | undefined)?.type;
      if (type === REVERT_STATE.type) revert().catch(console.error);
      else if (type === CLEAR_STATE.type) clear().catch(console.error);
      else persist(store);
      return result;
    },
  ];
};

const noOpMiddleware: Middleware<UnknownRecord, any> = () => (next) => (action) =>
  next(action);
