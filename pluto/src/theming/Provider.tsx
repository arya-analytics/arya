// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import {
  type PropsWithChildren,
  type ReactElement,
  createContext,
  useContext as reactUseContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  useCallback,
} from "react";

import { deep } from "@synnaxlabs/x";

import { Aether } from "@/aether";
import { CSS } from "@/css";
import { Input } from "@/input";
import { type SwitchProps } from "@/input/Switch";
import { theming } from "@/theming/aether";
import { toCSSVars } from "@/theming/css";

import "@/theming/theme.css";

export interface ContextValue {
  theme: theming.Theme;
  toggleTheme: () => void;
  setTheme: (key: string) => void;
}

const Context = createContext<ContextValue>({
  theme: theming.themeZ.parse(theming.SYNNAX_THEMES.synnaxLight),
  toggleTheme: () => undefined,
  setTheme: () => undefined,
});

export interface UseProviderProps {
  theme?: deep.Partial<theming.ThemeSpec>;
  setTheme?: (key: string) => void;
  toggleTheme?: () => void;
  themes?: Record<string, theming.ThemeSpec>;
  lightTheme?: string;
  darkTheme?: string;
}

export type UseProviderReturn = ContextValue;

const prefersDark = (): MediaQueryList | null => {
  if (typeof window?.matchMedia === "undefined") return null;
  return window.matchMedia("(prefers-color-scheme: dark)");
};

const isDarkMode = (): boolean => prefersDark()?.matches ?? true;

export const useProvider = ({
  theme,
  themes = theming.SYNNAX_THEMES,
  setTheme,
  toggleTheme,
  lightTheme = "synnaxLight",
  darkTheme = "synnaxDark",
}: UseProviderProps): UseProviderReturn => {
  const [selected, setSelected] = useState<string>(
    isDarkMode() ? darkTheme : lightTheme,
  );

  const parsedThemes = useMemo(() => {
    if (theme != null) {
      const synnaxLight = theming.themeZ.parse(deep.merge(theming.SYNNAX_LIGHT, theme));
      const synnaxDark = theming.themeZ.parse(deep.merge(theming.SYNNAX_DARK, theme));
      return { synnaxLight, synnaxDark };
    }
    return Object.entries(themes).reduce<Record<string, theming.Theme>>(
      (acc, [key, value]) => ({ ...acc, [key]: theming.themeZ.parse(value) }),
      {},
    );
  }, [theme, themes]);

  const handleToggle = useCallback((): void => {
    const keys = Object.keys(themes);
    const index = keys.indexOf(selected);
    const nextIndex = (index + 1) % keys.length;
    setSelected(keys[nextIndex]);
  }, [toggleTheme, selected, themes]);

  const parsedTheme = useMemo(() => parsedThemes[selected], [parsedThemes, selected]);

  useEffect(() => {
    const listener = (): void => setSelected(isDarkMode() ? darkTheme : lightTheme);
    prefersDark()?.addEventListener("change", listener);
    return () => prefersDark()?.removeEventListener("change", listener);
  }, []);

  return {
    theme: parsedTheme,
    toggleTheme: toggleTheme ?? handleToggle,
    setTheme: setTheme ?? setSelected,
  };
};

export const useContext = (): ContextValue => reactUseContext(Context);

export const use = (): theming.Theme => useContext().theme;

export interface ProviderProps extends PropsWithChildren<unknown>, UseProviderProps {
  applyCSSVars?: boolean;
  defaultTheme?: string;
}

export const Provider = Aether.wrap<ProviderProps>(
  theming.Provider.TYPE,
  ({ children, aetherKey, applyCSSVars = true, ...props }): ReactElement => {
    const ret = useProvider(props);
    const [{ path }, , setAetherTheme] = Aether.use({
      aetherKey,
      type: theming.Provider.TYPE,
      schema: theming.Provider.z,
      initialState: { theme: ret.theme },
    });

    useEffect(() => setAetherTheme({ theme: ret.theme }), [ret.theme]);

    useLayoutEffect(() => {
      if (applyCSSVars) CSS.applyVars(document.documentElement, toCSSVars(ret.theme));
      else CSS.removeVars(document.documentElement, "--pluto");
    }, [ret.theme]);
    return (
      <Context.Provider value={ret}>
        <Aether.Composite path={path}>{children}</Aether.Composite>
      </Context.Provider>
    );
  },
);

export const Switch = ({
  ...props
}: Omit<SwitchProps, "onChange" | "value">): ReactElement => {
  const { toggleTheme } = useContext();
  const [checked, setChecked] = useState(false);
  return (
    <Input.Switch
      value={checked}
      onChange={(v) => {
        toggleTheme();
        setChecked(v);
      }}
      {...props}
    />
  );
};
