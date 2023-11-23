// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { type ReactElement, useCallback } from "react";

import { type location } from "@synnaxlabs/x";

import { Align } from "@/align";
import { Text } from "@/text";

export interface LabelExtensionProps {
  label?: string;
  level?: Text.Level;
  orientation?: location.Outer;
}

export interface LabeledProps
  extends Omit<Align.SpaceProps, "value" | "onChange" | "direction">,
    LabelExtensionProps {
  onChange: ({ label }: { label: LabelExtensionProps }) => void;
}

export const Labeled = ({
  label: value = "",
  onChange,
  level = "p",
  children,
  orientation = "top",
  style,
  ...props
}: LabeledProps): ReactElement => {
  return (
    <Align.Space
      style={{
        // You may be wondering, why do we do this here? Well it's because react flow
        // uses a ResizeObserver to determine when to re-render edges. When we switch
        // from 'left' to 'right' or 'top' to 'bottom', the width and height of the
        // node remains the same, so the ResizeObserver doesn't fire. We need to redraw
        // the edges, so we add a margin to trigger it.
        marginRight: orientation === "right" ? 1 : 0,
        marginTop: orientation === "top" ? 1 : 0,
        ...style,
      }}
      align="center"
      justify="center"
      direction={orientation}
      {...props}
    >
      <Text.Editable
        value={value}
        onChange={useCallback(
          (label) =>
            onChange({
              label: { label, level, orientation },
            }),
          [onChange, level],
        )}
        level={level}
      />
      {children}
    </Align.Space>
  );
};
