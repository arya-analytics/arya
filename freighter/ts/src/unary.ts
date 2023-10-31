// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { type z } from "zod";

import { type Transport } from "@/transport";

/**
 * An interface for an entity that implements a simple request-response
 * transport between two entities.
 */
export interface UnaryClient extends Transport {
  /**
   * Sends a request to the target server and waits until a response is received.
   * @param target - The target server to send the request to.
   * @param req - The request to send.
   * @param resSchema - The schema to validate the response against.
   */
  send: <RQ extends z.ZodTypeAny, RS extends z.ZodTypeAny = RQ>(
    target: string,
    req: z.input<RQ> | null,
    resSchema: RS | null,
  ) => Promise<[z.output<RS>, null] | [null, Error]>;
}

export const sendRequired = async <
  RQ extends z.ZodTypeAny,
  RS extends z.ZodTypeAny = RQ,
>(
  client: UnaryClient,
  target: string,
  req: z.input<RQ>,
  resSchema: RS | null,
): Promise<z.output<RS>> => {
  const [res, err] = await client.send(target, req, resSchema);
  if (err != null) throw err;
  return res;
};
