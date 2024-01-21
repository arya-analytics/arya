import { type ReactElement, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { type hardware } from "@synnaxlabs/client";
import { Icon } from "@synnaxlabs/media";
import {
  Channel,
  Header,
  Select,
  componentRenderProp,
  Nav,
  Synnax,
  useAsyncEffect,
  Status,
} from "@synnaxlabs/pluto";
import { Align } from "@synnaxlabs/pluto/align";
import { Button } from "@synnaxlabs/pluto/button";
import { CSS as PCSS } from "@synnaxlabs/pluto/css";
import { Input } from "@synnaxlabs/pluto/input";
import { List as PList } from "@synnaxlabs/pluto/list";
import { Text } from "@synnaxlabs/pluto/text";
import { nanoid } from "nanoid";
import { useFieldArray, useForm } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";
import { type z } from "zod";

import { CSS } from "@/css";
import { type Layout } from "@/layout";

import { AnalogInput } from "./ni/types";

import "@/hardware/configure/Configure.css";

type AnalogInputConfig = z.infer<typeof AnalogInput.config>;

export const Configure: Layout.Renderer = ({ layoutKey, onClose }): ReactElement => {
  const {
    control: c,
    handleSubmit,
    getValues,
  } = useForm<AnalogInputConfig>({
    resolver: zodResolver(AnalogInput.config),
    defaultValues: {
      type: "ni-analog-input",
      device: "",
      sampleRate: 1000,
      streamRate: 100,
      channels: [],
    },
  });

  const [selectedChan, setSelectedChan] = useState<string | null>(null);
  const selectedIndex = getValues().channels.findIndex((c) => c.key === selectedChan);

  const { fields, append } = useFieldArray({
    control: c,
    name: "channels",
  });

  const client = Synnax.use();

  const [rack, setRack] = useState<hardware.Module | null>(null);

  useAsyncEffect(async () => {
    const rack = await client?.hardware.retrieveRack(Number(layoutKey));
    setRack(rack);
  }, []);

  const handleValidSubmit = (data: AnalogInputConfig): void => {};

  return (
    <Align.Space
      el="form"
      id="configure"
      /* eslint-disable-next-line @typescript-eslint/no-misused-promises */
      onSubmit={handleSubmit(handleValidSubmit)}
      className={CSS.B("configure")}
      direction="y"
    >
      <Header.Header level="h4">
        <Header.Title startIcon={<Icon.Hardware />}>
          Configure {rack?.name ?? "Module"}
        </Header.Title>
      </Header.Header>
      <Align.Space direction="y" className={CSS.B("properties")} align="start">
        <Text.Text level="h3">Properties</Text.Text>
        <Align.Space direction="x">
          <Input.ItemControlled<string> control={c} name="device">
            {(props) => <Input.Text {...props} />}
          </Input.ItemControlled>
          <Input.ItemControlled<number>
            control={c}
            name="sampleRate"
            label="Sample Rate in Hz"
          >
            {(p) => <Input.Numeric {...p} />}
          </Input.ItemControlled>
          <Input.ItemControlled<number>
            control={c}
            name="streamRate"
            label="Stream Rate in Hz"
          >
            {(p) => <Input.Numeric {...p} />}
          </Input.ItemControlled>
        </Align.Space>
      </Align.Space>
      <Align.Space className={CSS.B("channels")} direction="x">
        <Align.Space className={CSS.B("list")} grow empty>
          <Header.Header level="h4">
            <Header.Title>Channels</Header.Title>
            <Header.Actions>
              {[
                {
                  children: <Icon.Add />,
                  type: "button",
                  size: "large",
                  onClick: () =>
                    append({
                      type: "voltage",
                      key: nanoid(),
                      port: 0,
                      channel: 0,
                      enabled: true,
                    }),
                },
              ]}
            </Header.Actions>
          </Header.Header>

          <PList.List<string, AnalogInput.Channel> data={getValues().channels}>
            <PList.Selector
              allowMultiple={false}
              value={selectedChan != null ? [selectedChan] : []}
              onChange={(keys) => setSelectedChan(keys[0] ?? null)}
            />
            <PList.Core>{componentRenderProp(ListItem)}</PList.Core>
          </PList.List>
        </Align.Space>
        <Align.Space className={CSS.B("properties")} grow>
          {selectedIndex != null && selectedIndex !== -1 && (
            <Properties index={selectedIndex} control={c} />
          )}
        </Align.Space>
      </Align.Space>
      <Nav.Bar location="bottom" className={CSS.BE("footer", "end")}>
        <Nav.Bar.End>
          <Button.Button type="button" variant="outlined">
            Close
          </Button.Button>
          <Button.Button form="configure" type="submit">
            Apply
          </Button.Button>
        </Nav.Bar.End>
      </Nav.Bar>
    </Align.Space>
  );
};

interface ListItemProps extends PList.ItemProps<string, AnalogInput.Channel> {}

const ListItem = ({ entry, selected, onSelect }: ListItemProps): ReactElement => {
  const channelName = Channel.useName(entry.channel);
  const [v, setV] = useState<boolean>(false);
  return (
    <Align.Space
      className={CSS(CSS.B("list-item"), PCSS.selected(selected))}
      direction="x"
      onClick={() => onSelect?.(entry.key)}
      align="center"
      justify="spaceBetween"
    >
      <Align.Space direction="x" size="small">
        <Text.Text level="p" style={{ color: "var(--pluto-gray-l7)" }}>
          Port
        </Text.Text>
        <Text.Text level="p" style={{ width: "10rem" }}>
          {entry.port}
        </Text.Text>
        <Text.Text level="p">
          {entry.channel === 0 ? "No Channel" : channelName}
        </Text.Text>
      </Align.Space>
      <Button.Toggle
        checkedVariant="text"
        uncheckedVariant="text"
        value={v}
        size="small"
        onClick={(e) => e.stopPropagation()}
        onChange={setV}
        tooltip={
          <Text.Text level="p" style={{ maxWidth: 300 }}>
            Data acquisition for this channel is {v ? "enabled" : "disabled"}. Click to
            {v ? " disable" : " enable"} it.
          </Text.Text>
        }
      >
        <Status.Text variant={v ? "success" : "disabled"} level="p">
          {v ? "Enabled" : "Disabled"}
        </Status.Text>
      </Button.Toggle>
    </Align.Space>
  );
};

interface PropertiesProps {
  index: number;
  control: ReturnType<typeof useForm>["control"];
}

const Properties = ({ index, control }: PropertiesProps): ReactElement => {
  const [scaleType, setScaleType] = useState("none");
  return (
    <Align.Space className={CSS.B("properties")}>
      <Text.Text level="h3">Channel Properties</Text.Text>
      <Input.ItemControlled<number>
        label="Port"
        name={`channels.${index}.port`}
        control={control}
      >
        {(p) => <Input.Numeric {...p} />}
      </Input.ItemControlled>
      <Input.ItemControlled<number>
        label="Channel"
        name={`channels.${index}.channel`}
        control={control}
      >
        {(p) => <Channel.SelectSingle {...p} />}
      </Input.ItemControlled>
      <Input.Item label="Scale">
        <SelectScale value={scaleType} onChange={setScaleType} />
      </Input.Item>
    </Align.Space>
  );
};

const SCALE_DATA = [
  {
    key: "none",
    label: "None",
  },
  {
    key: "slope-offset-linear",
    label: "Linear Slope Intercept",
  },
  {
    key: "two-point-linear",
    label: "Linear Two Point",
  },
];

const SelectScale = (props: Omit<Select.ButtonProps<string>, "data">): ReactElement => (
  <Select.Button<string> entryRenderKey="label" data={SCALE_DATA} {...props} />
);

export type LayoutType = "hardwareConfigure";
export const LAYOUT_TYPE = "hardwareConfigure";
export const create =
  (initial: Omit<Partial<Layout.LayoutState>, "type">) => (): Layout.LayoutState => {
    const { name = "Configure Hardware", location = "window", ...rest } = initial;
    const k = uuidv4();
    return {
      key: initial.key ?? k,
      type: LAYOUT_TYPE,
      windowKey: initial.key ?? k,
      name,
      window: {
        navTop: true,
      },
      location,
      ...rest,
    };
  };
