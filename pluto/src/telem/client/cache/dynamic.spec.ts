// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { DataType, Series } from "@synnaxlabs/x";
import { describe, expect, it } from "vitest";

import { Dynamic } from "@/telem/client/cache/dynamic";

describe("DynamicCache", () => {
  describe("write", () => {
    it("Should correctly allocate a buffer", () => {
      const cache = new Dynamic(100, DataType.FLOAT32);
      const arr = new Series({
        data: new Float32Array([1, 2, 3]),
        dataType: DataType.FLOAT32,
      });
      const { flushed, allocated } = cache.write([arr]);
      expect(flushed).toHaveLength(0);
      expect(allocated).toHaveLength(1);
      expect(cache.length).toEqual(arr.length);
    });
    it("Should not allocate a new buffer when the current buffer has sufficient space", () => {
      const cache = new Dynamic(100, DataType.FLOAT32);
      const arr = new Series({
        data: new Float32Array([1, 2, 3]),
        dataType: DataType.FLOAT32,
      });
      cache.write([arr]);
      const { flushed, allocated } = cache.write([arr.reAlign(3)]);
      expect(flushed).toHaveLength(0);
      expect(allocated).toHaveLength(0);
      expect(cache.length).toEqual(arr.length * 2);
    });
    it("should correctly allocate a single new buffer when the current one is full", () => {
      const cache = new Dynamic(2, DataType.FLOAT32);
      const arr = new Series({
        data: new Float32Array([1, 2, 3]),
        dataType: DataType.FLOAT32,
      });
      const { flushed, allocated } = cache.write([arr]);
      expect(flushed).toHaveLength(1);
      expect(allocated).toHaveLength(2);
      expect(flushed[0]).toBe(allocated[0]);
      expect(cache.length).toEqual(1);
    });
    it("should correctly allocate multiple new buffers when the current one is full", () => {
      const cache = new Dynamic(1, DataType.FLOAT32);
      const arr = new Series({
        data: new Float32Array([1, 2, 3]),
        dataType: DataType.FLOAT32,
      });
      const { flushed, allocated } = cache.write([arr]);
      expect(flushed).toHaveLength(2);
      expect(allocated).toHaveLength(3);
      expect(cache.length).toEqual(1);
    });
    it("it should correctly set multiple writes", () => {
      const cache = new Dynamic(10, DataType.FLOAT32);
      const arr = new Series({
        data: new Float32Array([1, 2, 3]),
        dataType: DataType.FLOAT32,
      });
      expect(cache.write([arr]).allocated).toHaveLength(1);
      expect(cache.write([arr.reAlign(3)]).allocated).toHaveLength(0);
      expect(cache.write([arr.reAlign(6)]).allocated).toHaveLength(0);
      const { flushed, allocated } = cache.write([arr.reAlign(9)]);
      expect(allocated).toHaveLength(1);
      expect(flushed).toHaveLength(1);
      expect(flushed[0].data.slice(0, 3)).toEqual(new Float32Array([1, 2, 3]));
      expect(flushed[0].data.slice(3, 6)).toEqual(new Float32Array([1, 2, 3]));
      expect(flushed[0].data.slice(6, 9)).toEqual(new Float32Array([1, 2, 3]));
      expect(flushed[0].data.slice(9)).toEqual(new Float32Array([1]));
    });
    it("should allocate a new buffer if the two series are out of alignment", () => {
      const cache = new Dynamic(10, DataType.FLOAT32);
      const s1 = new Series({
        data: new Float32Array([1, 2, 3]),
        dataType: DataType.FLOAT32,
      });
      const { flushed, allocated } = cache.write([s1]);
      expect(flushed).toHaveLength(0);
      expect(allocated).toHaveLength(1);
      const s2 = s1.reAlign(5);
      const { flushed: f2, allocated: a2 } = cache.write([s2]);
      expect(f2).toHaveLength(1);
      expect(a2).toHaveLength(1);
    });
    it("in the smae write, it should allocate a new buffer if the two series are out of alignment", () => {
      const cache = new Dynamic(10, DataType.FLOAT32);
      const s1 = new Series({
        data: new Float32Array([1, 2, 3]),
        dataType: DataType.FLOAT32,
      });
      const s2 = s1.reAlign(5);
      const { flushed, allocated } = cache.write([s1, s2]);
      expect(flushed).toHaveLength(1);
      expect(allocated).toHaveLength(2);
    });
  });
});
