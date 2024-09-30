// Copyright 2024 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { type Layout } from "@/layout";
import { ContextMenu, LAYOUT_TYPE, LinePlot } from "@/lineplot/LinePlot";

export * from "@/lineplot/file";
export * from "@/lineplot/LinePlot";
export * from "@/lineplot/middleware";
export * from "@/lineplot/NavControls";
export * from "@/lineplot/selectors";
export * from "@/lineplot/slice";
export * from "@/lineplot/toolbar";
export * from "@/lineplot/useTriggerHold";

export const LAYOUTS: Record<string, Layout.Renderer> = {
  [LAYOUT_TYPE]: LinePlot,
};

export const CONTEXT_MENUS: Record<string, Layout.ContextMenuRenderer> = {
  [LAYOUT_TYPE]: ContextMenu,
};
