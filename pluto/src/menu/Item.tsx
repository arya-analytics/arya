// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { type FunctionComponent, type ReactElement } from "react";

import { Button } from "@/button";
import { CSS } from "@/css";
import { useMenuContext } from "@/menu/Menu";

import "@/menu/Item.css";

const menuItemFactory =
  <E extends Pick<Button.ButtonProps, "className" | "onClick">>(
    Base: FunctionComponent<E>,
    defaultProps?: Partial<E>,
  ): FunctionComponent<E & { itemKey: string }> =>
  // eslint-disable-next-line react/display-name
  (props): ReactElement => {
    const { itemKey, className, onClick, size, ...rest } = {
      ...defaultProps,
      ...props,
    };

    const { onClick: ctxOnClick, selected, level, iconSpacing } = useMenuContext();

    const handleClick: Button.ButtonProps["onClick"] = (e) => {
      ctxOnClick(itemKey);
      onClick?.(e);
    };
    const _selected = selected === itemKey;
    return (
      // @ts-expect-error
      <Base
        level={level}
        {...rest}
        onClick={handleClick}
        variant="text"
        className={CSS(CSS.B("menu-item"), CSS.selected(_selected), className)}
        size={size ?? iconSpacing}
      />
    );
  };

export interface ItemProps extends Button.ButtonProps {
  itemKey: string;
}
export const CoreItem = menuItemFactory(Button.Button, { noWrap: true });

export interface ItemIconProps extends Button.IconProps {
  itemKey: string;
}
const ItemIcon = menuItemFactory(Button.Icon);

const ItemLink = menuItemFactory(Button.Link, { noWrap: true });
export interface MenuItemLinkProps extends Button.LinkProps {
  itemKey: string;
}

type CoreItemType = typeof CoreItem;

export interface ItemType extends CoreItemType {
  Icon: typeof ItemIcon;
  Link: typeof ItemLink;
}

/**
 * Menu.Item renders a menu item.
 *
 * @param props - Props for the component. Identical props to those of Use except
 * for the ones listed below.
 * @param props.itemKey - The key of the item. This is used to identify the item and
 * is passed to the onChange callback of the Menu.
 */
export const Item = CoreItem as ItemType;
Item.Icon = ItemIcon;
Item.Link = ItemLink;
