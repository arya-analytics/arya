// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { type ReactElement } from "react";

import { Status, Color, Input, Align, PIDElement } from "@synnaxlabs/pluto";
import { useDispatch } from "react-redux";

import { CSS } from "@/css";
import { type ElementInfo, useSelectSelectedElementsProps } from "@/pid/selectors";
import { setElementProps } from "@/pid/slice";

import "@/pid/toolbar/Properties.css";

export interface PropertiesProps {
  layoutKey: string;
}

export const PropertiesControls = ({ layoutKey }: PropertiesProps): ReactElement => {
  const elements = useSelectSelectedElementsProps(layoutKey);

  const dispatch = useDispatch();

  const handleChange = (key: string, props: any): void => {
    dispatch(setElementProps({ layoutKey, key, props }));
  };

  if (elements.length === 0) {
    return (
      <Status.Text.Centered variant="disabled" hideIcon>
        Select a PID element to configure its properties.
      </Status.Text.Centered>
    );
  }

  if (elements.length > 1) {
    const groups: Record<string, ElementInfo[]> = {};
    elements.forEach((e) => {
      let color: Color.Color | null = null;
      if (e.type === "edge") color = new Color.Color(e.edge.color ?? Color.ZERO);
      else if ("color" in e.props) color = new Color.Color(e.props.color);
      if (color === null) return;
      const hex = color.hex;
      if (!(hex in groups)) groups[hex] = [];
      groups[hex].push(e);
    });
    return (
      <Align.Space className={CSS.B("pid-properties")} size="small">
        <Input.Label>Selection Colors</Input.Label>
        {Object.entries(groups).map(([hex, elements]) => {
          return (
            <Color.Swatch
              key={elements[0].key}
              value={hex}
              onChange={(color) => {
                elements.forEach((e) => {
                  handleChange(e.key, { color: color.hex });
                });
              }}
            />
          );
        })}
      </Align.Space>
    );
  }

  const selected = elements[0];

  if (selected.type === "edge") {
    return (
      <Color.Swatch
        value={selected.edge.color ?? Color.ZERO}
        onChange={(color) => {
          handleChange(selected.key, { color: color.hex });
        }}
      />
    );
  }

  const C = PIDElement.REGISTRY[selected.props.type];

  return (
    <Align.Space className={CSS.B("pid-properties")} size="small">
      <C.Form
        value={selected.props}
        onChange={(props) => handleChange(selected.key, props)}
      />
    </Align.Space>
  );
};
