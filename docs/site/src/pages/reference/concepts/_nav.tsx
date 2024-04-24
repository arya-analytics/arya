// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { Icon } from "@synnaxlabs/media";

import { PageNavNode } from "@/components/PageNav/PageNav";

export const conceptsNav: PageNavNode = {
  key: "concepts",
  name: "Concepts",
  children: [
    {
      key: "/reference/concepts/overview",
      href: "/reference/concepts/overview",
      name: "Overview",
    },
    {
      key: "/reference/concepts/clusters-and-nodes",
      href: "/reference/concepts/clusters-and-nodes",
      name: "Clusters and Nodes",
    },
    {
      key: "/reference/concepts/channels",
      href: "/reference/concepts/channels",
      name: "Channels",
    },
    {
      key: "/reference/concepts/write-domains",
      href: "/reference/concepts/write-domains",
      name: "Write Domains",
    },
    {
      key: "/reference/concepts/read-ranges",
      href: "/reference/concepts/read-ranges",
      name: "Read Ranges",
    },
  ],
};
