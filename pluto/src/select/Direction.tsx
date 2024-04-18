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
import { type direction } from "@synnaxlabs/x";

import { Button as CoreButton } from "@/button";
import { Button, type ButtonOptionProps, type ButtonProps } from "@/select/Button";

interface Entry {
  key: direction.Direction;
  icon: ReactElement;
}

export interface DirectionProps
  extends Omit<ButtonProps<direction.Direction, Entry>, "data" | "entryRenderKey"> {}

const DATA: Entry[] = [
  {
    key: "x",
    icon: <Icon.Arrow.Right />,
  },
  {
    key: "y",
    icon: <Icon.Arrow.Down />,
  },
];

const defaultSelectDirectionButton = ({
  key,
  entry,
  onClick,
  selected,
}: ButtonOptionProps<direction.Crude, Entry>): ReactElement => {
  return (
    <CoreButton.Icon
      key={key}
      variant={selected ? "filled" : "outlined"}
      onClick={onClick}
    >
      {entry.icon}
    </CoreButton.Icon>
  );
};

export const Direction = ({
  children = defaultSelectDirectionButton,
  allowMultiple = false,
  ...props
}: DirectionProps): ReactElement => {
  return (
    <Button {...props} data={DATA}>
      {children}
    </Button>
  );
};
