// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { Layout } from "@/layout";
import { Create,CREATE_LAYOUT_TYPE } from "@/workspace/Create";

export * from "@/workspace/Create";
export * from "@/workspace/ontology";
export * from "@/workspace/palette";
export * from "@/workspace/Recent";
export * from "@/workspace/Selector";
export * from "@/workspace/selectors";
export * from "@/workspace/slice";
export * from "@/workspace/syncer";

export const LAYOUTS: Record<string, Layout.Renderer> = {
  [CREATE_LAYOUT_TYPE]: Create,
};
