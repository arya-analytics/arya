// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { ReactElement, useCallback } from "react";

import { Icon } from "@synnaxlabs/media";
import { Space, Tab, Tabs, Client } from "@synnaxlabs/pluto";

import { PIDElements } from "./PIDElements";
import { PIDProperties } from "./PIDProperties";

import { ToolbarHeader, ToolbarTitle } from "@/components";
import { useSelectLayout, useSelectRequiredLayout } from "@/layout";

export interface PIDToolbar {
  layoutKey: string;
}

const TABS = [
  {
    tabKey: "elements",
    name: "Elements",
  },
  {
    tabKey: "properties",
    name: "Properties",
  },
];

export const PIDToolbar = ({ layoutKey }: PIDToolbar): ReactElement => {
  const { name } = useSelectRequiredLayout(layoutKey);
  const content = useCallback(
    ({ tabKey }: Tab): ReactElement => {
      switch (tabKey) {
        case "properties":
          return <PIDProperties layoutKey={layoutKey} />;
        case "elements":
          return <PIDElements layoutKey={layoutKey} />;
      }
    },
    [layoutKey]
  );

  const tabsProps = Tabs.useStatic({
    tabs: TABS,
    content,
  });

  return (
    <Space empty>
      <Tabs.Provider value={tabsProps}>
        <ToolbarHeader>
          <ToolbarTitle icon={<Icon.Control />}>{name}</ToolbarTitle>
          <Tabs.Selector style={{ borderBottom: "none" }} size="large" />
        </ToolbarHeader>
        <Tabs.Content />
      </Tabs.Provider>
    </Space>
  );
};
