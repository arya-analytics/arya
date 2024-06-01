// Copyright 2024 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { z } from "zod";

export class Authority extends Number {
  static readonly Absolute = 255;
  static readonly Default = 1;

  static readonly z = z.union([
    z.instanceof(Authority),
    z
      .number()
      .int()
      .min(0)
      .max(255)
      .transform((n) => new Authority(n)),
    z.instanceof(Number).transform((n) => new Authority(n)),
  ]);
}
