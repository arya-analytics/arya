// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { DataType, Series, TimeStamp } from "@synnaxlabs/x";

import { convertSeriesFloat32 } from "@/telem/core/convertSeries";

export interface DynamicWriteResponse {
  flushed: Series[];
  allocated: Series[];
}

/**
 * A cache for channel data that maintains a single, rolling Series as a buffer
 * for channel data.
 */
export class Dynamic {
  buffer: Series | null;
  private readonly cap: number;
  private readonly dataType: DataType;

  /**
   * @constructor
   *
   * @param cap - The capacity of the cache buffer.
   * @param dataType - The data type of the channel.
   */
  constructor(cap: number, dataType: DataType) {
    this.cap = cap;
    this.dataType = dataType;
    this.buffer = null;
  }

  /** @returns the number of samples currenly held in the cache. */
  get length(): number {
    return this.buffer?.length ?? 0;
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

  private allocate(length: number, alignment: number): Series {
    const start = TimeStamp.now();
    return Series.alloc(
      length,
      DataType.FLOAT32,
      start.spanRange(TimeStamp.MAX),
      this.dataType.equals(DataType.TIMESTAMP) ? start.valueOf() : 0,
      "dynamic",
      alignment,
    );
  }

  private _write(series: Series): DynamicWriteResponse {
    // This only happens on the first write to the cache.
    const res: DynamicWriteResponse = { flushed: [], allocated: [] };
    if (this.buffer == null) {
      this.buffer = this.allocate(this.cap, series.alignment);
      res.allocated.push(this.buffer);
    } else if (
      Math.abs(this.buffer.alignment + this.buffer.length - series.alignment) > 1
    ) {
      // This case occurs when the alignment of the incoming series does not match
      // the alignment of the current buffer. In this case, we flush the current buffer
      // and allocate a new one.
      res.flushed.push(this.buffer);
      this.buffer = this.allocate(this.cap, series.alignment);
      res.allocated.push(this.buffer);
    }
    const converted = convertSeriesFloat32(series, this.buffer.sampleOffset);
    const amountWritten = this.buffer.write(converted);
    if (amountWritten === series.length) return res;
    res.flushed.push(this.buffer);
    this.buffer = this.allocate(this.cap, series.alignment + amountWritten);
    res.allocated.push(this.buffer);
    const nextRes = this._write(series.slice(amountWritten));
    res.flushed.push(...nextRes.flushed);
    res.allocated.push(...nextRes.allocated);
    return res;
  }
}
