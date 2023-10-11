// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { MAIN_WINDOW } from "@synnaxlabs/drift";
import { Haul, Mosaic, Theming } from "@synnaxlabs/pluto";
import { type deep, type location } from "@synnaxlabs/x";
import { nanoid } from "nanoid";

import { type LayoutState } from "@/layout/layout";

/** The state of the layout slice */
export interface SliceState {
  /** The current theme. */
  activeTheme: string;
  /**
   * A record of theme keys to themes. The active theme is guaranteed to be present
   * in this record. */
  themes: Record<string, Theming.ThemeSpec>;
  /**
   * A record of layout keys to layouts. These represent the properties of all layouts
   * currently rendered in the mosaic or in external windows.
   */
  layouts: Record<string, LayoutState>;
  hauling: Haul.DraggingState;
  mosaics: Record<string, MosaicState>;
  nav: NavState;
  alreadyCheckedGetStarted: boolean;
}

export interface MosaicState {
  activeTab: string | null;
  root: Mosaic.Node;
}

export interface NavState {
  drawers: NavDrawerState;
}

export type NavdrawerLocation = "right" | "left" | "bottom";

export interface NavDrawerState {
  left: NavdrawerEntryState;
  right: NavdrawerEntryState;
  bottom: NavdrawerEntryState;
}

export interface NavdrawerEntryState {
  activeItem: string | null;
  menuItems: string[];
  size?: number;
}

/**
 * The name of the layout slice in a larger store.
 * NOTE: This must be the name of the slice in the store, or else all selectors will fail.
 */
export const SLICE_NAME = "layout";

/**
 * Represents a partial view of a larger store that contains the layout slice. This is
 * typically used for hooks that accept the entire store state as a parameter but only
 * need access to the layout slice.
 */
export interface StoreState {
  [SLICE_NAME]: SliceState;
}

export const MAIN_LAYOUT: LayoutState = {
  name: "Main",
  key: "main",
  type: "main",
  location: "window",
  windowKey: MAIN_WINDOW,
  window: {
    navTop: false,
  },
};

const ZERO_MOSAIC_STATE: MosaicState = {
  activeTab: null,
  root: {
    key: 1,
    tabs: [],
  },
};

export const ZERO_SLICE_STATE: SliceState = {
  activeTheme: "synnaxDark",
  themes: Theming.themes,
  alreadyCheckedGetStarted: false,
  layouts: {
    main: MAIN_LAYOUT,
  },
  mosaics: {
    main: ZERO_MOSAIC_STATE,
  },
  hauling: Haul.ZERO_DRAGGING_STATE,
  nav: {
    drawers: {
      left: {
        activeItem: null,
        menuItems: ["clusters", "resources"],
      },
      right: {
        activeItem: null,
        menuItems: ["workspace"],
      },
      bottom: {
        activeItem: null,
        menuItems: ["visualization"],
      },
    },
  },
};

export const PERSIST_EXCLUDE = ["alreadyCheckedGetStarted"].map(
  (key) => `${SLICE_NAME}.${key}`
) as Array<deep.Key<StoreState>>;

/** Signature for the placeLayut action. */
export type PlacePayload = LayoutState;
/** Signature for the removeLayout action. */
export interface RemovePayload {
  keys: string[];
}
/** Signature for the setTheme action. */
export type SetActiveThemePayload = string | undefined;

export interface MoveMosaicTabPayload {
  tabKey: string;
  windowKey?: string;
  key: number;
  loc: location.Location;
}
interface ResizeMosaicTabPayload {
  windowKey: string;
  key: number;
  size: number;
}
interface SelectMosaicTabPayload {
  tabKey: string;
}
interface RenamePayload {
  key: string;
  name: string;
}

interface ResizeNavdrawerPayload {
  location: NavdrawerLocation;
  size: number;
}
interface SetHaulingPayload extends Haul.DraggingState {}

export interface SetSlicePayload {
  keepNav?: boolean;
  slice: SliceState;
}

interface SetNavdrawerVisiblePayload {
  key?: string;
  location?: NavdrawerLocation;
  value?: boolean;
}

export const { actions, reducer } = createSlice({
  name: SLICE_NAME,
  initialState: ZERO_SLICE_STATE,
  reducers: {
    place: (state, { payload: layout }: PayloadAction<PlacePayload>) => {
      const { key, location, name, tab } = layout;

      const prev = state.layouts[key];
      const mosaic = state.mosaics[layout.windowKey];

      if (layout.type === MOSAIC_WINDOW_TYPE) {
        state.mosaics[key] = ZERO_MOSAIC_STATE;
      }

      // If we're moving from a mosaic, remove the tab.
      if (prev != null && prev.location === "mosaic" && location !== "mosaic")
        [mosaic.root] = Mosaic.removeTab(mosaic.root, key);

      const mosaicTab = {
        closable: true,
        ...tab,
        name,
        tabKey: key,
      };
      delete mosaicTab.location;
      delete mosaicTab.mosaicKey;

      // If we're moving to a mosaic, insert a tab.
      if (prev?.location !== "mosaic" && location === "mosaic") {
        mosaic.root = Mosaic.insertTab(
          mosaic.root,
          mosaicTab,
          tab?.location,
          tab?.mosaicKey
        );
        mosaic.activeTab = key;
      }

      // If the tab already exists and its in the mosaic, make it the active tab
      // and select it. Also rename it.
      if (prev?.location === "mosaic" && location === "mosaic") {
        mosaic.activeTab = key;
        mosaic.root = Mosaic.renameTab(Mosaic.selectTab(mosaic.root, key), key, name);
      }

      state.layouts[key] = layout;
      state.mosaics[layout.windowKey] = mosaic;
    },
    setHauled: (state, { payload }: PayloadAction<SetHaulingPayload>) => {
      state.hauling = payload;
    },
    remove: (state, { payload: { keys } }: PayloadAction<RemovePayload>) => {
      keys.forEach((contentKey) => {
        const layout = state.layouts[contentKey];
        if (layout == null) return;
        const mosaic = state.mosaics[layout.windowKey];
        if (layout == null || mosaic == null) return;
        const { location } = layout;
        if (location === "mosaic")
          [mosaic.root, mosaic.activeTab] = Mosaic.removeTab(mosaic.root, contentKey);
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete state.layouts[contentKey];
        state.mosaics[layout.windowKey] = mosaic;
      });
    },
    moveMosaicTab: (
      state,
      { payload: { tabKey, windowKey, key, loc } }: PayloadAction<MoveMosaicTabPayload>
    ) => {
      const layout = state.layouts[tabKey];
      const prevWindowKey = layout.windowKey;
      if (windowKey == null || prevWindowKey === windowKey) {
        const mosaic = state.mosaics[prevWindowKey];
        [mosaic.root] = Mosaic.moveTab(mosaic.root, tabKey, loc, key);
        state.mosaics[prevWindowKey] = mosaic;
        return;
      }
      const prevMosaic = state.mosaics[prevWindowKey];
      [prevMosaic.root] = Mosaic.removeTab(prevMosaic.root, tabKey);
      state.mosaics[prevWindowKey] = prevMosaic;
      const mosaic = state.mosaics[windowKey];
      state.layouts[tabKey].windowKey = windowKey;

      const mosaicTab = {
        closable: true,
        ...layout.tab,
        name: layout.name,
        tabKey: layout.key,
      };

      mosaic.root = Mosaic.insertTab(mosaic.root, mosaicTab, loc, key);
      state.mosaics[windowKey] = mosaic;
    },
    selectMosaicTab: (
      state,
      { payload: { tabKey } }: PayloadAction<SelectMosaicTabPayload>
    ) => {
      const { windowKey } = state.layouts[tabKey];
      const mosaic = state.mosaics[windowKey];
      if (mosaic.activeTab === tabKey) return;
      mosaic.root = Mosaic.selectTab(mosaic.root, tabKey);
      mosaic.activeTab = tabKey;
      state.mosaics[windowKey] = mosaic;
    },
    resizeMosaicTab: (
      state,
      { payload: { key, size, windowKey } }: PayloadAction<ResizeMosaicTabPayload>
    ) => {
      const mosaic = state.mosaics[windowKey];
      mosaic.root = Mosaic.resizeNode(mosaic.root, key, size);
      state.mosaics[windowKey] = mosaic;
    },
    rename: (
      state,
      { payload: { key: tabKey, name } }: PayloadAction<RenamePayload>
    ) => {
      if (name.length === 0) return;
      const layout = state.layouts[tabKey];
      if (layout == null) return;
      const mosaic = state.mosaics[layout.windowKey];
      mosaic.root = Mosaic.renameTab(mosaic.root, tabKey, name);
      state.mosaics[layout.windowKey] = mosaic;
    },
    setActiveTheme: (state, { payload: key }: PayloadAction<SetActiveThemePayload>) => {
      if (key != null) state.activeTheme = key;
      else {
        const keys = Object.keys(state.themes).sort();
        const index = keys.indexOf(state.activeTheme);
        const next = keys[(index + 1) % keys.length];
        state.activeTheme = next;
      }
    },
    toggleActiveTheme: (state) => {
      const keys = Object.keys(state.themes);
      const index = keys.indexOf(state.activeTheme);
      const next = keys[(index + 1) % keys.length];
      state.activeTheme = next;
    },
    resizeNavdrawer: (
      state,
      { payload: { location, size } }: PayloadAction<ResizeNavdrawerPayload>
    ) => {
      state.nav.drawers[location].size = size;
    },
    setNavdrawerVisible: (
      state,
      { payload: { key, location, value } }: PayloadAction<SetNavdrawerVisiblePayload>
    ) => {
      if (key != null) {
        Object.values(state.nav.drawers).forEach((drawer) => {
          if (drawer.menuItems.includes(key)) {
            drawer.activeItem = value ?? drawer.activeItem !== key ? key : null;
          }
        });
      } else if (location != null) {
        const drawer = state.nav.drawers[location];
        if (value === true && drawer.activeItem == null)
          drawer.activeItem = drawer.menuItems[0];
        else if (value === false) drawer.activeItem = null;
        else if (drawer.activeItem == null) drawer.activeItem = drawer.menuItems[0];
        else drawer.activeItem = null;
      } else {
        throw new Error("setNavdrawerVisible requires either a key or location");
      }
    },
    maybeCreateGetStartedTab: (state) => {
      const checkedGetStarted = state.alreadyCheckedGetStarted;
      state.alreadyCheckedGetStarted = true;
      if (
        Object.values(state.layouts).filter(({ location }) => location === "mosaic")
          .length !== 0 ||
        checkedGetStarted
      )
        return;
      state.mosaics[MAIN_WINDOW].root = Mosaic.insertTab(
        state.mosaics[MAIN_WINDOW].root,
        {
          closable: true,
          tabKey: "getStarted",
          name: "Get Started",
          editable: false,
        }
      );
      state.layouts.getStarted = {
        name: "Get Started",
        key: "getStarted",
        location: "mosaic",
        type: "getStarted",
        windowKey: MAIN_WINDOW,
      };
    },
    setWorkspace: (
      state,
      { payload: { slice, keepNav = true } }: PayloadAction<SetSlicePayload>
    ) => {
      return {
        ...slice,
        hauling: state.hauling,
        themes: state.themes,
        activeTheme: state.activeTheme,
        nav: keepNav ? state.nav : slice.nav,
      };
    },
  },
});

export const {
  place,
  remove,
  toggleActiveTheme,
  setActiveTheme,
  moveMosaicTab,
  selectMosaicTab,
  resizeMosaicTab,
  rename,
  resizeNavdrawer,
  setNavdrawerVisible,
  maybeCreateGetStartedTab,
  setHauled,
  setWorkspace,
} = actions;

export type Action = ReturnType<(typeof actions)[keyof typeof actions]>;
export type Payload = Action["payload"];

const MOSAIC_WINDOW_TYPE = "mosaic";

export const createMosaicWindow = (): Omit<LayoutState, "windowKey"> => ({
  key: nanoid(),
  name: "Mosaic",
  type: MOSAIC_WINDOW_TYPE,
  location: "window",
  window: {
    navTop: true,
  },
});
