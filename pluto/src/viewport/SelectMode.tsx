// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { type ReactElement, type ReactNode } from "react";

import { Icon } from "@synnaxlabs/media";
import { caseconv } from "@synnaxlabs/x";

import { Align } from "@/align";
import { Button } from "@/button";
import { Select } from "@/select";
import { Text } from "@/text";
import { Triggers } from "@/triggers";
import { type Trigger } from "@/triggers/triggers";
import { MODES, type Mode, type UseTriggers } from "@/viewport/use";

interface Entry {
  key: Mode;
  icon: ReactElement;
  tooltip: ReactNode;
}

interface TooltipProps {
  mode: Mode;
  triggers: Trigger[];
}

const Tooltip = ({ mode, triggers }: TooltipProps): ReactElement => (
  <Align.Space direction="x" align="center">
    <Text.Text level="small">{caseconv.capitalize(mode)}</Text.Text>
    <Triggers.Text trigger={triggers[0]} level="small" />
  </Align.Space>
);

const MODE_ICONS: Record<Mode, ReactElement> = {
  zoom: <Icon.Zoom />,
  pan: <Icon.Pan />,
  select: <Icon.Selection />,
  zoomReset: <Icon.Expand />,
  click: <Icon.Bolt />,
};

export interface SelectModeProps extends Omit<Select.ButtonProps<Mode>, "data"> {
  triggers: UseTriggers;
  disable?: Mode[];
}

export const SelectMode = ({
  triggers,
  disable = ["zoomReset", "click"],
  ...props
}: SelectModeProps): ReactElement => {
  const data = Object.entries(triggers)
    .filter(([key]) => !disable.includes(key as Mode) && MODES.includes(key as Mode))
    .map(([key, value]) => ({
      key: key as Mode,
      icon: MODE_ICONS[key as Mode],
      tooltip: <Tooltip mode={key as Mode} triggers={value as Trigger[]} />,
    }))
    .sort((a, b) => MODES.indexOf(a.key) - MODES.indexOf(b.key));

  return (
    <Select.Button<Mode, Entry> {...props} data={data} entryRenderKey="icon">
      {({ title: _, entry, ...props }) => (
        <Button.Icon
          {...props}
          key={entry.key}
          variant={props.selected ? "filled" : "text"}
          size="medium"
          tooltip={entry.tooltip}
          tooltipLocation={{ x: "right", y: "top" }}
        >
          {entry.icon}
        </Button.Icon>
      )}
    </Select.Button>
  );
};
