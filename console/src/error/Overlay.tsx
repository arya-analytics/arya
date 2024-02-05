import { useEffect, type PropsWithChildren, type ReactElement } from "react";

import { Logo } from "@synnaxlabs/media";
import {
  Align,
  Button,
  Nav,
  OS,
  Status,
  Text,
  componentRenderProp,
} from "@synnaxlabs/pluto";
import { CSS as PCSS } from "@synnaxlabs/pluto/css";
import { Theming } from "@synnaxlabs/pluto/theming";
import { appWindow } from "@tauri-apps/api/window";
import { ErrorBoundary, type ErrorBoundaryProps } from "react-error-boundary";

import { Controls } from "@/components";
import { CSS } from "@/css";
import { NAV_SIZES } from "@/layouts/LayoutMain";

import "@/error/Overlay.css";

export interface ErrorOverlayProps extends PropsWithChildren<{}> {}

const messageTranslation = {
  "[persist] - windows open":
    "It seems like you have Synnax open from multiple windows. Please close all other windows and reopen Synnax.",
};

const FallbackRender: ErrorBoundaryProps["fallbackRender"] = ({
  error,
  resetErrorBoundary,
}) => {
  useEffect(() => {
    // grab the prefers-color-scheme media query
    try {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const theme = mediaQuery.matches
        ? Theming.themes.synnaxDark
        : Theming.themes.synnaxLight;
      PCSS.applyVars(
        document.documentElement,
        Theming.toCSSVars(Theming.themeZ.parse(theme)),
      );
    } catch (e) {
      console.error(e);
    }
  }, []);

  const os = OS.use();

  return (
    <Align.Space directon="y" className={CSS.B("error-overlay")}>
      <Nav.Bar
        data-tauri-drag-region
        location="top"
        size={NAV_SIZES.top}
        className="console-main-nav-top"
      >
        <Nav.Bar.Start className="console-main-nav-top__start" data-tauri-drag-region>
          <OS.Controls
            className="console-controls--macos"
            visibleIfOS="MacOS"
            onClose={() => {
              void appWindow.close();
            }}
            onMinimize={() => {
              void appWindow.minimize();
            }}
            onMaximize={() => {
              void appWindow.maximize();
            }}
          />
          {os === "Windows" && (
            <Logo
              className="console-main-nav-top__logo"
              variant="icon"
              data-tauri-drag-region
            />
          )}
        </Nav.Bar.Start>
        <Nav.Bar.End
          className="console-main-nav-top__end"
          justify="end"
          data-tauri-drag-region
        >
          <OS.Controls
            className="console-controls--windows"
            visibleIfOS="Windows"
            onClose={() => {
              void appWindow.close();
            }}
            onMinimize={() => {
              void appWindow.minimize();
            }}
            onMaximize={() => {
              void appWindow.maximize();
            }}
          />
        </Nav.Bar.End>
      </Nav.Bar>

      <Align.Center role="alert">
        <Align.Space direction="x" className={CSS.B("dialog")} size={20}>
          <Logo variant="icon" />
          <Align.Space directon="y" align="start" className={CSS.B("details")}>
            <Text.Text level="h1">Something went wrong</Text.Text>
            <Status.Text variant="error" hideIcon level="h3">
              {messageTranslation[error.message] || error.message}
            </Status.Text>
            <Text.Text className={CSS.B("stack")} level="p">
              {error.stack}
            </Text.Text>
            <Button.Button onClick={resetErrorBoundary}>Try again</Button.Button>
          </Align.Space>
        </Align.Space>
      </Align.Center>
    </Align.Space>
  );
};

const fallbackRender = componentRenderProp(FallbackRender);

export const ErrorOverlay = ({ children }: ErrorOverlayProps): ReactElement => (
  <ErrorBoundary fallbackRender={fallbackRender}>{children}</ErrorBoundary>
);
