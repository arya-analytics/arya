// Copyright 2024 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in
// the file licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business
// Source License, use of this software will be governed by the Apache License,
// Version 2.0, included in the file licenses/APL.txt.

import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import { migrate } from "@synnaxlabs/x";

import type { Cluster } from "@/cluster/core";

/** The state of the cluster slice. */
export interface SliceState extends migrate.Migratable {
  /** The current, active cluster. */
  activeCluster: string | null;
  /**
   * A record of cluster keys to clusters. The active cluster is guaranteed to
   * be present in this record.
   */
  clusters: Record<string, Cluster>;
}

/**
 * The name of the cluster slice in a larger store. NOTE: This must be the name
 * of the slice in the store, or else all selectors will fail.
 */
export const SLICE_NAME = "cluster";

/**
 * Represents a partial view of a larger store that contains the cluster slice.
 * This is typically used for hooks that accept the entire store state as a
 * parameter but only need access to the cluster slice.
 */
export interface StoreState {
  [SLICE_NAME]: SliceState;
}

export const ZERO_SLICE_STATE: SliceState = {
  version: "0.0.1",
  activeCluster: null,
  clusters: {},
};

export const PERSIST_EXCLUDE = `${SLICE_NAME}.localState.status`;

/** Signature for the setCluster action. */
export type SetPayload = Cluster;

/** Signature for the setActiveCluster action. */
export type SetActivePayload = string | null;

export interface RemovePayload {
  keys: string[];
}

export interface RenamePayload {
  key: string;
  name: string;
}

export const MIGRATIONS: migrate.Migrations = {};

export const migrateSlice = migrate.migrator<SliceState>({
  name: "cluster.slice",
  migrations: MIGRATIONS,
  def: ZERO_SLICE_STATE,
});

export const {
  actions,
  /**
   * The reducer for the cluster slice.
   */
  reducer,
} = createSlice({
  name: SLICE_NAME,
  initialState: ZERO_SLICE_STATE,
  reducers: {
    set: (
      { activeCluster, clusters: clusters },
      { payload: cluster }: PayloadAction<SetPayload>,
    ) => {
      clusters[cluster.key] = cluster;
      if (activeCluster == null) activeCluster = cluster.key;
    },
    remove: (
      { clusters: clusters },
      { payload: { keys } }: PayloadAction<RemovePayload>,
    ) => {
      for (const key of keys) {
        delete clusters[key];
      }
    },
    setActive: (state, { payload: key }: PayloadAction<SetActivePayload>) => {
      state.activeCluster = key;
    },
    rename: (state, { payload: { key, name } }: PayloadAction<RenamePayload>) => {
      const cluster = state.clusters[key];
      if (cluster == null) return;
      cluster.name = name;
      if (cluster.props != null) cluster.props.name = name;
    },
  },
});

export const {
  /**
   * Sets the cluster with the given key in state.
   * @params payload.cluster - The cluster to set.
   */
  set,
  /**
   * Sets the active cluster key in state.
   * @params payload - The key of the cluster to set as active.
   */
  setActive,
  remove,
  rename,
} = actions;

export type Action = ReturnType<(typeof actions)[keyof typeof actions]>;

export type Payload = Action["payload"];
