// Copyright 2024 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { policy } from "@synnaxlabs/client";
import { z } from "zod";

export const stateZ = z.object({
  version: z.literal("0.0.0"),
  policies: policy.policyZ.array(),
});

export type State = z.infer<typeof stateZ>;

export const ZERO_STATE: State = { version: "0.0.0", policies: [] };
