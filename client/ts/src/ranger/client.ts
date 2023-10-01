// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { type AsyncTermSearcher, toArray } from "@synnaxlabs/x";

import { QueryError } from "@/errors";
import { type framer } from "@/framer";
import { type Creator } from "@/ranger/creator";
import {
  type NewPayload,
  type Key,
  type Keys,
  type Name,
  type Names,
  type Params,
  type Payload,
  analyzeParams,
} from "@/ranger/payload";
import { Range } from "@/ranger/range";
import { type Retriever } from "@/ranger/retriever";

export class Client implements AsyncTermSearcher<string, Key, Range> {
  private readonly frameClient: framer.Client;
  private readonly retriever: Retriever;
  private readonly creator: Creator;

  constructor(frameClient: framer.Client, retriever: Retriever, creator: Creator) {
    this.frameClient = frameClient;
    this.retriever = retriever;
    this.creator = creator;
  }

  async create(range: NewPayload): Promise<Range>;

  async create(ranges: NewPayload[]): Promise<Range[]>;

  async create(ranges: NewPayload | NewPayload[]): Promise<Range | Range[]> {
    const single = !Array.isArray(ranges);
    const res = this.sugar(await this.creator.create(toArray(ranges)));
    return single ? res[0] : res;
  }

  async search(term: string): Promise<Range[]> {
    return this.sugar(await this.retriever.search(term));
  }

  async page(offset: number, limit: number): Promise<Range[]> {
    return [];
  }

  async retrieve(range: Key | Name): Promise<Range>;

  async retrieve(params: Keys | Names): Promise<Range[]>;

  async retrieve(params: Params): Promise<Range | Range[]> {
    const { single, actual } = analyzeParams(params);
    const res = this.sugar(await this.retriever.retrieve(params));
    if (!single) return res;
    if (res.length === 0) throw new QueryError(`range matching ${actual} not found`);
    if (res.length > 1)
      throw new QueryError(`multiple ranges matching ${actual} found`);
    return res[0];
  }

  private sugar(payloads: Payload[]): Range[] {
    return payloads.map((payload) => {
      return new Range(payload.name, payload.timeRange, payload.key, this.frameClient);
    });
  }
}
