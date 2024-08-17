// Copyright 2024 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in
// the file licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business
// Source License, use of this software will be governed by the Apache License,
// Version 2.0, included in the file licenses/APL.txt.

import { migrate } from "@synnaxlabs/x";

import * as v0 from "@/schematic/migrations/v0";
import * as v1 from "@/schematic/migrations/v1";
import * as v2 from "@/schematic/migrations/v2";
import * as v3 from "@/schematic/migrations/v3";

export type NodeProps = v0.NodeProps;
export type State = v3.State;
export type SliceState = v3.SliceState;
export type ToolbarTab = v0.ToolbarTab;
export type ToolbarState = v0.ToolbarState;
export type LegendState = v1.LegendState;
export type CopyBuffer = v0.CopyBuffer;
export type AnyState = v0.State | v1.State | v2.State | v3.State;
export type AnySliceState =
  | v0.SliceState
  | v1.SliceState
  | v2.SliceState
  | v3.SliceState;

export const ZERO_STATE = v3.ZERO_STATE;
export const ZERO_SLICE_STATE = v3.ZERO_SLICE_STATE;

const STATE_MIGRATIONS: migrate.Migrations = {
  "0.0.0": v1.stateMigration,
  "1.0.0": v2.stateMigration,
  "2.0.0": v3.stateMigration,
};

const SLICE_MIGRATIONS: migrate.Migrations = {
  "0.0.0": v1.sliceMigration,
  "1.0.0": v2.sliceMigration,
  "2.0.0": v3.sliceMigration,
};

export const migrateState = migrate.migrator<AnyState, State>({
  name: "schematic.state",
  migrations: STATE_MIGRATIONS,
  def: ZERO_STATE,
});

export const migrateSlice = migrate.migrator<AnySliceState, SliceState>({
  name: "schematic.slice",
  migrations: SLICE_MIGRATIONS,
  def: ZERO_SLICE_STATE,
});

// Descending order so that the latest state is tried first
const STATES_Z = [v3.stateZ, v2.stateZ, v1.stateZ, v0.stateZ];

export const parser: (potentialState: any) => State | null = (potentialState) => {
  const stateZ = STATES_Z.find((stateZ) => stateZ.safeParse(potentialState).success);
  return stateZ == null ? null : migrateState(stateZ.parse(potentialState));
};
