// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { type PageNavNode } from "@/components/PageNav/PageNav";

export const sysAdminNav: PageNavNode = {
  key: "sys-admin",
  name: "System Administrators",
  children: [
    {
      name: "Concepts",
      href: "/guides/sys-admin/concepts",
      key: "/guides/sys-admin/concepts",
    },
    {
      name: "Deployment with Self-Signed Certificates",
      href: "/guides/sys-admin/deployment-self-signed",
      key: "/guides/sys-admin/deployment-self-signed",
    },
  ],
};
