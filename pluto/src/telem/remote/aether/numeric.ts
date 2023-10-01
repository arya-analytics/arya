// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import {
  type Destructor,
  type Series,
  TimeSpan,
  TimeStamp,
  addSamples,
} from "@synnaxlabs/x";
import { z } from "zod";

import { type Client, type StreamHandler } from "@/telem/client/client";
import { type telem } from "@/telem/core";
import { TelemMeta } from "@/telem/core/base";

export const numericProps = z.object({
  channel: z.number(),
});

export type NumericSourceProps = z.infer<typeof numericProps>;

export class NumericSource
  extends TelemMeta<typeof numericProps>
  implements telem.NumericSource
{
  removeStreamHandler: Destructor | null = null;

  static readonly TYPE = "range-point";

  schema = numericProps;

  private valid = false;
  private leadingBuffer: Series | null = null;
  private readonly client: Client;

  constructor(key: string, client: Client) {
    super(key);
    this.client = client;
  }

  cleanup(): void {
    this.removeStreamHandler?.();
    this.valid = false;
    this.leadingBuffer = null;
    this.removeStreamHandler = null;
    super.cleanup();
  }

  invalidate(): void {
    this.valid = false;
    this.notify?.();
  }

  async number(): Promise<number> {
    if (this.props.channel === 0) return 0;
    if (!this.valid) await this.read();
    if (this.leadingBuffer == null || this.leadingBuffer.length === 0) return 0;
    const v = this.leadingBuffer.data[this.leadingBuffer.length - 1];
    return Number(addSamples(v, this.leadingBuffer.sampleOffset));
  }

  async read(): Promise<void> {
    this.valid = true;
    const { channel } = this.props;
    const now = TimeStamp.now()
      .sub(TimeStamp.seconds(10))
      .spanRange(TimeSpan.seconds(20));
    const d = await this.client.read(now, [channel]);
    this.leadingBuffer = d[channel].data[0];
    await this.updateStreamHandler();
  }

  async updateStreamHandler(): Promise<void> {
    this.removeStreamHandler?.();
    const { channel } = this.props;
    const handler: StreamHandler = (data) => {
      const res = data[channel];
      if (res.data.length > 0) this.leadingBuffer = res.data[res.data.length - 1];
      this.notify?.();
    };
    this.removeStreamHandler = await this.client.stream(handler, [channel]);
  }

  setProps(props: any): void {
    super.setProps(props);
    if (this.propsDeepEqual) return;
    this.invalidate();
  }
}
