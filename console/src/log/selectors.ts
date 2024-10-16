// Copyright 2024 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { useMemoSelect } from "@/hooks";
import { SLICE_NAME, SliceState, State, StoreState } from "@/log/slice";

export const selectSliceState = (state: StoreState): SliceState => state[SLICE_NAME];

export const select = (state: StoreState, key: string): State =>
  state[SLICE_NAME].logs[key];

export const useSelect = (key: string): State =>
  useMemoSelect((s: StoreState) => select(s, key), [key]);