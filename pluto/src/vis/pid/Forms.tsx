// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { useCallback, type ReactElement, type FC, useEffect } from "react";

import { type channel } from "@synnaxlabs/client";
import { type location, type dimensions, type xy, type bounds } from "@synnaxlabs/x";

import { Align } from "@/align";
import { Channel } from "@/channel";
import { Color } from "@/color";
import { CSS } from "@/css";
import { Input } from "@/input";
import { Tabs } from "@/tabs";
import { type TabRenderProp } from "@/tabs/Tabs";
import { telem } from "@/telem/aether";
import { control } from "@/telem/control/aether";
import { Text } from "@/text";
import { type Button as CoreButton } from "@/vis/button";
import { type LabelExtensionProps } from "@/vis/pid/Labeled";
import {
  type ThreeWayValveProps,
  type ReliefValveProps,
  type TankProps,
  type SolenoidValveProps,
  type ControlStateProps,
  type ValueProps,
  type ButtonProps,
} from "@/vis/pid/Symbols";
import { type Toggle } from "@/vis/toggle";

import { SelectOrientation } from "./SelectOrientation";

import "@/vis/pid/Forms.css";

export interface SymbolFormProps<P extends object> {
  value: P;
  onChange: (value: P) => void;
}

const COMMON_TOGGLE_FORM_TABS: Tabs.Tab[] = [
  {
    tabKey: "style",
    name: "Style",
  },
  {
    tabKey: "control",
    name: "Control",
  },
];

interface FormWrapperProps extends Align.SpaceProps {}

const FormWrapper: FC<FormWrapperProps> = ({
  className,
  direction,
  ...props
}): ReactElement => (
  <Align.Space
    direction={direction}
    align="stretch"
    className={CSS(CSS.B("symbol-form"), className)}
    size={direction === "x" ? "large" : "medium"}
    {...props}
  />
);

interface PropertyInputProps<K extends string, V> {
  value: { [key in K]?: V };
  onChange: (value: { [key in K]: V }) => void;
}

interface MultiPropertyInputProps<R> {
  value: R;
  onChange: (value: R) => void;
}

type PropertyInput<K extends string, V> = FC<PropertyInputProps<K, V>>;
type MultiPropertyInput<R> = FC<MultiPropertyInputProps<R>>;

const OrientationControl: MultiPropertyInput<{
  label?: LabelExtensionProps;
  orientation?: location.Outer;
}> = ({ value, onChange }): ReactElement => (
  <Input.Item label="Orientation">
    <SelectOrientation
      value={{
        inner: value.orientation ?? "top",
        outer: value.label?.orientation ?? "top",
      }}
      onChange={(v) =>
        onChange({
          orientation: v.inner,
          label: {
            ...value.label,
            orientation: v.outer,
          },
        })
      }
    />
  </Input.Item>
);

const LabelControls: PropertyInput<"label", LabelExtensionProps> = ({
  value: { label },
  onChange,
}): ReactElement => (
  <Align.Space direction="x">
    <Input.Item label="Label" grow>
      <Input.Text
        value={label?.label ?? ""}
        onChange={(v) => onChange({ label: { ...label, label: v } })}
      />
    </Input.Item>
    <Input.Item label="Label Size">
      <Text.SelectLevel
        value={label?.level ?? "p"}
        onChange={(v) => onChange({ label: { ...label, level: v } })}
      />
    </Input.Item>
  </Align.Space>
);

const ColorControl: PropertyInput<"color", Color.Crude> = ({
  value,
  onChange,
}): ReactElement => (
  <Input.Item label="Color" align="start">
    <Color.Swatch
      value={value.color ?? Color.ZERO.setAlpha(1).rgba255}
      onChange={(v) => onChange({ color: v.rgba255 })}
    />
  </Input.Item>
);

export interface CommonToggleFormProps
  extends SymbolFormProps<ThreeWayValveProps & { control: ControlStateProps }> {}

export const ToggleControlForm: MultiPropertyInput<
  Omit<Toggle.UseProps, "aetherKey"> & { control: ControlStateProps }
> = ({ value, onChange }): ReactElement => {
  const sourceP = telem.sourcePipelinePropsZ.parse(value.source?.props);
  const sinkP = telem.sinkPipelinePropsZ.parse(value.sink?.props);
  const source = telem.streamChannelValuePropsZ.parse(
    sourceP.segments.valueStream.props,
  );
  const sink = control.setChannelValuePropsZ.parse(sinkP.segments.setter.props);

  const handleSourceChange = (v: channel.Key | null): void => {
    v = v ?? 0;
    const t = telem.sourcePipeline("boolean", {
      connections: [
        {
          from: "valueStream",
          to: "threshold",
        },
      ],
      segments: {
        valueStream: telem.streamChannelValue({ channel: v }),
        threshold: telem.withinBounds({ trueBound: { lower: 0.9, upper: 1.1 } }),
      },
      outlet: "threshold",
    });
    onChange({ ...value, source: t });
  };

  const handleSinkChange = (v: channel.Key | null): void => {
    v = v ?? 0;
    const t = telem.sinkPipeline("boolean", {
      connections: [
        {
          from: "setpoint",
          to: "setter",
        },
      ],
      segments: {
        setter: control.setChannelValue({ channel: v }),
        setpoint: telem.setpoint({
          truthy: 1,
          falsy: 0,
        }),
      },
      inlet: "setpoint",
    });

    const authSource = control.authoritySource({ channel: v });

    const controlChipSink = control.acquireChannelControl({
      channel: v,
      authority: 255,
    });

    onChange({
      ...value,
      sink: t,
      control: {
        ...value.control,
        showChip: true,
        chip: {
          sink: controlChipSink,
          source: authSource,
        },
        showIndicator: true,
        indicator: {
          statusSource: authSource,
        },
      },
    });
  };

  return (
    <FormWrapper direction="y">
      <Input.Item label="Input Channel">
        <Channel.SelectSingle value={source.channel} onChange={handleSourceChange} />
      </Input.Item>
      <Input.Item label="Output Channel">
        <Channel.SelectSingle value={sink.channel} onChange={handleSinkChange} />
      </Input.Item>
    </FormWrapper>
  );
};

export const CommonToggleForm = ({
  value,
  onChange,
}: CommonToggleFormProps): ReactElement => {
  const content: TabRenderProp = useCallback(
    ({ tabKey }) => {
      switch (tabKey) {
        case "control":
          return <ToggleControlForm value={value} onChange={onChange} />;
        default: {
          return (
            <FormWrapper direction="x" align="stretch">
              <Align.Space direction="y" grow>
                <LabelControls value={value} onChange={onChange} />
                <ColorControl value={value} onChange={onChange} />
              </Align.Space>
              <OrientationControl value={value} onChange={onChange} />
            </FormWrapper>
          );
        }
      }
    },
    [value, onChange],
  );

  const props = Tabs.useStatic({ tabs: COMMON_TOGGLE_FORM_TABS, content });
  return <Tabs.Tabs {...props} />;
};

export const SolenoidValveForm = ({
  value,
  onChange,
}: SymbolFormProps<SolenoidValveProps>): ReactElement => {
  const content: TabRenderProp = useCallback(
    ({ tabKey }) => {
      switch (tabKey) {
        case "control":
          return <ToggleControlForm value={value} onChange={onChange} />;
        default: {
          return (
            <FormWrapper direction="x" align="stretch">
              <Align.Space direction="y" grow>
                <LabelControls value={value} onChange={onChange} />
                <Align.Space direction="x">
                  <ColorControl value={value} onChange={onChange} />
                  <Input.Item label="Normally Open">
                    <Input.Switch
                      value={value.normallyOpen ?? false}
                      onChange={(v) => onChange({ ...value, normallyOpen: v })}
                    />
                  </Input.Item>
                </Align.Space>
              </Align.Space>
              <OrientationControl value={value} onChange={onChange} />
            </FormWrapper>
          );
        }
      }
    },
    [value, onChange],
  );

  const props = Tabs.useStatic({ tabs: COMMON_TOGGLE_FORM_TABS, content });
  return <Tabs.Tabs {...props} />;
};

export const CommonNonToggleForm = ({
  value,
  onChange,
}: SymbolFormProps<ReliefValveProps>): ReactElement => {
  return (
    <FormWrapper direction="x">
      <Align.Space direction="y" grow>
        <LabelControls value={value} onChange={onChange} />
        <ColorControl value={value} onChange={onChange} />
      </Align.Space>
      <OrientationControl value={value} onChange={onChange} />
    </FormWrapper>
  );
};

const DIMENSIONS_DRAG_SCALE: xy.Crude = { y: 2, x: 0.25 };
const DIMENSIONS_BOUNDS: bounds.Bounds = { lower: 0, upper: 2000 };

export const TankForm = ({
  value,
  onChange,
}: SymbolFormProps<TankProps>): ReactElement => {
  const handleDimensionsChange = (dims: Partial<dimensions.Dimensions>): void => {
    onChange({
      ...value,
      dimensions: { width: 100, height: 200, ...value.dimensions, ...dims },
    });
  };
  return (
    <FormWrapper direction="x">
      <Align.Space direction="y">
        <LabelControls value={value} onChange={onChange} />
        <Align.Space direction="x">
          <ColorControl value={value} onChange={onChange} />
          <Input.Item label="Width">
            <Input.Numeric
              value={value.dimensions?.width ?? 200}
              dragScale={DIMENSIONS_DRAG_SCALE}
              bounds={DIMENSIONS_BOUNDS}
              onChange={(v) => handleDimensionsChange({ width: v })}
            />
          </Input.Item>
          <Input.Item label="Height">
            <Input.Numeric
              value={value.dimensions?.height ?? 200}
              dragScale={DIMENSIONS_DRAG_SCALE}
              bounds={DIMENSIONS_BOUNDS}
              onChange={(v) => handleDimensionsChange({ height: v })}
            />
          </Input.Item>
        </Align.Space>
      </Align.Space>
      <OrientationControl value={value} onChange={onChange} />
    </FormWrapper>
  );
};

export interface ValueFormProps extends SymbolFormProps<ValueProps> {}

const VALUE_FORM_TABS: Tabs.Tab[] = [
  {
    tabKey: "style",
    name: "Style",
  },
  {
    tabKey: "telemetry",
    name: "Telemetry",
  },
];

const ValueTelemetryForm: MultiPropertyInput<{
  telem: telem.StringSourceSpec;
  tooltip: string[];
}> = ({ value, onChange }): ReactElement => {
  const sourceP = telem.sourcePipelinePropsZ.parse(value.telem?.props);
  const source = telem.streamChannelValuePropsZ.parse(
    sourceP.segments.valueStream.props,
  );
  const stringifier = telem.stringifyNumberProps.parse(
    sourceP.segments.stringifier.props,
  );
  const handleSourceChange = (v: channel.Key | null): void => {
    const t = telem.sourcePipeline("string", {
      connections: [
        {
          from: "valueStream",
          to: "stringifier",
        },
      ],
      segments: {
        valueStream: telem.streamChannelValue({ channel: v ?? 0 }),
        stringifier: telem.stringifyNumber({
          precision: stringifier.precision ?? 2,
        }),
      },
      outlet: "stringifier",
    });
    onChange({ ...value, telem: t });
  };

  const handlePrecisionChange = (precision: number): void => {
    const t = telem.sourcePipeline("string", {
      connections: [
        {
          from: "valueStream",
          to: "stringifier",
        },
      ],
      segments: {
        valueStream: telem.streamChannelValue({ channel: source.channel }),
        stringifier: telem.stringifyNumber({
          precision,
        }),
      },
      outlet: "stringifier",
    });
    onChange({ ...value, telem: t });
  };

  const c = Channel.useName(source.channel);
  useEffect(() => {
    onChange({ ...value, tooltip: [c] });
  }, [c]);

  return (
    <FormWrapper direction="y">
      <Input.Item label="Input Channel">
        <Channel.SelectSingle value={source.channel} onChange={handleSourceChange} />
      </Input.Item>
      <Input.Item label="Percision" align="start">
        <Input.Numeric
          value={stringifier.precision ?? 2}
          bounds={{ lower: 0, upper: 10 }}
          onChange={handlePrecisionChange}
        />
      </Input.Item>
    </FormWrapper>
  );
};

export const ValueForm = ({ value, onChange }: ValueFormProps): ReactElement => {
  const content: TabRenderProp = useCallback(
    ({ tabKey }) => {
      switch (tabKey) {
        case "telemetry":
          return <ValueTelemetryForm value={value} onChange={onChange} />;
        default: {
          return (
            <FormWrapper direction="x">
              <Align.Space direction="y" grow>
                <LabelControls value={value} onChange={onChange} />
                <Align.Space direction="x">
                  <ColorControl value={value} onChange={onChange} />

                  <Input.Item label="Units" align="start">
                    <Input.Text
                      value={value.units ?? ""}
                      onChange={(v) => onChange({ ...value, units: v })}
                    />
                  </Input.Item>
                </Align.Space>
              </Align.Space>
              <OrientationControl value={value} onChange={onChange} />
            </FormWrapper>
          );
        }
      }
    },
    [value, onChange],
  );

  const props = Tabs.useStatic({ tabs: VALUE_FORM_TABS, content });
  return <Tabs.Tabs {...props} />;
};

export const ButtonTelemetryForm: MultiPropertyInput<
  Omit<CoreButton.UseProps, "aetherKey"> & { control: ControlStateProps }
> = ({ value, onChange }): ReactElement => {
  const sinkP = telem.sinkPipelinePropsZ.parse(value.sink?.props);
  const sink = control.setChannelValuePropsZ.parse(sinkP.segments.setter.props);

  const handleSinkChange = (v: channel.Key): void => {
    const t = telem.sinkPipeline("boolean", {
      connections: [
        {
          from: "setpoint",
          to: "setter",
        },
      ],
      segments: {
        setter: control.setChannelValue({ channel: v }),
        setpoint: telem.setpoint({
          truthy: 1,
          falsy: 0,
        }),
      },
      inlet: "setpoint",
    });

    const authSource = control.authoritySource({ channel: v });

    const controlChipSink = control.acquireChannelControl({
      channel: v,
      authority: 255,
    });

    onChange({
      ...value,
      sink: t,
      control: {
        ...value.control,
        showChip: true,
        chip: {
          sink: controlChipSink,
          source: authSource,
        },
        showIndicator: true,
        indicator: {
          statusSource: authSource,
        },
      },
    });
  };

  return (
    <FormWrapper direction="y">
      <Input.Item label="Output Channel">
        <Channel.SelectSingle value={sink.channel} onChange={handleSinkChange} />
      </Input.Item>
    </FormWrapper>
  );
};

export const ButtonForm = ({
  value,
  onChange,
}: SymbolFormProps<ButtonProps>): ReactElement => {
  const content: TabRenderProp = useCallback(
    ({ tabKey }) => {
      switch (tabKey) {
        case "control":
          return <ButtonTelemetryForm value={value} onChange={onChange} />;
        default:
          return (
            <FormWrapper direction="x" align="stretch">
              <Align.Space direction="y" grow>
                <LabelControls value={value} onChange={onChange} />
              </Align.Space>
              <OrientationControl value={value} onChange={onChange} />
            </FormWrapper>
          );
      }
    },
    [value, onChange],
  );

  const props = Tabs.useStatic({ tabs: COMMON_TOGGLE_FORM_TABS, content });

  return <Tabs.Tabs {...props} />;
};
