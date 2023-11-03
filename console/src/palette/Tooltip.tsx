// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { type ReactElement } from "react";

import { Align, Text, Triggers } from "@synnaxlabs/pluto";

import { type TriggerConfig } from "@/palette/types";

const TOOLTIP_TEXT_LEVEL: Text.Level = "small";

export interface TooltipContentProps {
  triggers: TriggerConfig;
}

export const TooltipContent = ({ triggers }: TooltipContentProps): ReactElement => (
  <Align.Space>
    <Align.Space direction="x" justify="spaceBetween" align="center">
      <Text.Text level={TOOLTIP_TEXT_LEVEL}>Search</Text.Text>
      <Triggers.Text trigger={triggers.resource[0]} level={TOOLTIP_TEXT_LEVEL} />
    </Align.Space>
    <Align.Space direction="x" justify="spaceBetween" align="center">
      <Text.Text level={TOOLTIP_TEXT_LEVEL}>Command Palette</Text.Text>
      <Triggers.Text trigger={triggers.command[0]} level={TOOLTIP_TEXT_LEVEL} />
    </Align.Space>
  </Align.Space>
);
