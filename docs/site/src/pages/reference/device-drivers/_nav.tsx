// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { type PageNavNode } from "@/components/PageNav/PageNav";
import { opcuaNav } from "@/pages/reference/device-drivers/opcua/_nav";

export const deviceDriversNav: PageNavNode = {
  key: "device-drivers",
  name: "Device Drivers",
  children: [
    {
      key: "/reference/device-drivers/get-started",
      href: "/reference/device-drivers/get-started",
      name: "Get Started",
    },
    opcuaNav,
  ],
};
