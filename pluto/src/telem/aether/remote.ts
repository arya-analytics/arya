// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { type channel } from "@synnaxlabs/client";
import {
  bounds,
  TimeRange,
  type Series,
  TimeSpan,
  TimeStamp,
  DataType,
  type AsyncDestructor,
} from "@synnaxlabs/x";
import { z } from "zod";

import {
  AbstractSource,
  type Spec,
  type NumberSource,
  type Telem,
  type SeriesSourceSpec,
  type NumberSourceSpec,
  type SeriesSource,
} from "@/telem/aether/telem";
import { type client } from "@/telem/client";

export const streamChannelValuePropsZ = z.object({
  channel: z.number(),
});

export type StreamChannelValueProps = z.infer<typeof streamChannelValuePropsZ>;

// StreamChannelValue is an implementation of NumberSource that reads and returns the
// most recent value of a channel in real-time.
export class StreamChannelValue
  extends AbstractSource<typeof streamChannelValuePropsZ>
  implements NumberSource
{
  private readonly client: client.Client;
  // Disconnects the current streaming handler.
  private removeStreamHandler: AsyncDestructor | null = null;

  static readonly TYPE = "stream-channel-value";

  schema = streamChannelValuePropsZ;

  private leadingBuffer: Series | null = null;
  private valid = false;

  constructor(client: client.Client, props: unknown) {
    super(props);
    this.client = client;
  }

  /** @returns the leadng series buffer for testing purposes. */
  get testingOnlyLeadingBuffer(): Series | null {
    return this.leadingBuffer;
  }

  /** @returns the internal valid flag for testing purposes */
  get testingOnlyValid(): boolean {
    return this.valid;
  }

  async cleanup(): Promise<void> {
    // Start off by stopping telemetry streaming.
    await this.removeStreamHandler?.();
    // Set valid to false so if we read again, we know to update the buffer.
    this.valid = false;
    // Release the leading buffer.
    this.leadingBuffer?.release();
    // Clear out references.
    this.leadingBuffer = null;
    this.removeStreamHandler = null;
  }

  async value(): Promise<number> {
    // No valid channel has been set.
    if (this.props.channel === 0) return 0;
    if (!this.valid) await this.read();
    // No data has been received and no recent samples were fetched on initialization.
    if (this.leadingBuffer == null || this.leadingBuffer.length === 0) return 0;
    return this.leadingBuffer.at(-1, true) as number;
  }

  async read(): Promise<void> {
    this.valid = true;
    await this.updateStreamHandler();
  }

  private async updateStreamHandler(): Promise<void> {
    await this.removeStreamHandler?.();
    const { channel } = this.props;
    const handler: client.StreamHandler = (data) => {
      const res = data[channel];
      const newData = res.data;
      if (newData.length !== 0) {
        const first = newData[newData.length - 1];
        first.acquire();
        this.leadingBuffer?.release();
        this.leadingBuffer = first;
      }
      // Just because we didn't get a new buffer doesn't mean one wasn't allocated.
      this.notify();
    };
    this.removeStreamHandler = await this.client.stream(handler, [channel]);
  }
}

const fetchChannel = async (
  client: client.ChannelClient,
  channel: channel.Key,
  fetchFromIndex: boolean,
): Promise<channel.Channel> => {
  if (!fetchFromIndex) return await client.retrieveChannel(channel);
  const c = await client.retrieveChannel(channel);
  if (c.isIndex) return c;
  return await client.retrieveChannel(c.index);
};

const channelDataSourcePropsZ = z.object({
  timeRange: TimeRange.z,
  channel: z.number(),
  useIndexOfChannel: z.boolean().optional().default(false),
});

export type ChannelDataProps = z.input<typeof channelDataSourcePropsZ>;

// ChannelData reads a fixed time range of data from a particular channel or its index.
export class ChannelData
  extends AbstractSource<typeof channelDataSourcePropsZ>
  implements ChannelData
{
  static readonly TYPE = "series-source";
  private readonly client: client.ReadClient & client.ChannelClient;
  private data: Series[] = [];
  private valid: boolean = false;
  schema = channelDataSourcePropsZ;

  constructor(client: client.ReadClient & client.ChannelClient, props: unknown) {
    super(props);
    this.client = client;
  }

  async cleanup(): Promise<void> {
    this.data.forEach((d) => d.release());
    this.valid = false;
  }

  async value(): Promise<[bounds.Bounds, Series[]]> {
    const { timeRange, channel, useIndexOfChannel: indexOfChannel } = this.props;
    // If either of these conditions is true, leave the telem invalid
    // and return an empty array.
    if (timeRange.isZero || channel === 0) return [bounds.ZERO, []];
    const chan = await fetchChannel(this.client, channel, indexOfChannel);
    if (!this.valid) await this.readFixed(chan.key);
    let b = bounds.max(this.data.map((d) => d.bounds));
    if (chan.dataType.equals(DataType.TIMESTAMP))
      b = {
        upper: Math.min(b.upper, this.props.timeRange.end.valueOf()),
        lower: Math.max(b.lower, this.props.timeRange.start.valueOf()),
      };
    return [b, this.data];
  }

  private async readFixed(key: channel.Key): Promise<void> {
    const res = await this.client.read(this.props.timeRange, [key]);
    const newData = res[key].data;
    newData.forEach((d) => d.acquire());
    this.data = newData;
    this.valid = true;
  }
}

const streamChannelDataPropsZ = z.object({
  channel: z.number(),
  useIndexOfChannel: z.boolean().optional().default(false),
  timeSpan: TimeSpan.z,
  keepFor: TimeSpan.z.optional(),
});

export type StreamChannelDataProps = z.input<typeof streamChannelDataPropsZ>;

export class StreamChannelData
  extends AbstractSource<typeof streamChannelDataPropsZ>
  implements SeriesSource
{
  static readonly TYPE = "dynamic-series-source";
  private readonly client: client.Client;
  private readonly data: Series[] = [];
  private stopStreaming?: AsyncDestructor;
  private valid: boolean = false;
  schema = streamChannelDataPropsZ;

  constructor(client: client.Client, props: unknown) {
    super(props);
    this.client = client;
  }

  async value(): Promise<[bounds.Bounds, Series[]]> {
    const { channel, useIndexOfChannel, timeSpan } = this.props;
    if (channel === 0) return [bounds.ZERO, []];
    const now = TimeStamp.now();
    const ch = await fetchChannel(this.client, channel, useIndexOfChannel);
    if (!this.valid) await this.read(ch.key);
    let b = bounds.max(
      this.data
        .filter((d) => d.timeRange.end.after(now.sub(timeSpan)))
        .map((d) => d.bounds),
    );
    if (ch.dataType.equals(DataType.TIMESTAMP))
      b = {
        upper: b.upper,
        lower: Math.max(b.lower, b.upper - timeSpan.valueOf()),
      };
    return [b, this.data];
  }

  private async read(key: channel.Key): Promise<void> {
    const tr = TimeStamp.now().spanRange(-this.props.timeSpan);
    const res = await this.client.read(tr, [key]);
    const newData = res[key].data;
    newData.forEach((d) => d.acquire());
    this.data.push(...newData);
    await this.updateStreamHandler(key);
    this.valid = true;
  }

  private async updateStreamHandler(key: channel.Key): Promise<void> {
    if (this.stopStreaming != null) await this.stopStreaming();
    const handler: client.StreamHandler = (res) => {
      const newData = res[key].data;
      newData.forEach((d) => d.acquire());
      this.data.push(...newData);
      this.gcOutOfRangeData();
      this.notify();
    };
    this.stopStreaming = await this.client.stream(handler, [key]);
  }

  private gcOutOfRangeData(): void {
    const threshold = TimeStamp.now().sub(this.props.keepFor ?? this.props.timeSpan);
    const toGC = this.data.findIndex((d) => d.timeRange.end.before(threshold));
    if (toGC === -1) return;
    this.data.splice(toGC, 1).forEach((d) => d.release());
    this.gcOutOfRangeData();
  }

  async cleanup(): Promise<void> {
    await this.stopStreaming?.();
    this.stopStreaming = undefined;
    this.data.forEach((d) => d.release());
  }
}

type Constructor = new (client: client.Client, props: unknown) => Telem;

const REGISTRY: Record<string, Constructor> = {
  [ChannelData.TYPE]: ChannelData,
  [StreamChannelData.TYPE]: StreamChannelData,
  [StreamChannelValue.TYPE]: StreamChannelValue,
};

export class RemoteFactory implements RemoteFactory {
  type = "remote";
  private readonly client: client.Client;
  constructor(client: client.Client) {
    this.client = client;
  }

  create(spec: Spec): Telem | null {
    const V = REGISTRY[spec.type];
    if (V == null) return null;
    return new V(this.client, spec.props);
  }
}

export const channelData = (props: ChannelDataProps): SeriesSourceSpec => ({
  type: ChannelData.TYPE,
  props,
  variant: "source",
  valueType: "series",
});

export const streamChannelData = (props: StreamChannelDataProps): SeriesSourceSpec => ({
  type: StreamChannelData.TYPE,
  props,
  variant: "source",
  valueType: "series",
});

export const streamChannelValue = (
  props: Omit<StreamChannelValueProps, "units">,
): NumberSourceSpec => ({
  type: StreamChannelValue.TYPE,
  props,
  variant: "source",
  valueType: "number",
});
