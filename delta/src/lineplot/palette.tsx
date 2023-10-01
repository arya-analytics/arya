// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { Icon } from "@synnaxlabs/media";

import { create } from "@/lineplot/slice";
import { type Command } from "@/palette/Palette";

export const createLinePlotCommand: Command = {
  key: "create-line-plot",
  name: "Create a Line Plot",
  icon: <Icon.Visualize />,
  onSelect: ({ placeLayout: layoutPlacer }) => layoutPlacer(create({})),
};

export const COMMANDS = [createLinePlotCommand];
