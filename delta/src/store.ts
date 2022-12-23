import { combineReducers } from "@reduxjs/toolkit";
import type { CurriedGetDefaultMiddleware } from "@reduxjs/toolkit/dist/getDefaultMiddleware";
import {
  reducer as driftReducer,
  TauriRuntime,
  configureStore,
  DRIFT_SLICE_NAME,
} from "@synnaxlabs/drift";
import { JSONEncoderDecoder } from "@synnaxlabs/freighter";
import { appWindow } from "@tauri-apps/api/window";

import { clusterReducer, CLUSTER_SLICE_NAME } from "@/features/cluster";
import { layoutReducer, LAYOUT_SLICE_NAME } from "@/features/layout";
import {
  TauriKV,
  newPreloadState,
  newPersistStateMiddleware,
} from "@/features/persist";
import {
  VISUALIZATION_SLICE_NAME,
  visualizationReducer,
} from "@/features/visualization";
import { workspaceReducer } from "@/features/workspace";

const kv = new TauriKV(new JSONEncoderDecoder());

const reducer = combineReducers({
  [DRIFT_SLICE_NAME]: driftReducer,
  [CLUSTER_SLICE_NAME]: clusterReducer,
  [LAYOUT_SLICE_NAME]: layoutReducer,
  [VISUALIZATION_SLICE_NAME]: visualizationReducer,
  workspace: workspaceReducer,
});

export const store = configureStore<ReturnType<typeof reducer>>({
  runtime: new TauriRuntime(appWindow),
  preloadedState: newPreloadState(kv),
  middleware: (
    getDefaultMiddleware: CurriedGetDefaultMiddleware<ReturnType<typeof reducer>>
  ) => [...getDefaultMiddleware(), newPersistStateMiddleware(kv)],
  reducer,
});
