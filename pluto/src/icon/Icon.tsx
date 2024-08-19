// Copyright 2024 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import "@/icon/Icon.css";

import { Icon as MediaIcon } from "@synnaxlabs/media";
import { location } from "@synnaxlabs/x";
import { cloneElement, ComponentPropsWithoutRef, ReactElement, SVGProps } from "react";

import { CSS } from "@/css";

interface BaseIconProps extends SVGProps<SVGSVGElement> {}

export interface IconProps
  extends Partial<Record<location.CornerXYString, ReactElement<BaseIconProps>>>,
    ComponentPropsWithoutRef<"div"> {
  children: ReactElement<BaseIconProps>;
}

const clone = (value: ReactElement<BaseIconProps>, key: location.CornerXYString) =>
  cloneElement(value, {
    className: CSS(value.props.className, CSS.B("sub"), CSS.M(key)),
  });

export const Icon = ({
  topRight,
  topLeft,
  bottomLeft,
  bottomRight,
  children,
  className,
  ...props
}: IconProps) => (
  <div className={CSS(className, CSS.B("icon"))} {...props}>
    {topRight && clone(topRight, "topRight")}
    {topLeft && clone(topLeft, "topLeft")}
    {bottomLeft && clone(bottomLeft, "bottomLeft")}
    {bottomRight && clone(bottomRight, "bottomRight")}
    {children}
  </div>
);

export interface CreateProps extends Omit<IconProps, "topRight"> {}

export const Create = (props: CreateProps): ReactElement => (
  <Icon topRight={<MediaIcon.Add />} {...props} />
);
