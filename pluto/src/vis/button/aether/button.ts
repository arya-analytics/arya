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
import { telem } from "@/telem/aether";

export const buttonStateZ = z.object({
  trigger: z.number(),
  sink: telem.booleanSinkSpecZ.optional().default(telem.noopBooleanSinkSpec),
});

interface InternalState {
  sink: telem.BooleanSink;
}

export class Button extends aether.Leaf<typeof buttonStateZ, InternalState> {
  static readonly TYPE = "Button";

  schema = buttonStateZ;

  afterUpdate(): void {
    const { internal: i } = this;
    i.sink = telem.useSink(this.ctx, this.state.sink, i.sink);

    if (this.state.trigger > this.prevState.trigger)
      this.internal.sink.set(true).catch(console.error);
  }

  render(): void {}

  afterDelete(): void {
    const { internal: i } = this;
    i.sink.cleanup?.();
  }
}

export const REGISTRY: aether.ComponentRegistry = {
  [Button.TYPE]: Button,
};
