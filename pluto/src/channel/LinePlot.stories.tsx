// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { type ReactElement } from "react";

import { type Meta } from "@storybook/react";
import { TimeSpan } from "@synnaxlabs/x";

import { LinePlot, type AxisProps, type LineProps } from "@/channel/LinePlot";
import { Canvas } from "@/vis/canvas";

const story: Meta<typeof LinePlot> = {
  title: "Channel LinePlot",
  component: LinePlot,
};

const AXES: AxisProps[] = [
  {
    key: "x",
    location: "bottom",
    label: "Time",
    type: "time",
  },
  {
    key: "y",
    location: "left",
    label: "Value",
    type: "linear",
  },
];

const LINES: LineProps[] = [
  {
    key: "0",
    variant: "dynamic",
    span: TimeSpan.seconds(5),
    axes: {
      x: "x",
      y: "y",
    },
    channels: {
      x: 65537,
      y: 65538,
    },
    color: "#F733FF",
    strokeWidth: 2,
  },
];

export const Primary = (): ReactElement => {
  return (
    <Canvas.Canvas
      style={{
        width: "100%",
        height: "100%",
        position: "fixed",
        top: 0,
        left: 0,
      }}
    >
      <LinePlot axes={AXES} lines={LINES} />
    </Canvas.Canvas>
  );
};

// eslint-disable-next-line import/no-default-export
export default story;
