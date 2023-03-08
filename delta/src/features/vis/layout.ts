// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { nanoid } from "nanoid";

import { setVis as storeCreateVizualization } from "./store";
import { Vis } from "./types";

import { Layout, LayoutCreator, LayoutCreatorProps } from "@/features/layout";

export const createVis =
  <V extends Vis>(initial: Partial<V> & Omit<Layout, "type">): LayoutCreator =>
  ({ dispatch }: LayoutCreatorProps): Layout => {
    const { name, location, window, tab, ...rest } = initial;
    const key = initial.key ?? nanoid();
    dispatch(
      storeCreateVizualization({
        ...rest,
        key,
        variant: "linePlot",
      })
    );
    return {
      key,
      location: location ?? "mosaic",
      type: "visualization",
      name: initial.name ?? "Plot",
      window,
      tab,
    };
  };
