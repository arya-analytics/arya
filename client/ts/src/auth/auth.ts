// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import type { Middleware, UnaryClient } from "@synnaxlabs/freighter";
import { z } from "zod";

import { InvalidTokenError } from "@/errors";
import { user } from "@/user";

export const insecureCredentialsZ = z.object({
  username: z.string(),
  password: z.string(),
});
export type InsecureCredentials = z.infer<typeof insecureCredentialsZ>;

export const tokenResponseZ = z.object({
  token: z.string(),
  user: user.payloadZ,
});

export type TokenResponse = z.infer<typeof tokenResponseZ>;

const LOGIN_ENDPOINT = "/auth/login";

const MAX_RETRIES = 3;

export class Client {
  token: string | undefined;
  private readonly client: UnaryClient;
  private readonly credentials: InsecureCredentials;
  private authenticating: Promise<Error | null> | undefined;
  authenticated: boolean;
  user: user.Payload | undefined;
  private retryCount: number;

  constructor(client: UnaryClient, credentials: InsecureCredentials) {
    this.client = client;
    this.authenticated = false;
    this.credentials = credentials;
    this.retryCount = 0;
  }

  middleware(): Middleware {
    const mw: Middleware = async (reqCtx, next) => {
      if (!this.authenticated && !reqCtx.target.endsWith(LOGIN_ENDPOINT)) {
        if (this.authenticating == null)
          this.authenticating = new Promise(async (resolve) => {
            const [res, err] = await this.client.send(
              LOGIN_ENDPOINT,

              this.credentials,
              insecureCredentialsZ,
              tokenResponseZ,
            );
            if (err != null) return resolve(err);
            this.token = res?.token;
            this.user = res?.user;
            this.authenticated = true;
            resolve(null);
          });
        const err = await this.authenticating;
        if (err != null) return [reqCtx, err];
      }
      reqCtx.params.Authorization = `Bearer ${this.token}`;
      const [resCtx, err] = await next(reqCtx);
      if (err instanceof InvalidTokenError && this.retryCount < MAX_RETRIES) {
        this.authenticated = false;
        this.authenticating = undefined;
        this.retryCount += 1;
        return mw(reqCtx, next);
      }
      this.retryCount = 0;
      return [resCtx, err];
    };
    return mw;
  }
}
