// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { DataType, Rate, TimeSpan, TimeStamp } from "@synnaxlabs/x/telem";
import { describe, expect, it } from "vitest";

import { QueryError } from "@/errors";
import { type NewPayload } from "@/ranger/payload";
import { newClient } from "@/setupspecs";

const client = newClient();

describe("Ranger", () => {
  describe("create", () => {
    it("should create a single range", async () => {
      const timeRange = TimeStamp.now().spanRange(TimeSpan.seconds(1));
      const range = await client.ranges.create({
        name: "My New One Second Range",
        timeRange,
      });
      expect(range.key).not.toHaveLength(0);
      expect(timeRange).toEqual(range.timeRange);
    });
    it("should create multiple ranges", async () => {
      const ranges: NewPayload[] = [
        {
          name: "My New One Second Range",
          timeRange: TimeStamp.now().spanRange(TimeSpan.seconds(1)),
        },
        {
          name: "My New Two Second Range",
          timeRange: TimeStamp.now().spanRange(TimeSpan.seconds(2)),
        },
      ];
      const createdRanges = await client.ranges.create(ranges);
      expect(createdRanges).toHaveLength(2);
      expect(createdRanges[0].key).not.toHaveLength(0);
      expect(createdRanges[1].key).not.toHaveLength(0);
      expect(createdRanges[0].timeRange).toEqual(ranges[0].timeRange);
      expect(createdRanges[1].timeRange).toEqual(ranges[1].timeRange);
    });
  });

  describe("delete", () => {
    it("should delete a single range", async () => {
      const timeRange = TimeStamp.now().spanRange(TimeSpan.seconds(1));
      const range = await client.ranges.create({
        name: "My New One Second Range",
        timeRange,
      });
      await client.ranges.delete(range.key);
      await expect(async () => await client.ranges.retrieve(range.key)).rejects.toThrow(
        QueryError,
      );
    });
  });

  describe("rename", () => {
    it("should rename a single range", async () => {
      const timeRange = TimeStamp.now().spanRange(TimeSpan.seconds(1));
      const range = await client.ranges.create({
        name: "My New One Second Range",
        timeRange,
      });
      await client.ranges.rename(range.key, "My New One Second Range Renamed");
      const renamed = await client.ranges.retrieve(range.key);
      expect(renamed.name).toEqual("My New One Second Range Renamed");
    });
  });

  describe("retrieve", () => {
    it("should retrieve a range by key", async () => {
      const timeRange = TimeStamp.now().spanRange(TimeSpan.seconds(1));
      const range = await client.ranges.create({
        name: "My New One Second Range",
        timeRange,
      });
      const retrieved = await client.ranges.retrieve(range.key);
      expect(retrieved.key).toEqual(range.key);
      expect(retrieved.timeRange).toEqual(range.timeRange);
    });
    it("should retrieve a range by name", async () => {
      const timeRange = TimeStamp.now().spanRange(TimeSpan.seconds(1));
      const range = await client.ranges.create({
        name: "My New Three Second Range",
        timeRange,
      });
      const retrieved = await client.ranges.retrieve([range.name]);
      expect(retrieved.length).toBeGreaterThan(0);
      expect(retrieved[0].name).toEqual(range.name);
    });
  });

  describe("KV", () => {
    it("should set, get, and delete a single key", async () => {
      const rng = await client.ranges.create({
        name: "My New One Second Range",
        timeRange: TimeStamp.now().spanRange(TimeSpan.seconds(1)),
      });
      await rng.kv.set("foo", "bar");
      const val = await rng.kv.get("foo");
      expect(val).toEqual("bar");
      await rng.kv.delete("foo");
      await expect(async () => await rng.kv.get("foo")).rejects.toThrow(QueryError);
    });

    it("should set and get multiple keys", async () => {
      const rng = await client.ranges.create({
        name: "My New One Second Range",
        timeRange: TimeStamp.now().spanRange(TimeSpan.seconds(1)),
      });
      await rng.kv.set({ foo: "bar", baz: "qux" });
      const res = await rng.kv.get(["foo", "baz"]);
      expect(res).toEqual({ foo: "bar", baz: "qux" });
    });
  });

  describe("Alias", () => {
    describe("list", () => {
      it("should list the aliases for the range", async () => {
        const ch = await client.channels.create({
          name: "My New Channel",
          dataType: DataType.FLOAT32,
          rate: Rate.hz(1),
        });
        const rng = await client.ranges.create({
          name: "My New One Second Range",
          timeRange: TimeStamp.now().spanRange(TimeSpan.seconds(1)),
        });
        await rng.setAlias(ch.key, "myalias");
        const aliases = await rng.listAliases();
        expect(aliases).toEqual({ [ch.key]: "myalias" });
      });
    });
  });

  describe("Active", () => {
    describe("setActive", () => {
      it("should create and set a range as active", async () => {
        const rng = await client.ranges.create({
          name: "My New One Second Range",
          timeRange: TimeStamp.now().spanRange(TimeSpan.seconds(1)),
        });
        await client.ranges.setActive(rng.key);
        const retrieved = await client.ranges.retrieveActive();
        expect(retrieved).not.toBeNull();
        expect(retrieved?.key).toEqual(rng.key);
      });
      it("should clear the active range", async () => {
        const rng = await client.ranges.create({
          name: "My New One Second Range",
          timeRange: TimeStamp.now().spanRange(TimeSpan.seconds(1)),
        });
        await client.ranges.setActive(rng.key);
        await client.ranges.clearActive(rng.key);
        const retrieved = await client.ranges.retrieveActive();
        expect(retrieved).toBeNull();
      });
    });
  });

  describe("Labels", () => {
    describe("set", () => {
      it("should set a label on a range", async () => {
        const rng = await client.ranges.create({
          name: "My New One Second Range",
          timeRange: TimeStamp.now().spanRange(TimeSpan.seconds(1)),
        });
        const lbl = await client.labels.create({
          name: "My New Label",
          color: "#E774D0",
        });
        await rng.addLabel(lbl.key);
        const retrieved = await rng.labels();
        expect(retrieved).toEqual([lbl]);
      });
    });
    describe("remove", () => {
      it("should remove a label from a range", async () => {
        const rng = await client.ranges.create({
          name: "My New One Second Range",
          timeRange: TimeStamp.now().spanRange(TimeSpan.seconds(1)),
        });
        const lbl = await client.labels.create({
          name: "My New Label",
          color: "#E774D0",
        });
        await rng.addLabel(lbl.key);
        await rng.removeLabel(lbl.key);
        const retrieved = await rng.labels();
        expect(retrieved).toEqual([]);
      });
    });
  });
});
