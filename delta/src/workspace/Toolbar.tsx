// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { type ReactElement } from "react";

import { Icon } from "@synnaxlabs/media";
import { Align, Accordion } from "@synnaxlabs/pluto";
import { useDispatch } from "react-redux";

import { ToolbarHeader, ToolbarTitle } from "@/components";
import { Layout } from "@/layout";
import { Range } from "@/range";
import { Vis } from "@/vis";
import { VisList } from "@/workspace/VisList";

const Content = (): ReactElement => {
  const dispatch = useDispatch();

  const handleCreateVis = (): void => {
    dispatch(Vis.create({}));
    dispatch(Layout.setNavdrawerVisible({ key: Vis.Toolbar.key, value: true }));
  };

  return (
    <Align.Space empty style={{ height: "100%" }}>
      <ToolbarHeader>
        <ToolbarTitle icon={<Icon.Workspace />}>Workspace</ToolbarTitle>
      </ToolbarHeader>
      <Accordion.Accordion
        data={[
          {
            key: "ranges",
            name: "Ranges",
            content: <Range.List />,
          },
          {
            key: "visualizations",
            name: "Visualizations",
            content: <VisList />,
            actions: [
              {
                children: <Icon.Add />,
                onClick: () => handleCreateVis(),
              },
            ],
          },
        ]}
      />
    </Align.Space>
  );
};

export const Toolbar: Layout.NavDrawerItem = {
  key: "workspace",
  icon: <Icon.Workspace />,
  content: <Content />,
  tooltip: "Workspace",
  initialSize: 350,
  minSize: 250,
  maxSize: 500,
};
