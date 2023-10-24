// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { Icon } from "@synnaxlabs/media";

import { PageNavNode } from "@/components/PageNav";

export const deployNav: PageNavNode = {
  key: "deploy",
  name: "Deploy",
  children: [
    {
      key: "/deploy/get-started",
      href: "/deploy/get-started",
      name: "Get Started",
    },
    {
      key: "/deploy/requirements",
      href: "/deploy/requirements",
      name: "Requirements",
    },
  ],
};
