// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { Store } from "tauri-plugin-store-api";

export const multipleWindowsOpen = new Error("[persist] - windows open");

/**
 * TauriKV an implementation of AsyncKV that communicates with a rust key-value
 * store running on the backend.
 */
export class TauriKV {
  store: Store;

  constructor() {
    this.store = new Store("~/.synnax/console/persisted-state.dat");
  }

  async get<V>(key: string): Promise<V | null> {
    return (await this.store.get(key)) as V;
  }

  async set<V>(key: string, value: V): Promise<void> {
    await this.store.set(key, value);
    await this.store.save();
  }

  async delete(key: string): Promise<void> {
    await this.store.delete(key);
  }
}
