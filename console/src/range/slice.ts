// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { TimeSpan } from "@synnaxlabs/x";

import { type Range } from "@/range/range";

export interface SliceState {
  activeRange: string | null;
  editBuffer: Partial<Range> | null;
  ranges: Record<string, Range>;
}

export const SLICE_NAME = "range";

export interface StoreState {
  [SLICE_NAME]: SliceState;
}

export const initialState: SliceState = {
  activeRange: null,
  ranges: {
    rolling30s: {
      key: "recent",
      variant: "dynamic",
      name: "Rolling 30s",
      span: Number(TimeSpan.seconds(30)),
      persisted: false,
    },
    rolling1m: {
      key: "rolling1m",
      variant: "dynamic",
      name: "Rolling 1m",
      span: Number(TimeSpan.minutes(1)),
      persisted: false,
    },
    rolling5m: {
      key: "rolling5m",
      variant: "dynamic",
      name: "Rolling 5m",
      span: Number(TimeSpan.minutes(5)),
      persisted: false,
    },
    rolling15m: {
      key: "rolling15m",
      variant: "dynamic",
      name: "Rolling 15m",
      span: Number(TimeSpan.minutes(15)),
      persisted: false,
    },
    rolling30m: {
      key: "rolling30m",
      variant: "dynamic",
      name: "Rolling 30m",
      span: Number(TimeSpan.minutes(30)),
      persisted: false,
    },
  },
};

interface AddPayload {
  ranges: Range[];
}

interface SetEditBufferPayload {
  range: Partial<Range> | null;
}

interface RemovePayload {
  keys: string[];
}

type SetActivePayload = string | null;

type PA<P> = PayloadAction<P>;

export const { actions, reducer } = createSlice({
  name: SLICE_NAME,
  initialState,
  reducers: {
    add: (state, { payload: { ranges } }: PA<AddPayload>) => {
      ranges.forEach((range) => {
        state.activeRange = range.key;
        state.ranges[range.key] = range;
      });
    },
    remove: (state, { payload: { keys } }: PA<RemovePayload>) => {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      keys.forEach((k) => delete state.ranges[k]);
    },
    setActive: (state, { payload }: PA<SetActivePayload>) => {
      state.activeRange = payload;
    },
    setEditBuffer: (state, { payload: { range } }: PA<SetEditBufferPayload>) => {
      state.editBuffer = range;
    },
  },
});
export const { add, remove, setActive, setEditBuffer } = actions;

export type Action = ReturnType<(typeof actions)[keyof typeof actions]>;
export type Payload = Action["payload"];
