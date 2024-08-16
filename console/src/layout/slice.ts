// Copyright 2024 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import {
  createSlice,
  type Dispatch,
  type PayloadAction,
  type Store,
  type UnknownAction,
} from "@reduxjs/toolkit";
import { type Synnax } from "@synnaxlabs/client";
import { MAIN_WINDOW } from "@synnaxlabs/drift";
import { Haul, Mosaic } from "@synnaxlabs/pluto";
import { type deep, id, type location } from "@synnaxlabs/x";
import { ComponentType } from "react";

import { CreateConfirmModal } from "@/confirm/Confirm";
import { type Placer } from "@/layout/hooks";
import * as latest from "@/layout/migrations";

export type State<A = any> = latest.State<A>;
export type SliceState = latest.SliceState;
export type NavDrawerLocation = latest.NavDrawerLocation;
export type NavDrawerEntryState = latest.NavDrawerEntryState;
export type WindowProps = latest.WindowProps;
export const ZERO_SLICE_STATE = latest.ZERO_SLICE_STATE;
export const ZERO_MOSAIC_STATE = latest.ZERO_MOSAIC_STATE;
export const MAIN_LAYOUT = latest.MAIN_LAYOUT;
export const migrateSlice = latest.migrateSlice;

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

export const PERSIST_EXCLUDE = ["alreadyCheckedGetStarted"].map(
  (key) => `${SLICE_NAME}.${key}`,
) as Array<deep.Key<StoreState>>;

/** Signature for the placeLayout action. */
export type PlacePayload = State;

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

interface ResizeNavDrawerPayload {
  windowKey: string;
  location: NavDrawerLocation;
  size: number;
}

interface SetAltKeyPayload {
  key: string;
  altKey: string;
}

interface SetHaulingPayload extends Haul.DraggingState {}

export interface FileHandlerProps {
  mosaicKey: number;
  file: any;
  loc: location.Location;
  name: string;
  placer: Placer;
  store: Store;
  confirm: CreateConfirmModal;
  client: Synnax | null;
  workspaceKey: string | null;
  dispatch: Dispatch<UnknownAction>;
}

export type FileHandler = (props: FileHandlerProps) => Promise<boolean>;

export interface SetNavDrawerPayload extends NavDrawerEntryState {
  location: NavDrawerLocation;
  windowKey: string;
}

export interface SetWorkspacePayload {
  keepNav?: boolean;
  slice: SliceState;
}

interface SetNavDrawerVisiblePayload {
  windowKey: string;
  key?: string;
  location?: NavDrawerLocation;
  value?: boolean;
}

interface SetArgsPayload<T = unknown> {
  key: string;
  args: T;
}

export const GET_STARTED_LAYOUT_TYPE = "getStarted";

const purgeEmptyMosaics = (state: SliceState) => {
  Object.entries(state.mosaics).forEach(([key, mosaic]) => {
    if (key === MAIN_WINDOW || !Mosaic.isEmpty(mosaic.root)) return;
    delete state.mosaics[key];
    delete state.layouts[key];
    delete state.nav[key];
  });
};

const select = (state: SliceState, key: string): State | null => {
  const layout = state.layouts[key];
  if (layout == null) {
    const altKey = state.altKeyToKey[key];
    if (altKey == null) return null;
    const altLayout = state.layouts[altKey];
    return altLayout ?? null;
  }
  return layout;
};

const layoutsToPreserve = (layouts: Record<string, State>): Record<string, State> =>
  Object.fromEntries(
    Object.entries(layouts).filter(
      ([, layout]) =>
        layout.location === "window" && layout.type !== MOSAIC_WINDOW_TYPE,
    ),
  );

export const { actions, reducer } = createSlice({
  name: SLICE_NAME,
  initialState: ZERO_SLICE_STATE,
  reducers: {
    place: (state, { payload: layout }: PayloadAction<PlacePayload>) => {
      const { location, name, tab } = layout;
      let key = layout.key;

      const prev = select(state, key);
      const mosaic = state.mosaics[layout.windowKey];
      if (prev != null) {
        key = prev.key;
        layout.key = prev.key;
      }

      if (layout.type === MOSAIC_WINDOW_TYPE) state.mosaics[key] = ZERO_MOSAIC_STATE;

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
          tab?.mosaicKey,
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
      if (layout.type !== MOSAIC_WINDOW_TYPE) purgeEmptyMosaics(state);
    },
    setHauled: (state, { payload }: PayloadAction<SetHaulingPayload>) => {
      state.hauling = payload;
    },
    remove: (state, { payload: { keys } }: PayloadAction<RemovePayload>) => {
      keys.forEach((contentKey) => {
        const layout = select(state, contentKey);
        if (layout == null) return;
        const mosaic = state.mosaics[layout.windowKey];
        if (layout == null || mosaic == null) return;
        const { location } = layout;
        if (location === "mosaic")
          [mosaic.root, mosaic.activeTab] = Mosaic.removeTab(mosaic.root, layout.key);

        delete state.layouts[layout.key];
        state.mosaics[layout.windowKey] = mosaic;
        purgeEmptyMosaics(state);
      });
    },
    setAltKey: (
      state,
      { payload: { key, altKey } }: PayloadAction<SetAltKeyPayload>,
    ) => {
      const layout = select(state, key);
      if (layout == null) return;
      state.altKeyToKey[altKey] = key;
      state.keyToAltKey[key] = altKey;
    },
    moveMosaicTab: (
      state,
      { payload: { tabKey, windowKey, key, loc } }: PayloadAction<MoveMosaicTabPayload>,
    ) => {
      const layout = select(state, tabKey);
      if (layout == null) return;
      const prevWindowKey = layout.windowKey;
      if (windowKey == null || prevWindowKey === windowKey) {
        const mosaic = state.mosaics[prevWindowKey];
        [mosaic.root] = Mosaic.moveTab(mosaic.root, layout.key, loc, key);
        state.mosaics[prevWindowKey] = mosaic;
        return;
      }
      const prevMosaic = state.mosaics[prevWindowKey];
      [prevMosaic.root] = Mosaic.removeTab(prevMosaic.root, tabKey);
      state.mosaics[prevWindowKey] = prevMosaic;
      const mosaic = state.mosaics[windowKey];
      if (mosaic.activeTab == null) mosaic.activeTab = tabKey;
      state.layouts[layout.key].windowKey = windowKey;

      const mosaicTab = {
        closable: true,
        ...layout.tab,
        name: layout.name,
        tabKey: layout.key,
      };

      mosaic.root = Mosaic.insertTab(mosaic.root, mosaicTab, loc, key);
      state.mosaics[windowKey] = mosaic;
      purgeEmptyMosaics(state);
    },
    selectMosaicTab: (
      state,
      { payload: { tabKey } }: PayloadAction<SelectMosaicTabPayload>,
    ) => {
      const layout = select(state, tabKey);
      if (layout == null) return;
      const { windowKey } = layout;
      const mosaic = state.mosaics[windowKey];
      if (mosaic.activeTab === tabKey) return;
      mosaic.root = Mosaic.selectTab(mosaic.root, layout.key);
      mosaic.activeTab = layout.key;
      state.mosaics[windowKey] = mosaic;
    },
    resizeMosaicTab: (
      state,
      { payload: { key, size, windowKey } }: PayloadAction<ResizeMosaicTabPayload>,
    ) => {
      const mosaic = state.mosaics[windowKey];
      mosaic.root = Mosaic.resizeNode(mosaic.root, key, size);
      state.mosaics[windowKey] = mosaic;
    },
    rename: (
      state,
      { payload: { key: tabKey, name } }: PayloadAction<RenamePayload>,
    ) => {
      const layout = select(state, tabKey);
      if (layout == null) return;
      const mosaic = state.mosaics[layout.windowKey];
      layout.name = name;
      mosaic.root = Mosaic.renameTab(mosaic.root, layout.key, name);
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
    setNavDrawer: (state, { payload }: PayloadAction<SetNavDrawerPayload>) => {
      const { windowKey, location, ...rest } = payload;
      if (!(windowKey in state.nav)) state.nav[windowKey] = { drawers: {} };
      state.nav[windowKey].drawers[location] = rest;
    },
    resizeNavDrawer: (
      state,
      { payload: { windowKey, location, size } }: PayloadAction<ResizeNavDrawerPayload>,
    ) => {
      const navState = state.nav[windowKey];
      if (navState?.drawers[location] == null) return;
      (navState.drawers[location] as NavDrawerEntryState).size = size;
    },
    setNavDrawerVisible: (
      state,
      {
        payload: { windowKey, key, location, value },
      }: PayloadAction<SetNavDrawerVisiblePayload>,
    ) => {
      let navState = state.nav[windowKey];
      if (navState == null) {
        navState = { drawers: {} };
        state.nav[windowKey] = navState;
      }

      if (key != null) {
        Object.values(navState.drawers).forEach((drawer) => {
          if (drawer.menuItems.includes(key))
            drawer.activeItem = (value ?? drawer.activeItem !== key) ? key : null;
        });
      } else if (location != null) {
        let drawer = navState.drawers[location];
        if (drawer == null) {
          drawer = { activeItem: null, menuItems: [] };
          navState.drawers[location] = drawer;
        }
        if (value === true && drawer.activeItem == null)
          drawer.activeItem = drawer.menuItems[0];
        else if (value === false) drawer.activeItem = null;
        else if (drawer.activeItem == null) drawer.activeItem = drawer.menuItems[0];
        else drawer.activeItem = null;
      } else {
        throw new Error("setNavDrawerVisible requires either a key or location");
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
          tabKey: GET_STARTED_LAYOUT_TYPE,
          name: "Get Started",
          editable: false,
        },
      );
      state.layouts.getStarted = {
        name: "Get Started",
        key: GET_STARTED_LAYOUT_TYPE,
        location: "mosaic",
        type: GET_STARTED_LAYOUT_TYPE,
        windowKey: MAIN_WINDOW,
      };
    },
    setWorkspace: (
      state,
      { payload: { slice, keepNav = true } }: PayloadAction<SetWorkspacePayload>,
    ) => {
      return migrateSlice({
        ...slice,
        layouts: {
          ...layoutsToPreserve(state.layouts),
          ...slice.layouts,
          main: MAIN_LAYOUT,
        },
        hauling: state.hauling,
        themes: state.themes,
        activeTheme: state.activeTheme,
        nav: keepNav ? state.nav : slice.nav,
      });
    },
    clearWorkspace: (state) => {
      return {
        ...ZERO_SLICE_STATE,
        layouts: {
          ...layoutsToPreserve(state.layouts),
          main: MAIN_LAYOUT,
        },
        hauling: state.hauling,
        themes: state.themes,
        activeTheme: state.activeTheme,
        nav: state.nav,
      };
    },
    setArgs: (state, { payload: { key, args } }: PayloadAction<SetArgsPayload>) => {
      const layout = select(state, key);
      if (layout == null) return;
      layout.args = args;
    },
  },
});

export const {
  place,
  remove,
  setAltKey,
  toggleActiveTheme,
  setActiveTheme,
  moveMosaicTab,
  selectMosaicTab,
  resizeMosaicTab,
  rename,
  setNavDrawer,
  resizeNavDrawer,
  setNavDrawerVisible,
  maybeCreateGetStartedTab,
  setHauled,
  setWorkspace,
  clearWorkspace,
} = actions;

export const setArgs = <T>(pld: SetArgsPayload<T>): PayloadAction<SetArgsPayload<T>> =>
  actions.setArgs(pld) as PayloadAction<SetArgsPayload<T>>;

export type Action = ReturnType<(typeof actions)[keyof typeof actions]>;
export type Payload = Action["payload"];

export const MOSAIC_WINDOW_TYPE = "mosaic";

export const createMosaicWindow = (window?: WindowProps): Omit<State, "windowKey"> => ({
  key: `${MOSAIC_WINDOW_TYPE}-${id.id()}`,
  name: "Mosaic",
  type: MOSAIC_WINDOW_TYPE,
  location: "window",
  window: {
    ...window,
    size: { width: 800, height: 600 },
    navTop: true,
    visible: true,
    showTitle: false,
  },
});

/**
 * The props passed to a LayoutRenderer. Note that these props are minimal and only focus
 * on providing information that either allows the renderer to perform more data selections
 * from other locations in state OR allows the renderer to perform actions that may have
 * polymorphic behavior depending the layout location (i.e. closing a layout might remove
 * it from the mosaic or close the window, depending on the location).
 *
 * The goal here is to separate the rendering logic for a particular layout from its location
 * allowing us to mix and move layouts around the UI with ease.
 */
export interface RendererProps {
  /** The unique key of the layout. */
  layoutKey: string;
  /**
   * onClose should be called when the layout is ready to be closed. This function is
   * polymorphic and may have different behavior depending on the location of the layout.
   * For example, if the layout is in a window, onClose will close the window. If the
   * layout is in the mosaic, onClose will remove the layout from the mosaic.
   */
  onClose: () => void;
}

export interface OnCloseProps {
  dispatch: Dispatch<UnknownAction>;
  layoutKey: string;
}

/**
 * A React component that renders a layout for a given type. All layouts in state are
 * rendered by a layout renderer of a specific type.
 */
export type Renderer = ComponentType<RendererProps>;
