// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { type ReactElement } from "react";

import { Authority } from "@synnaxlabs/client";
import { bounds, direction, location } from "@synnaxlabs/x";
import { Handle, Position } from "reactflow";

import { Align } from "@/align";
import { Channel } from "@/channel";
import { Color } from "@/color";
import { Control } from "@/control";
import { Chip } from "@/control/chip";
import { CSS } from "@/css";
import { Input } from "@/input";
import { Select } from "@/select";
import { Bool } from "@/telem/bool";
import { Remote } from "@/telem/remote";
import { Static } from "@/telem/static";
import { Text } from "@/text";
import { type Theming } from "@/theming";
import { Tooltip } from "@/tooltip";
import { componentRenderProp } from "@/util/renderProp";
import { type FormProps, type Spec, type Props } from "@/vis/pid/element/element";
import { Tooltip as PIDTooltip } from "@/vis/pid/element/Tooltip";
import { Valve, type ValveProps } from "@/vis/valve/Valve";

import "@/vis/pid/element/Valve.css";

interface ElementProps extends Omit<ValveProps, "telem" | "color" | "source" | "sink"> {
  source: Remote.NumericSourceProps;
  sink: Control.NumericSinkProps;
  label: string;
  color: Color.Crude;
  authority: number;
}

const { Left, Top, Right, Bottom } = Position;

const Element = ({
  selected,
  editable,
  onChange,
  label,
  position,
  direction: dir = "x",
  source,
  sink,
  authority,
  ...props
}: Props<ElementProps>): ReactElement => {
  const handleLabelChange = (label: string): void =>
    onChange({ ...props, label, source, sink, authority });

  const authoritySource = Control.useAuthorityStatusSource({ channel: sink.channel });
  const authorityColorSource = Control.useAuthorityColorSource({
    channel: sink.channel,
  });
  const authoritySink = Control.useAuthoritySink({ channel: sink.channel, authority });
  const sourceN = Remote.useNumericSource(source);
  const sinkN = Control.useNumericSink(sink);
  const sourceB = Bool.useNumericConverterSource({
    wrap: sourceN,
    trueBound: bounds.construct(0.9, 1.1),
  });
  const sinkB = Bool.useNumericConverterSink({
    wrap: sinkN,
    truthy: 1,
    falsy: 0,
  });

  const commandName = Static.useString(
    `Output: ${Channel.useName(sink.channel, "None")}`,
  );
  const enabledName = Static.useString(
    `Input: ${Channel.useName(source.channel, "None")}`,
  );

  return (
    <Align.Space
      justify="center"
      align="center"
      size="small"
      className={CSS(
        CSS.B("valve-pid-element"),
        CSS.selected(selected),
        CSS.editable(editable),
      )}
      direction={direction.swap(dir)}
    >
      <Text.Editable level="p" value={label} onChange={handleLabelChange} />
      <div className={CSS.BE("valve-pid-element", "valve-container")}>
        <Handle position={dir === "x" ? Left : Top} id="a" type="source" />
        <Handle position={dir === "x" ? Right : Bottom} id="b" type="source" />
        <Valve source={sourceB} sink={sinkB} direction={dir} {...props} />
      </div>
      <Align.Space
        direction={dir}
        style={{ marginTop: "-1rem", paddingRight: "1rem" }}
        align="center"
        empty
      >
        <Chip
          size="small"
          source={authoritySource}
          sink={authoritySink}
          variant="text"
        />
        <Control.Indicator
          statusSource={authoritySource}
          colorSource={authorityColorSource}
        />
      </Align.Space>
    </Align.Space>
  );
};

const Form = ({ value, onChange }: FormProps<ElementProps>): ReactElement => {
  const handleLabelChange = (label: string): void => onChange({ ...value, label });

  const handleSourceChange = (source: Remote.NumericSourceProps): void =>
    onChange({ ...value, source });

  const handleSinkChange = (sink: Control.NumericSinkProps): void =>
    onChange({ ...value, sink });

  const handleColorChange = (color: Color.Color): void =>
    onChange({ ...value, color: color.hex });

  const handleDirectionChange = (direction: direction.Direction): void =>
    onChange({ ...value, direction });

  const handleAuthorityChange = (authority: number): void =>
    onChange({ ...value, authority });

  return (
    <>
      <Align.Space direction="x">
        <Input.Item<Color.Crude, Color.Color, Color.SwatchProps>
          label="Color"
          onChange={handleColorChange}
          value={value.color}
        >
          {/* @ts-expect-error */}
          {componentRenderProp(Color.Swatch)}
        </Input.Item>
        <Input.Item<direction.Direction>
          label="Direction"
          value={value.direction ?? "x"}
          onChange={handleDirectionChange}
        >
          {componentRenderProp(Select.Direction)}
        </Input.Item>
        <Input.Item<string>
          label="Label"
          value={value.label}
          onChange={handleLabelChange}
          grow
        />
      </Align.Space>
      <Align.Space direction="x">
        <Remote.NumericSourceForm
          label="Input Channel"
          value={value.source}
          onChange={handleSourceChange}
          grow
        />
        <Control.NumericSinkForm
          label="Output Channel"
          value={value.sink}
          onChange={handleSinkChange}
          grow
        />
        <Input.Item<number>
          label="Control Authority"
          value={value.authority}
          onChange={handleAuthorityChange}
          grow
        >
          {componentRenderProp(Input.Numeric)}
        </Input.Item>
      </Align.Space>
    </>
  );
};

const Preview = ({ color }: ElementProps): ReactElement => {
  return <Valve color={color} />;
};

const initialProps = (th: Theming.Theme): ElementProps => ({
  label: "Valve",
  color: th.colors.gray.l8.hex,
  source: {
    channel: 0,
  },
  sink: {
    channel: 0,
  },
  authority: Authority.ABSOLUTE.valueOf(),
});

export const ValveSpec: Spec<ElementProps> = {
  type: "valve",
  title: "Valve",
  initialProps,
  zIndex: 3,
  Element,
  Form,
  Preview,
};
