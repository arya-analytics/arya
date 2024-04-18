// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { DataType, Series, TimeStamp } from "@synnaxlabs/x";

import { convertSeriesFloat32 } from "@/telem/aether/convertSeries";

/** Response from a write to the @see Dynamic cache. */
export interface DynamicWriteResponse {
  /** A list of series that were flushed from the cache during the write i.e. the new
   * writes were not able to fit in the current buffer, so a new one was allocated
   * and the old one(s) were flushed. */
  flushed: Series[];
  /** A list of series that were allocated during the write. */
  allocated: Series[];
}

/** Props for the @see Dynamic cache. */
export interface DynamicProps {
  /**
   * Sets the maximum size of the buffer that the cache will maintain before flushing
   * data out to the caller.
   */
  dynamicBufferSize: number;
  /**
   * Sets the data type for the series written to the cache. Used for buffer allocation
   * purposes.
   */
  dataType: DataType;
}

/**
 * A cache for channel data that maintains a single, rolling Series as a buffer
 * for channel data.
 */
export class Dynamic {
  private readonly props: DynamicProps;

  private counter = 0;
  /** Current buffer */
  private buffer: Series | null;

  /**
   * @constructor
   *
   * @param cap - The capacity of the cache buffer.
   * @param dataType - The data type of the channel.
   */
  constructor(props: DynamicProps) {
    this.props = props;
    this.buffer = null;
  }

  /** @returns the number of samples currenly held in the cache. */
  get length(): number {
    return this.buffer?.length ?? 0;
  }

  /**
   * @returns the current buffer being written to by the cache. Under no circumstances
   * should this be modified by the caller.
   */
  get leadingBuffer(): Series | null {
    return this.buffer;
  }

  /**
   * Writes the given arrays to the cache.
   *
   * @returns a list of buffers that were filled by the cache during the write. If
   * the current buffer is able to fit all writes, no buffers will be returned.
   */
  write(series: Series[]): DynamicWriteResponse {
    const responses = series.flatMap((arr) => this._write(arr));
    return {
      flushed: responses.flatMap((res) => res.flushed),
      allocated: responses.flatMap((res) => res.allocated),
    };
  }

  private allocate(capacity: number, alignment: number, start: TimeStamp): Series {
    this.counter++;
    return Series.alloc({
      capacity,
      dataType: DataType.FLOAT32,
      timeRange: start.range(TimeStamp.MAX),
      sampleOffset: this.props.dataType.equals(DataType.TIMESTAMP)
        ? BigInt(start.valueOf())
        : 0,
      glBufferUsage: "dynamic",
      alignment,
      key: `dynamic-${this.counter}`,
    });
  }

  private _write(series: Series): DynamicWriteResponse {
    const { dynamicBufferSize: cap } = this.props;
    const res: DynamicWriteResponse = { flushed: [], allocated: [] };
    // This only happens on the first write to the cache
    if (this.buffer == null) {
      this.buffer = this.allocate(cap, series.alignment, TimeStamp.now());
      res.allocated.push(this.buffer);
    } else if (
      Math.abs(this.buffer.alignment + this.buffer.length - series.alignment) > 1
    ) {
      // This case occurs when the alignment of the incoming series does not match
      // the alignment of the current buffer. In this case, we flush the current buffer
      // and allocate a new one.
      const now = TimeStamp.now();
      this.buffer.timeRange.end = now;
      res.flushed.push(this.buffer);
      this.buffer = this.allocate(cap, series.alignment, now);
      res.allocated.push(this.buffer);
    }
    const converted = convertSeriesFloat32(series, this.buffer.sampleOffset);
    const amountWritten = this.buffer.write(converted);
    // This means that the current buffer is large enough to fit the entire incoming
    // series. We're done in this case.
    if (amountWritten === series.length) return res;
    // Push the current buffer to the flushed list.
    const now = TimeStamp.now();
    this.buffer.timeRange.end = now;
    res.flushed.push(this.buffer);
    this.buffer = this.allocate(cap, series.alignment + amountWritten, now);
    res.allocated.push(this.buffer);
    const nextRes = this._write(series.slice(amountWritten));
    res.flushed.push(...nextRes.flushed);
    res.allocated.push(...nextRes.allocated);
    return res;
  }

  /**
   * Closes the cache and releases all resources associated with it. After close()
   * is called, the cache should not be used again.
   */
  close(): void {
    this.buffer = null;
  }
}
