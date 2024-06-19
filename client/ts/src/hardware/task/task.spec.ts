// Copyright 2024 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { nanoid } from "nanoid";
import { describe, expect, it } from "vitest";

import { task } from "@/hardware/task";
import { newClient } from "@/setupspecs";

const client = newClient();

describe("Hardware", () => {
  describe("Task", () => {
    describe("create", () => {
      it("should create a task on a rack", async () => {
        const r = await client.hardware.racks.create({ name: "test" });
        const m = await r.createTask({
          name: "test",
          config: { a: "dog" },
          type: "ni",
        });
        expect(m.key).not.toHaveLength(0);
        const rackKey = BigInt(m.key) >> 32n;
        expect(Number(rackKey)).toBe(r.key);
      });
    });
    describe("retrieve", () => {
      it("should retrieve a task by its key", async () => {
        const r = await client.hardware.racks.create({ name: "test" });
        const m = await r.createTask({
          name: "test",
          config: { a: "dog" },
          type: "ni",
        });
        const retrieved = await client.hardware.tasks.retrieve(m.key);
        expect(retrieved.key).toBe(m.key);
        expect(retrieved.name).toBe("test");
        expect(retrieved.config).toStrictEqual({ a: "dog" });
        expect(retrieved.type).toBe("ni");
      });
    });
    describe("retrieveByName", () => {
      it("should retrieve a task by its name", async () => {
        const name = `test-${Date.now()}-${Math.random()}`;
        const r = await client.hardware.racks.create({ name });
        const m = await r.createTask({
          name,
          config: { a: "dog" },
          type: "ni",
        });
        const retrieved = await client.hardware.tasks.retrieveByName(name);
        expect(retrieved.key).toBe(m.key);
      });
    });
    describe("retrieve with state", () => {
      it("should also send the tasks state", async () => {
        const r = await client.hardware.racks.create({ name: "test" });
        const t = await r.createTask({
          name: "test",
          config: { a: "dog" },
          type: "ni",
        });
        const w = await client.openWriter(["sy_task_state"]);
        interface StateDetails {
          dog: string;
        }
        const state: task.State<StateDetails> = {
          key: nanoid(),
          task: t.key,
          variant: "success",
        };
        expect(await w.write("sy_task_state", [state])).toBeTruthy();
        await w.close();
        const retrieved = await client.hardware.tasks.retrieve(t.key, {
          includeState: true,
        });
        expect(retrieved.state).not.toBeNull();
        expect(retrieved.state?.variant).toBe(state.variant);
      });
    });
  });
});
