// Copyright 2024 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { sendRequired, type UnaryClient } from "@synnaxlabs/freighter";
import { type AsyncTermSearcher } from "@synnaxlabs/x/search";
import { toArray } from "@synnaxlabs/x/toArray";
import { z } from "zod";

import { type framer } from "@/framer";
import { type task } from "@/hardware/task";
import { analyzeParams, checkForMultipleOrNoResults } from "@/util/retrieve";
import { nullableArrayZ } from "@/util/zod";

export const rackKeyZ = z.number();

export type RackKey = z.infer<typeof rackKeyZ>;

export const rackZ = z.object({
  key: rackKeyZ,
  name: z.string(),
});

export type RackPayload = z.infer<typeof rackZ>;

export const newRackZ = rackZ.partial({ key: true });

export type NewRack = z.input<typeof newRackZ>;

const RETRIEVE_ENDPOINT = "/hardware/rack/retrieve";
const CREATE_RACK_ENDPOINT = "/hardware/rack/create";
const DELETE_RACK_ENDPOINT = "/hardware/rack/delete";

const retrieveRackReqZ = z.object({
  keys: rackKeyZ.array().optional(),
  names: z.string().array().optional(),
  search: z.string().optional(),
  offset: z.number().optional(),
  limit: z.number().optional(),
});

const retrieveRackResZ = z.object({
  racks: nullableArrayZ(rackZ),
});

const createReqZ = z.object({
  racks: newRackZ.array(),
});

const createResZ = z.object({
  racks: rackZ.array(),
});

const deleteReqZ = z.object({
  keys: rackKeyZ.array(),
});

const deleteResZ = z.object({});

export class Client implements AsyncTermSearcher<string, RackKey, Rack> {
  private readonly client: UnaryClient;
  private readonly frameClient: framer.Client;
  private readonly tasks: task.Client;

  constructor(
    client: UnaryClient,
    frameClient: framer.Client,
    taskClient: task.Client,
  ) {
    this.client = client;
    this.frameClient = frameClient;
    this.tasks = taskClient;
  }

  async delete(keys: RackKey | RackKey[]): Promise<void> {
    await sendRequired<typeof deleteReqZ, typeof deleteResZ>(
      this.client,
      DELETE_RACK_ENDPOINT,
      { keys: toArray(keys) },
      deleteReqZ,
      deleteResZ,
    );
  }

  async create(rack: NewRack): Promise<Rack>;

  async create(racks: NewRack[]): Promise<Rack[]>;

  async create(rack: NewRack | NewRack[]): Promise<Rack | Rack[]> {
    const isSingle = !Array.isArray(rack);
    const res = await sendRequired<typeof createReqZ, typeof createResZ>(
      this.client,
      CREATE_RACK_ENDPOINT,
      { racks: toArray(rack) },
      createReqZ,
      createResZ,
    );
    const sugared = this.sugar(res.racks);
    if (isSingle) return sugared[0];
    return sugared;
  }

  async search(term: string): Promise<Rack[]> {
    const res = await sendRequired<typeof retrieveRackReqZ, typeof retrieveRackResZ>(
      this.client,
      RETRIEVE_ENDPOINT,
      { search: term },
      retrieveRackReqZ,
      retrieveRackResZ,
    );
    return this.sugar(res.racks);
  }

  async page(offset: number, limit: number): Promise<Rack[]> {
    const res = await sendRequired<typeof retrieveRackReqZ, typeof retrieveRackResZ>(
      this.client,
      RETRIEVE_ENDPOINT,
      { offset, limit },
      retrieveRackReqZ,
      retrieveRackResZ,
    );
    return this.sugar(res.racks);
  }

  async retrieve(key: string | RackKey): Promise<Rack>;

  async retrieve(keys: number[] | RackKey[]): Promise<Rack[]>;

  async retrieve(
    params: string | RackKey | string[] | RackKey[],
  ): Promise<Rack | Rack[]> {
    const { variant, normalized, single } = analyzeParams(params, {
      string: "names",
      number: "keys",
    });
    const res = await sendRequired<typeof retrieveRackReqZ, typeof retrieveRackResZ>(
      this.client,
      RETRIEVE_ENDPOINT,
      { [variant]: normalized },
      retrieveRackReqZ,
      retrieveRackResZ,
    );
    const sugared = this.sugar(res.racks);
    checkForMultipleOrNoResults("Rack", params, sugared, single);
    return single ? sugared[0] : sugared;
  }

  private sugar(payloads: RackPayload[]): Rack[] {
    return payloads.map(({ key, name }) => new Rack(key, name, this.tasks));
  }
}

export class Rack {
  key: number;
  name: string;
  private readonly tasks: task.Client;

  constructor(key: number, name: string, client: task.Client) {
    this.key = key;
    this.name = name;
    this.tasks = client;
  }

  async listTasks(): Promise<task.Task[]> {
    return await this.tasks.retrieve(this.key);
  }

  async retrieveTasks(): Promise<task.Task[]> {
    return [];
  }

  async createTask(task: task.NewTask): Promise<task.Task> {
    task.key = (
      (BigInt(this.key) << 32n) +
      (BigInt(task.key ?? 0) & 0xffffffffn)
    ).toString();
    const res = await this.tasks.create([task]);
    return res[0];
  }

  async deleteTask(task: bigint): Promise<void> {
    await this.tasks.delete([task]);
  }
}
