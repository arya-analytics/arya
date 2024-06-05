// Copyright 2024 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { Link } from "@/link";
import { setActive } from "@/cluster/slice";

export const linkHandler: Link.Handler = ({
  resource,
  resourceKey,
  clusters,
  dispatch,
}) => {
  if (resource !== "cluster") return false;
  const clusterKey = resourceKey;
  if (clusters.find((cluster) => cluster.key === clusterKey) == undefined) {
    // Console does not have this cluster in store.
    console.error(
      `Error: Cannot open URL, cluster with key ${clusterKey} is not found.`,
    );
    return false;
  }
  dispatch(setActive(clusterKey));
  return true;
};
