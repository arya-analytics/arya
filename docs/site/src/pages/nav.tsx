// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { createElement } from "react";

import { HiLightningBolt } from "react-icons/hi";

import { acquireNav } from "./acquire/nav";
import { analyzeNav } from "./analyze/nav";
import { deployNav } from "./deploy/nav";
import { rfcNav } from "./rfc/nav";
import { visualizeNav } from "./visualize/nav";

export const pages = [
  {
    name: "Get Started",
    key: "/",
    url: "/",
    icon: createElement(HiLightningBolt),
  },
  deployNav,
  acquireNav,
  analyzeNav,
  visualizeNav,
  rfcNav,
];
