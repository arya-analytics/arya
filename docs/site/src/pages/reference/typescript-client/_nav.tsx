// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { type PageNavNode } from "@/components/PageNav/PageNav";

export const typescriptClientNav: PageNavNode = {
  key: "typescript-client",
  name: "Typescript Client",
  children: [
    {
      key: "/reference/typescript-client/get-started",
      href: "/reference/typescript-client/get-started",
      name: "Get Started",
    },
    {
      key: "/reference/typescript-client/channels",
      href: "/reference/typescript-client/channels",
      name: "Channels",
    },
    {
      key: "/reference/typescript-client/read-data",
      href: "/reference/typescript-client/read-data",
      name: "Read Data",
    },
    {
      key: "/reference/typescript-client/write-data",
      href: "/reference/typescript-client/write-data",
      name: "Write Data",
    },
    {
      key: "/reference/typescript-client/stream-data",
      href: "/reference/typescript-client/stream-data",
      name: "Stream Data",
    },
    {
      key: "/reference/typescript-client/series-and-frames",
      href: "/reference/typescript-client/series-and-frames",
      name: "Series and Frames",
    },
    {
      key: "/reference/typescript-client/examples",
      href: "/reference/typescript-client/examples",
      name: "Examples",
    },
  ],
};
