// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { Icon, Logo } from "@synnaxlabs/media";
import { Text, Space, Button, useGLScissorRef } from "@synnaxlabs/pluto";
import { useDispatch } from "react-redux";

import { setNavdrawerVisible } from "../store";

import { ClusterToolbar, connectClusterWindowLayout } from "@/cluster";
import { createDocsLayout } from "@/docs";
import { useLayoutPlacer } from "@/layout/hooks";
import { VisToolbar } from "@/vis";
import { createLineVis } from "@/vis/line";

import "./GetStarted.css";

export const GetStarted = (): JSX.Element => {
  const placer = useLayoutPlacer();
  const dispatch = useDispatch();

  const handleCluster = (): void => {
    placer(connectClusterWindowLayout);
    dispatch(setNavdrawerVisible({ key: ClusterToolbar.key, value: true }));
  };

  const handleVisualize = (): void => {
    placer(createLineVis({}));
    dispatch(setNavdrawerVisible({ key: VisToolbar.key, value: true }));
  };

  const handleDocs = (): void => {
    placer(createDocsLayout());
  };

  const ref = useGLScissorRef({ debounce: 100 })

  return (
    <Space.Centered className="delta-get-started" align="center" size={6} ref={ref}>
      <Logo variant="title" className="delta-get-started__logo" />
      <Text level="h1">Get Started</Text>
      <Space direction="x" size="large" justify="center" wrap>
        <Button startIcon={<Icon.Cluster />} onClick={handleCluster} size="large">
          Connect a Cluster
        </Button>
        <Button startIcon={<Icon.Visualize />} onClick={handleVisualize} size="large">
          Create a Visualization
        </Button>
      </Space>
      <Text.Link target="_blank" level="h4" onClick={handleDocs}>
        Read the Documentation
      </Text.Link>
    </Space.Centered>
  );
};
