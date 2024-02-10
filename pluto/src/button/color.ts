// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { type Variant } from "@/button/Button";
import { type Color } from "@/color";
import { type Text } from "@/text";

export const color = (
  variant: Variant,
  disabled?: boolean,
  color?: Color.Crude,
  shade?: Text.Shade,
): Color.Crude | undefined => {
  if (disabled === true) return "var(--pluto-gray-l5)";
  if (color != null) return color;
  if (variant === "filled") return "var(--pluto-white)";
  if (shade != null) return undefined;
  return "var(--pluto-text-color)";
};
