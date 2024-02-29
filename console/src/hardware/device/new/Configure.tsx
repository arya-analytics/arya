// Copyright 2024 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { type ReactElement, useCallback } from "react";

import { type hardware } from "@synnaxlabs/client";
import { Button, Form, Nav, Synnax } from "@synnaxlabs/pluto";
import { Align } from "@synnaxlabs/pluto/align";
import { Tabs } from "@synnaxlabs/pluto/tabs";
import { useQuery } from "@tanstack/react-query";

import { CSS } from "@/css";
import { enrich } from "@/hardware/configure/ni/enrich";
import { type NITask } from "@/hardware/configure/ni/types";
import { PhysicalPlanForm } from "@/hardware/device/new/PhysicalPlanForm";
import {
  extrapolateIdentifier,
  PropertiesForm,
} from "@/hardware/device/new/PropertiesForm";
import {
  configurationZ,
  type Configuration,
  type EnrichedProperties,
  type SoftwarePlan,
  type PhysicalPlan,
} from "@/hardware/device/new/types";
import { type Layout } from "@/layout";

import { buildPhysicalDevicePlan } from "./physicalPlan";
import { buildSoftwareTasks } from "./softwareTasks";
import { SoftwareTasksForm } from "./SoftwareTasksForm";

import "@/hardware/device/new/Configure.css";

const makeDefaultValues = (device: hardware.DevicePayload): Configuration => {
  return {
    properties: {
      key: device.key,
      name: device.name,
      vendor: device.make,
      model: device.model,
      identifier: extrapolateIdentifier(device.name),
      location: "Dev1",
      analogInput: { portCount: 0 },
      analogOutput: { portCount: 0 },
      digitalInput: { portCount: 0, lineCounts: [] },
      digitalOutput: { portCount: 0, lineCounts: [] },
      digitalInputOutput: { portCount: 0, lineCounts: [] },
    },
    physicalPlan: {
      groups: [],
    },
    softwarePlan: {
      tasks: [],
    },
  };
};

export const Configure = ({ layoutKey }: Layout.RendererProps): ReactElement => {
  const client = Synnax.use();
  const { data, isPending } = useQuery({
    queryKey: [layoutKey, { client }],
    queryFn: async ({ queryKey }) => {
      const [key] = queryKey;
      if (client == null) return;
      return await client.hardware.retrieveDevice(key as string);
    },
  });
  if (isPending || data == null) return <div>Loading...</div>;
  return <ConfigureInternal device={data} />;
};

interface ConfigureInternalProps {
  device: hardware.DevicePayload;
}

const ConfigureInternal = ({ device }: ConfigureInternalProps): ReactElement => {
  const client = Synnax.use();

  const TABS: Tabs.TabSpec[] = [
    {
      tabKey: "properties",
      name: "Properties",
    },
    {
      tabKey: "physicalPlan",
      name: "Channel Creation",
    },
    {
      tabKey: "softwareTasks",
      name: "Software Tasks",
    },
  ];

  const tabsProps = Tabs.useStatic({ tabs: TABS });

  const content: Tabs.TabRenderProp = useCallback(
    ({ tabKey }) => {
      switch (tabKey) {
        case "properties":
          return <PropertiesForm />;
        case "physicalPlan":
          return <PhysicalPlanForm />;
        default:
          return <SoftwareTasksForm />;
      }
    },
    [tabsProps.onSelect],
  );

  const methods = Form.use<typeof configurationZ>({
    initialValues: makeDefaultValues(device),
    schema: configurationZ,
  });

  const handleNext = (): void => {
    void (async () => {
      if (tabsProps.selected === "properties") {
        const ok = methods.validate("properties");
        if (!ok) return;
        const existingPlan = methods.get<PhysicalPlan>("physicalPlan").value;
        if (existingPlan.groups.length === 0) {
          const enriched = enrich(methods.get<EnrichedProperties>("properties").value);
          const plan = buildPhysicalDevicePlan(
            enriched,
            methods.get<string>("properties.identifier").value,
          );
          methods.set("physicalPlan.groups", plan.groups);
        }
        tabsProps.onSelect?.("physicalPlan");
      } else if (tabsProps.selected === "physicalPlan") {
        const ok = methods.validate("physicalPlan");
        if (!ok) return;
        const existingPlan = methods.get<SoftwarePlan>("softwarePlan", false).value;
        if (existingPlan.tasks.length === 0) {
          const properties = methods.get<EnrichedProperties>("properties", false).value;
          const physicalPlan = methods.get<PhysicalPlan>("physicalPlan", false).value;
          const tasks = buildSoftwareTasks(properties, physicalPlan);
          console.log("physicalPlan", tasks);
          methods.set("softwarePlan.tasks", tasks);
        }
        tabsProps.onSelect?.("softwareTasks");
      } else if (tabsProps.selected === "softwareTasks") {
        const ok = methods.validate("softwarePlan");
        if (!ok) return;
        const groups = methods.get<PhysicalPlan>("physicalPlan", false).value.groups;
        if (client == null) return;
        const rack = await client.hardware.retrieveRack(device.rack);
        const output = new Map<string, number>();
        await Promise.all(
          groups.map(async (g) => {
            const rawIdx = g.channels.find((c) => c.isIndex);
            if (rawIdx == null) return;
            const idx = await client.channels.create({
              name: rawIdx.name,
              isIndex: true,
              dataType: rawIdx?.dataType,
            });
            const rawDataChannels = g.channels.filter(
              (c) => !c.isIndex && c.synnaxChannel == null,
            );
            const data = await client.channels.create(
              rawDataChannels.map((c) => ({
                name: c.name,
                dataType: c.dataType,
                index: idx.key,
              })),
            );
            data.map((c, i): void => {
              rawDataChannels[i].synnaxChannel = c.key;
            });
            rawIdx.synnaxChannel = idx.key;
            g.channels.forEach((c) => {
              output.set(c.key, c.synnaxChannel);
            });
          }),
        );

        const tasks = methods.get<NITask[]>("softwarePlan.tasks", false).value;
        if (client == null) return;

        tasks.forEach((t) => {
          t.config.channels.forEach((c) => {
            c.channel = output.get(c.key) as string;
          });
        });

        const t = tasks[0];
        await rack.createTask({
          name: t.name,
          type: t.type,
          config: t.config,
        });
      }
    })();
  };

  return (
    <Align.Space className={CSS.B("device-new-configure")} empty>
      <Form.Form {...methods}>
        <Tabs.Tabs
          direction="x"
          {...tabsProps}
          size="large"
          onSelect={() => {}}
          content={content}
        ></Tabs.Tabs>
        <Nav.Bar size={48} location="bottom">
          <Nav.Bar.End>
            <Button.Button variant="outlined">Cancel</Button.Button>
            <Button.Button onClick={handleNext}>Next Step</Button.Button>
          </Nav.Bar.End>
        </Nav.Bar>
      </Form.Form>
    </Align.Space>
  );
};

export type LayoutType = "hardwareConfigureNew";
export const LAYOUT_TYPE = "hardwareConfigureNew";

export const create =
  (device: string, initial: Omit<Partial<Layout.LayoutState>, "type">) =>
  (): Layout.LayoutState => {
    const { name = "Configure Hardware", location = "mosaic", ...rest } = initial;
    return {
      key: initial.key ?? device,
      type: LAYOUT_TYPE,
      windowKey: initial.key ?? device,
      name,
      window: {
        navTop: true,
        size: { height: 800, width: 1200 },
      },
      location,
      ...rest,
    };
  };
