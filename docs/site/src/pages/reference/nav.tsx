// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { Icon } from "@synnaxlabs/media";

import { clientCLINav } from "./client-cli/nav";
import { serverCLINav } from "./server-cli/nav";

import { PageNavNode } from "@/components/PageNav";

export const referenceNav: PageNavNode = {
  key: "reference",
  name: "Reference",
  children: [clientCLINav, serverCLINav],
};
