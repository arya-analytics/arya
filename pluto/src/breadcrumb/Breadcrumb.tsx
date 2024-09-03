// Copyright 2024 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { Icon } from "@synnaxlabs/media";
import { deep, Optional, toArray } from "@synnaxlabs/x";
import { FC, ReactElement } from "react";

import { Align } from "@/align";
import { CSS } from "@/css";
import { Text } from "@/text";
import { isValidElement } from "@/util/children";

/**
 * Props for the Breadcrumb component.
 *
 * @template E - The type of the space element.
 * @template L - The text level.
 */
export type BreadcrumbProps<
  E extends Align.SpaceElementType = "div",
  L extends Text.Level = Text.Level,
> = Optional<Omit<Text.WithIconProps<E, L>, "children">, "level"> & {
  /** Icon to display in the breadcrumb. */
  icon?: string;
  /** The breadcrumb items, either a single string or an array of strings. */
  children: string | string[];
  /** Separator to use between breadcrumb items. Defaults to ".". */
  separator?: string;
  /** Whether to hide the first breadcrumb item. */
  hideFirst?: boolean;
};

/**
 * Breadcrumb component for displaying a breadcrumb navigation.
 *
 * @template E - The type of the space element.
 * @template L - The text level.
 *
 * @param props - The props for the Breadcrumb component.
 * @returns The Breadcrumb component.
 */
export const Breadcrumb = <
  E extends Align.SpaceElementType = "div",
  L extends Text.Level = Text.Level,
>({
  children,
  icon,
  shade = 7,
  weight = 450,
  size = 0.5,
  level = "p",
  separator = ".",
  className,
  hideFirst = false,
  ...props
}: BreadcrumbProps<E, L>): ReactElement => {
  let iconC: ReactElement | undefined = undefined;
  if (icon) {
    if (isValidElement(icon)) iconC = icon;
    else {
      const IconC = deep.get<FC, typeof Icon>(Icon, icon);
      iconC = <IconC />;
    }
  }
  const split = toArray(children)
    .map((el) => el.split(separator))
    .flat();
  const content: (ReactElement | string)[] = split
    .map((el, index) => [
      <Icon.Caret.Right
        key={`${el}-${index}`}
        style={{
          transform: "scale(0.8) translateY(1px)",
          color: CSS.shade(shade),
        }}
      />,
      el,
    ])
    .flat();
  if (hideFirst) content.shift();
  return (
    <Text.WithIcon
      className={CSS(className, CSS.B("breadcrumb"))}
      level={level}
      shade={shade}
      weight={weight}
      size={size}
      {...props}
    >
      {iconC}
      {...content}
    </Text.WithIcon>
  );
};