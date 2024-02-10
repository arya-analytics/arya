// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { type ReactElement, useEffect } from "react";

import { setWindowDecorations } from "@synnaxlabs/drift";
import { useSelectWindowAttribute, useSelectWindowKey } from "@synnaxlabs/drift/react";
import { Logo } from "@synnaxlabs/media";
import { Nav, OS, Align, Menu as PMenu, Text } from "@synnaxlabs/pluto";
import { appWindow } from "@tauri-apps/api/window";
import { useDispatch } from "react-redux";

import { Controls, Menu } from "@/components";
import { CSS } from "@/css";
import { Content } from "@/layout/Content";
import { useSelect } from "@/layout/selectors";

import "@/layout/Window.css";

export interface NavTopProps {
  title: string;
}

export const NavTop = ({ title }: NavTopProps): ReactElement => {
  const os = OS.use();
  return (
    <Nav.Bar data-tauri-drag-region location="top" size={"6rem"}>
      <Nav.Bar.Start className="console-main-nav-top__start">
        <Controls
          className="console-controls--macos"
          visibleIfOS="MacOS"
          forceOS={os}
        />
        {os === "Windows" && <Logo className="console-main-nav-top__logo" />}
      </Nav.Bar.Start>
      <Nav.Bar.AbsoluteCenter>
        <Text.Text level="p" shade={7} weight={450}>
          {title}
        </Text.Text>
      </Nav.Bar.AbsoluteCenter>
      {os === "Windows" && (
        <Nav.Bar.End>
          <Controls
            className="console-controls--windows"
            visibleIfOS="Windows"
            forceOS={os}
          />
        </Nav.Bar.End>
      )}
    </Nav.Bar>
  );
};

export const DefaultContextMenu = (): ReactElement => (
  <PMenu.Menu>
    <Menu.Item.HardReload />
  </PMenu.Menu>
);

export const Window = (): ReactElement | null => {
  const { label } = appWindow;
  const win = useSelectWindowKey(label);
  const layout = useSelect(win ?? "");
  const os = OS.use();
  const dispatch = useDispatch();
  useEffect(() => {
    if (os === "Windows") {
      dispatch(setWindowDecorations({ value: false }));
    }
  }, [os]);
  const menuProps = PMenu.useContextMenu();
  const maximized = useSelectWindowAttribute(label, "maximized") ?? false;
  if (layout == null) return null;
  const content = <Content layoutKey={layout.key} />;
  return (
    <PMenu.ContextMenu menu={() => <DefaultContextMenu />} {...menuProps}>
      <Align.Space
        empty
        className={CSS(
          CSS.B("main"),
          CSS.BM("main", os?.toLowerCase()!),
          maximized && CSS.BM("main", "maximized"),
        )}
      >
        {layout?.window?.navTop === true && <NavTop title={layout.name} />}
        {content}
      </Align.Space>
    </PMenu.ContextMenu>
  );
};
