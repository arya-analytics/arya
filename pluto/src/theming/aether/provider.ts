// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { z } from "zod";

import { aether } from "@/aether/aether";
import { themeZ, type Theme } from "@/theming/core/theme";

const CONTEXT_KEY = "pluto-theming-context";

const providerStateZ = z.object({
  theme: themeZ,
});

export class Provider extends aether.Composite<typeof providerStateZ> {
  static readonly TYPE: string = "theming.Provider";
  static readonly z = providerStateZ;
  schema = Provider.z;

  async afterUpdate(): Promise<void> {
    this.ctx.set(CONTEXT_KEY, this.state.theme);
  }
}

export const use = (ctx: aether.Context): Theme => ctx.get<Theme>(CONTEXT_KEY);

export const REGISTRY: aether.ComponentRegistry = {
  [Provider.TYPE]: Provider,
};
