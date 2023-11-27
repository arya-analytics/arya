// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { useState, type ReactElement } from "react";

import { box, type xy, type location, type UnknownRecord } from "@synnaxlabs/x";

import { Aether } from "@/aether";
import { type Color } from "@/color";
import { CSS } from "@/css";
import { useResize } from "@/hooks";
import { telem } from "@/telem/aether";
import { Text } from "@/text";
import { Theming } from "@/theming";
import { Primitives } from "@/vis/pid/symbols/primitives";
import { Toggle } from "@/vis/toggle";
import { Value as CoreValue } from "@/vis/value";

import { Labeled, type LabelExtensionProps } from "./Labeled";

export type SymbolProps<P extends object = UnknownRecord> = P & {
  symbolKey: string;
  position: xy.XY;
  selected: boolean;
  editable: boolean;
  zoom: number;
  onChange: (value: P) => void;
};

export interface ThreeWayValveProps
  extends Primitives.ThreeWayValveProps,
    Omit<Toggle.UseProps, "aetherKey"> {
  label?: LabelExtensionProps;
}

export const ThreeWayValve = Aether.wrap<SymbolProps<ThreeWayValveProps>>(
  "ThreeWayValve",
  ({ aetherKey, label, onChange, source, sink, orientation, color }): ReactElement => {
    const { enabled, triggered, toggle } = Toggle.use({ aetherKey, source, sink });
    return (
      <Labeled {...label} onChange={onChange}>
        <Primitives.ThreeWayValve
          enabled={enabled}
          triggered={triggered}
          onClick={toggle}
          orientation={orientation}
          color={color}
        />
      </Labeled>
    );
  },
);

export const ThreeWayValvePreview = (props: ThreeWayValveProps): ReactElement => (
  <Primitives.ThreeWayValve {...props} />
);

export interface ValveProps
  extends Primitives.ValveProps,
    Omit<Toggle.UseProps, "aetherKey"> {
  label?: LabelExtensionProps;
}

export const Valve = Aether.wrap<SymbolProps<ValveProps>>(
  "Valve",
  ({ aetherKey, label, onChange, source, sink, orientation, color }): ReactElement => {
    const { enabled, triggered, toggle } = Toggle.use({ aetherKey, source, sink });
    return (
      <Labeled {...label} onChange={onChange}>
        <Primitives.Valve
          enabled={enabled}
          triggered={triggered}
          onClick={toggle}
          orientation={orientation}
          color={color}
        />
      </Labeled>
    );
  },
);

export const ValvePreview = (props: ValveProps): ReactElement => (
  <Primitives.Valve {...props} />
);

export interface SolenoidValveProps
  extends Primitives.SolenoidValveProps,
    Omit<Toggle.UseProps, "aetherKey"> {
  label?: LabelExtensionProps;
}

export const SolenoidValve = Aether.wrap<SymbolProps<SolenoidValveProps>>(
  "SolenoidValve",
  ({ aetherKey, label, onChange, orientation, normallyOpen, color }): ReactElement => {
    const { enabled, triggered, toggle } = Toggle.use({ aetherKey });
    return (
      <Labeled {...label} onChange={onChange}>
        <Primitives.SolenoidValve
          enabled={enabled}
          triggered={triggered}
          onClick={toggle}
          orientation={orientation}
          color={color}
          normallyOpen={normallyOpen}
        />
      </Labeled>
    );
  },
);

export const SolenoidValvePreview = (props: SolenoidValveProps): ReactElement => (
  <Primitives.SolenoidValve {...props} />
);

export interface FourWayValveProps
  extends Primitives.FourWayValveProps,
    Omit<Toggle.UseProps, "aetherKey"> {
  label?: LabelExtensionProps;
}

export const FourWayValve = Aether.wrap<SymbolProps<FourWayValveProps>>(
  "FourWayValve",
  ({ aetherKey, label, onChange, orientation, color }): ReactElement => {
    const { enabled, triggered, toggle } = Toggle.use({ aetherKey });
    return (
      <Labeled {...label} onChange={onChange}>
        <Primitives.FourWayValve
          enabled={enabled}
          triggered={triggered}
          onClick={toggle}
          orientation={orientation}
          color={color}
        />
      </Labeled>
    );
  },
);

export const FourWayValvePreview = (props: FourWayValveProps): ReactElement => (
  <Primitives.FourWayValve {...props} />
);

export interface AngledValveProps
  extends Primitives.AngledValveProps,
    Omit<Toggle.UseProps, "aetherKey"> {
  label?: LabelExtensionProps;
}

export const AngledValve = Aether.wrap<SymbolProps<AngledValveProps>>(
  "AngleValve",
  ({ aetherKey, label, onChange, orientation, color, ...props }): ReactElement => {
    const { enabled, triggered, toggle } = Toggle.use({ aetherKey });
    return (
      <Labeled {...label} onChange={onChange}>
        <Primitives.AngledValve
          enabled={enabled}
          triggered={triggered}
          onClick={toggle}
          orientation={orientation}
          color={color}
        />
      </Labeled>
    );
  },
);

export const AngledValvePreview = (props: AngledValveProps): ReactElement => (
  <Primitives.AngledValve {...props} />
);

export interface PumpProps
  extends Primitives.PumpProps,
    Omit<Toggle.UseProps, "aetherKey"> {
  label?: LabelExtensionProps;
}

export const Pump = Aether.wrap<SymbolProps<PumpProps>>(
  "Pump",
  ({ aetherKey, label, onChange, orientation, color }): ReactElement => {
    const { enabled, triggered, toggle } = Toggle.use({ aetherKey });
    return (
      <Labeled {...label} onChange={onChange}>
        <Primitives.Pump
          enabled={enabled}
          triggered={triggered}
          onClick={toggle}
          orientation={orientation}
          color={color}
        />
      </Labeled>
    );
  },
);

export const PumpPreview = (props: PumpProps): ReactElement => (
  <Primitives.Pump {...props} />
);

export interface TankProps extends Primitives.TankProps {
  label?: LabelExtensionProps;
}

export const Tank = Aether.wrap<SymbolProps<TankProps>>(
  "Tank",
  ({ label, onChange, orientation, color, dimensions, borderRadius }): ReactElement => {
    return (
      <Labeled {...label} onChange={onChange}>
        <Primitives.Tank
          orientation={orientation}
          color={color}
          dimensions={dimensions}
          borderRadius={borderRadius}
        />
      </Labeled>
    );
  },
);

export const TankPreview = (props: TankProps): ReactElement => (
  <Primitives.Tank {...props} dimensions={{ width: 30, height: 60 }} />
);

export interface ReliefValveProps extends Primitives.ReliefValveProps {
  label?: LabelExtensionProps;
}

export const ReliefValve = ({
  label,
  onChange,
  orientation,
  color,
}: SymbolProps<ReliefValveProps>): ReactElement => {
  return (
    <Labeled {...label} onChange={onChange}>
      <Primitives.ReliefValve orientation={orientation} color={color} />
    </Labeled>
  );
};

export const ReliefValvePreview = (props: ReliefValveProps): ReactElement => (
  <Primitives.ReliefValve {...props} />
);

export interface RegulatorProps extends Primitives.RegulatorProps {
  label?: LabelExtensionProps;
}

export const Regulator = ({
  label,
  onChange,
  orientation,
  color,
}: SymbolProps<RegulatorProps>): ReactElement => {
  return (
    <Labeled {...label} onChange={onChange}>
      <Primitives.Regulator orientation={orientation} color={color} />
    </Labeled>
  );
};

export const RegulatorPreview = (props: RegulatorProps): ReactElement => (
  <Primitives.Regulator {...props} />
);

export interface BurstDiscProps extends Primitives.BurstDiscProps {
  label?: LabelExtensionProps;
}

export const BurstDisc = ({
  label,
  onChange,
  orientation,
  color,
}: SymbolProps<BurstDiscProps>): ReactElement => {
  return (
    <Labeled {...label} onChange={onChange}>
      <Primitives.BurstDisc orientation={orientation} color={color} />
    </Labeled>
  );
};

export const BurstDiscPreview = (props: BurstDiscProps): ReactElement => (
  <Primitives.BurstDisc {...props} />
);

export interface CapProps extends Primitives.CapProps {
  label?: LabelExtensionProps;
}

export const Cap = ({
  label,
  onChange,
  orientation,
  color,
}: SymbolProps<CapProps>): ReactElement => {
  return (
    <Labeled {...label} onChange={onChange}>
      <Primitives.Cap orientation={orientation} color={color} />
    </Labeled>
  );
};

export const CapPreview = (props: CapProps): ReactElement => (
  <Primitives.Cap {...props} />
);

export interface ManualValveProps extends Primitives.ManualValveProps {
  label?: LabelExtensionProps;
}

export const ManualValve = ({
  label,
  onChange,
  orientation,
  color,
}: SymbolProps<ManualValveProps>): ReactElement => {
  return (
    <Labeled {...label} onChange={onChange}>
      <Primitives.ManualValve orientation={orientation} color={color} />
    </Labeled>
  );
};

export const ManualValvePreview = (props: ManualValveProps): ReactElement => (
  <Primitives.ManualValve {...props} />
);

export interface FilterProps extends Primitives.FilterProps {
  label?: LabelExtensionProps;
}

export const Filter = ({
  label,
  onChange,
  orientation,
  color,
}: SymbolProps<FilterProps>): ReactElement => {
  return (
    <Labeled {...label} onChange={onChange}>
      <Primitives.Filter orientation={orientation} color={color} />
    </Labeled>
  );
};

export const FilterPreview = (props: FilterProps): ReactElement => (
  <Primitives.Filter {...props} />
);

export interface NeedleValveProps extends Primitives.NeedleValveProps {
  label?: LabelExtensionProps;
}

export const NeedleValve = ({
  label,
  onChange,
  orientation,
  color,
}: SymbolProps<NeedleValveProps>): ReactElement => {
  return (
    <Labeled {...label} onChange={onChange}>
      <Primitives.NeedleValve orientation={orientation} color={color} />
    </Labeled>
  );
};

export const NeedleValvePreview = (props: NeedleValveProps): ReactElement => (
  <Primitives.NeedleValve {...props} />
);

export interface CheckValveProps extends Primitives.CheckValveProps {
  label?: LabelExtensionProps;
}

export const CheckValve = ({
  label,
  onChange,
  orientation,
  color,
}: SymbolProps<CheckValveProps>): ReactElement => {
  return (
    <Labeled {...label} onChange={onChange}>
      <Primitives.CheckValve orientation={orientation} color={color} />
    </Labeled>
  );
};

export const CheckValvePreview = (props: CheckValveProps): ReactElement => (
  <Primitives.CheckValve {...props} />
);

export interface OrificeProps extends Primitives.OrificeProps {
  label?: LabelExtensionProps;
}

export const Orifice = ({
  label,
  onChange,
  orientation,
  color,
}: SymbolProps<OrificeProps>): ReactElement => {
  return (
    <Labeled {...label} onChange={onChange}>
      <Primitives.Orifice orientation={orientation} color={color} />
    </Labeled>
  );
};

export const OrificePreview = (props: OrificeProps): ReactElement => (
  <Primitives.Orifice {...props} />
);

export interface AngledReliefValveProps extends Primitives.AngledReliefValveProps {
  label?: LabelExtensionProps;
}

export const AngledReliefValve = ({
  label,
  onChange,
  orientation,
  color,
}: SymbolProps<AngledReliefValveProps>): ReactElement => {
  return (
    <Labeled {...label} onChange={onChange}>
      <Primitives.AngledReliefValve orientation={orientation} color={color} />
    </Labeled>
  );
};

export const AngledReliefValvePreview = (
  props: Primitives.AngledReliefValveProps,
): ReactElement => <Primitives.AngledReliefValve {...props} />;

export interface ValueProps
  extends Omit<CoreValue.UseProps, "box" | "aetherKey">,
    Primitives.ValueProps {
  position?: xy.XY;
  label?: LabelExtensionProps;
  color?: Color.Crude;
  textColor?: Color.Crude;
}

export const Value = Aether.wrap<SymbolProps<ValueProps>>(
  "Value",
  ({
    aetherKey,
    label,
    level = "p",
    position,
    className,
    children,
    textColor,
    color,
    zoom = 1,
    precision,
    width,
    onChange,
  }): ReactElement => {
    const font = Theming.useTypography(level);
    const [box_, setBox] = useState<box.Box>(box.ZERO);

    const valueBoxHeight = (font.lineHeight + 2) * font.baseSize + 2;
    const resizeRef = useResize(setBox, {});

    const adjustedBox = adjustBox(
      label?.orientation ?? "top",
      zoom,
      box_,
      valueBoxHeight,
      position,
    );

    CoreValue.use({
      aetherKey,
      color: textColor,
      level,
      box: adjustedBox,
      telem: telem.fixedString("120 PSI"),
      precision,
      width,
    });

    return (
      <Labeled
        className={CSS(className, CSS.B("value-labeled"))}
        align="center"
        ref={resizeRef}
        onChange={onChange}
        {...label}
      >
        <Primitives.Value
          className={CSS.B("value")}
          color={color}
          dimensions={{
            height: valueBoxHeight,
            width: 100,
          }}
        >
          {children}
        </Primitives.Value>
      </Labeled>
    );
  },
);

const adjustBox = (
  labelOrientation: location.Outer,
  zoom: number,
  b: box.Box,
  valueBoxHeight: number,
  position?: xy.XY,
): box.Box => {
  if (labelOrientation === "left") {
    return box.construct(
      (position?.x ?? box.left(b)) + box.width(b) / zoom - 100,
      position?.y ?? box.top(b),
      100,
      valueBoxHeight,
    );
  }
  if (labelOrientation === "right") {
    return box.construct(
      position?.x ?? box.left(b),
      position?.y ?? box.top(b),
      100,
      valueBoxHeight,
    );
  }
  if (labelOrientation === "bottom") {
    return box.construct(
      position?.x ?? box.left(b),
      position?.y ?? box.top(b),
      box.width(b) / zoom,
      valueBoxHeight,
    );
  }

  return box.construct(
    position?.x ?? box.left(b),
    (position?.y ?? box.top(b)) + box.height(b) / zoom - valueBoxHeight,
    box.width(b) / zoom,
    valueBoxHeight,
  );
};

export const ValuePreview = ({ color }: ValueProps): ReactElement => {
  return (
    <Primitives.Value
      color={color}
      dimensions={{
        width: 80,
        height: 25,
      }}
    >
      <Text.Text level="small">500 psi</Text.Text>
    </Primitives.Value>
  );
};
