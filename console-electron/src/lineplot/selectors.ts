// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { type Viewport } from "@synnaxlabs/pluto";
import { type bounds } from "@synnaxlabs/x";

import { useMemoSelect } from "@/hooks";
import {
  type State,
  type SliceState,
  type StoreState,
  SLICE_NAME,
  type ToolbarState,
  type ControlState,
  type SelectionState,
} from "@/lineplot/slice";
import { Range } from "@/range";
import { type Vis } from "@/vis";

export const selectSliceState = (state: StoreState): SliceState => state[SLICE_NAME];

export const select = (state: StoreState, key: string): State =>
  selectSliceState(state).plots[key];

export const selectMultiple = (state: StoreState, keys: string[]): State[] =>
  keys.map((key) => select(state, key));

export const useSelect = (key: string): State =>
  useMemoSelect((state: StoreState) => select(state, key), [key]);

export const selectRanges = (key: string): Vis.XAxisRecord<Range.Range[]> => {
  return useMemoSelect(
    (state: StoreState & Range.StoreState) => {
      const p = select(state, key);
      return {
        x1: Range.selectMultiple(state, p.ranges.x1),
        x2: Range.selectMultiple(state, p.ranges.x2),
      };
    },
    [key],
  );
};

export const selectToolbar = (state: StoreState): ToolbarState =>
  selectSliceState(state).toolbar;

export const useSelectToolbar = (): ToolbarState => useMemoSelect(selectToolbar, []);

export const selectControlState = (state: StoreState): ControlState =>
  selectSliceState(state).control;

export const useSelectControlState = (): ControlState =>
  useMemoSelect(selectControlState, []);

export const selectViewportMode = (state: StoreState): Viewport.Mode =>
  selectSliceState(state).mode;

export const useSelectViewportMode = (): Viewport.Mode =>
  useMemoSelect(selectViewportMode, []);

export const selectSelection = (state: StoreState, key: string): SelectionState =>
  select(state, key).selection;

export const useSelectSelection = (key: string): SelectionState =>
  useMemoSelect((state: StoreState) => selectSelection(state, key), [key]);

export const selectAxisBounds = (
  state: StoreState,
  key: string,
  axisKey: Vis.AxisKey,
): bounds.Bounds => {
  const p = select(state, key);
  return p.axes.axes[axisKey].bounds;
};

export const useSelectAxisBounds = (key: string, axisKey: Vis.AxisKey): bounds.Bounds =>
  useMemoSelect(
    (state: StoreState) => selectAxisBounds(state, key, axisKey),
    [key, axisKey],
  );
