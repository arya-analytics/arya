// Copyright 2024 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { type ReactElement } from "react";

import { DataType } from "@synnaxlabs/x";
import { z } from "zod";

const groupZ = z.object({
  name: z.string(),
  channelCount: z.number(),
  dataType: z.number(),
});

export const Channels = (): ReactElement => {};
