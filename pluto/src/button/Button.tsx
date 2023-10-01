// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { type ComponentPropsWithoutRef, type ReactElement } from "react";

import { type Optional } from "@synnaxlabs/x";

import { type Align } from "@/align";
import { color } from "@/button/color";
import { CSS } from "@/css";
import { Text } from "@/text";
import { Tooltip } from "@/tooltip";
import { type ComponentSize } from "@/util/component";

import "@/button/Button.css";

/** The variant of button */
export type Variant = "filled" | "outlined" | "text";

export interface ButtonExtensionProps {
  variant?: Variant;
  size?: ComponentSize;
  sharp?: boolean;
}

/** The base props accepted by all button types in this directory. */
export interface BaseProps
  extends ComponentPropsWithoutRef<"button">,
    ButtonExtensionProps {}

/** The props for the {@link Button} component. */
export interface ButtonProps
  extends Optional<Omit<Text.WithIconProps<"button">, "size">, "level">,
    ButtonExtensionProps {
  startIcon?: ReactElement | ReactElement[];
  endIcon?: ReactElement | ReactElement[];
  iconSpacing?: Align.SpaceProps["size"];
}

/**
 * Button is a basic button component.
 *
 * @param props - Props for the component, which are passed down to the underlying button
 * element.
 * @param props.size - The size of button render.
 * @param props.variant - The variant to render for the button. Options are "filled"
 * (default), "outlined", and "text".
 * @param props.startIcon - An optional icon to render before the start of the button
 * text. This can be a single icon or an array of icons. The icons will be formatted
 * to match the color and size of the button.
 * @param props.endIcon - The same as {@link startIcon}, but renders after the button
 * text.
 */
export const Button = Tooltip.wrap(
  ({
    size = "medium",
    variant = "filled",
    className,
    children,
    iconSpacing,
    sharp = false,
    disabled = false,
    level,
    onClick,
    ...props
  }: ButtonProps): ReactElement => (
    <Text.WithIcon
      el="button"
      className={CSS(
        CSS.B("btn"),
        CSS.size(size),
        CSS.sharp(sharp),
        CSS.disabled(disabled),
        CSS.BM("btn", variant),
        className,
      )}
      level={level ?? Text.ComponentSizeLevels[size]}
      size={iconSpacing}
      onClick={!disabled ? onClick : undefined}
      noWrap
      color={color(variant, disabled, props.color)}
      {...props}
    >
      {children}
    </Text.WithIcon>
  ),
);
