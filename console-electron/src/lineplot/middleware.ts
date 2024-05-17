// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { Layout } from "@/layout";
import { select, selectSliceState } from "@/lineplot/selectors";
import {
  type CreatePayload,
  type RemovePayload,
  type StoreState,
  type SetLinePayload,
  type SetRangesPayload,
  type SetXChannelPayload,
  type SetYChannelsPayload,
  actions,
  remove,
  setLine,
  setRanges,
  setXChannel,
  setYChannels,
} from "@/lineplot/slice";
import { type MiddlewareEffect, effectMiddleware } from "@/middleware";
import { Range } from "@/range";

export const assignColorsEffect: MiddlewareEffect<
  Layout.StoreState & StoreState,
  CreatePayload | SetRangesPayload | SetXChannelPayload | SetYChannelsPayload,
  SetLinePayload
> = ({ getState, action, dispatch }) => {
  const s = getState();
  const p = select(s, action.payload.key);
  p.lines.forEach((l) => {
    if (l.color === "") {
      const theme = Layout.selectTheme(s);
      const colors = theme?.colors.visualization.palettes.default ?? [];
      dispatch(
        setLine({
          key: p.key,
          line: {
            key: l.key,
            color: colors[p.lines.indexOf(l) % colors.length].hex,
          },
        }),
      );
    }
  });
};

export const assignActiveRangeEffect: MiddlewareEffect<
  Range.StoreState & StoreState,
  CreatePayload | SetXChannelPayload | SetYChannelsPayload,
  SetRangesPayload
> = ({ getState, action, dispatch }) => {
  const s = getState();
  const p = select(s, action.payload.key);
  const range = Range.selectActiveKey(s);
  if (!p.axes.hasHadChannelSet && p.ranges.x1.length === 0 && range != null) {
    dispatch(
      setRanges({
        key: p.key,
        axisKey: "x1",
        ranges: [range],
      }),
    );
  }
};

export const deleteEffect: MiddlewareEffect<
  Layout.StoreState & StoreState,
  Layout.RemovePayload | Layout.SetSlicePayload,
  RemovePayload
> = ({ action, dispatch, getState }) => {
  const state = getState();
  const lineState = selectSliceState(state);
  const layout = Layout.selectSliceState(state);
  const keys = "keys" in action.payload ? action.payload.keys : [];
  const toRemove = Object.keys(lineState.plots).filter(
    (p) => layout.layouts[p] == null || keys.includes(p),
  );
  if (toRemove.length > 0) dispatch(remove({ keys: toRemove }));
};

export const MIDDLEWARE = [
  effectMiddleware(
    [
      actions.create.type,
      setXChannel.type,
      setYChannels.type,
      setRanges.type,
      setYChannels.type,
    ],
    [assignColorsEffect],
  ),
  effectMiddleware(
    [actions.create.type, setXChannel.type, setYChannels.type],
    [assignActiveRangeEffect],
  ),
  effectMiddleware([Layout.remove.type, Layout.setWorkspace.type], [deleteEffect]),
];
