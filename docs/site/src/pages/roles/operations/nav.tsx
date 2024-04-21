// Copyright 2024 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { type PageNavNode } from "@/components/PageNav/PageNav";

export const operationsNav: PageNavNode = {
  key: "operations",
  name: "Test and Operations",
  children: [
    {
      name: "Synnax for Test and Operations",
      href: "/roles/operations/overview",
      key: "/roles/operations/overview",
    },
    {
      name: "Manually Controlling Simulated Tank Pressure",
      href: "/roles/operations/manual-tank-pressure",
      key: "/roles/operations/manual-tank-pressure",
    },
    {
      name: "Writing and Simulating a Pressure Control Sequence",
      href: "/roles/operations/automated-tank-pressure",
      key: "/roles/operations/automated-tank-pressure",
    },
  ],
};
