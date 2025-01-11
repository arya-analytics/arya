// Copyright 2024 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in
// the file licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business
// Source License, use of this software will be governed by the Apache License,
// Version 2.0, included in the file licenses/APL.txt.

import { type Store } from "@reduxjs/toolkit";
import { type Synnax } from "@synnaxlabs/client";
import { Status, Synnax as PSynnax } from "@synnaxlabs/pluto";
import { sep } from "@tauri-apps/api/path";
import { open } from "@tauri-apps/plugin-dialog";
import { readTextFile } from "@tauri-apps/plugin-fs";
import { useStore } from "react-redux";

import { type FileIngestor } from "@/import/ingestor";
import { Layout } from "@/layout";
import { type RootState } from "@/store";
import { Workspace } from "@/workspace";

interface ImportArgs {
  addStatus: Status.AddStatusFn;
  client: Synnax | null;
  placeLayout: Layout.Placer;
  store: Store;
  workspaceKey?: string;
}

type Importer = (args: ImportArgs) => Promise<void>;

type ImporterCreator = (ingest: FileIngestor, type?: string) => Importer;

const FILTERS = [{ name: "JSON", extensions: ["json"] }];

export const createImporter: ImporterCreator =
  (ingest, type = "visualization") =>
  async ({ store, client, placeLayout, addStatus, workspaceKey }) => {
    const paths = await open({
      title: `Import ${type}`,
      filters: FILTERS,
      multiple: true,
      directory: false,
    });
    if (paths == null) return;
    const storeState = store.getState();
    const activeWorkspaceKey = Workspace.selectActiveKey(storeState);
    if (workspaceKey != null && activeWorkspaceKey !== workspaceKey) {
      let ws = Workspace.select(storeState, workspaceKey);
      if (ws == null) {
        if (client == null) throw new Error("Cannot reach cluster");
        ws = await client.workspaces.retrieve(workspaceKey);
      }
      store.dispatch(Workspace.add(ws));
      store.dispatch(
        Layout.setWorkspace({
          slice: ws.layout as unknown as Layout.SliceState,
          keepNav: false,
        }),
      );
    }
    await Promise.allSettled(
      paths.map(async (path) => {
        try {
          const data = await readTextFile(path);
          const name = path.split(sep()).pop();
          if (name == null) throw new Error(`Cannot read file located at ${path}`);
          ingest(data, { layout: { name }, placeLayout, store });
        } catch (e) {
          if (!(e instanceof Error)) throw e;
          addStatus({
            message: `Failed to import ${type} at ${path}`,
            description: e.message,
            variant: "error",
          });
        }
      }),
    );
  };

export const useImport = (
  import_: Importer,
  workspaceKey?: string,
): (() => Promise<void>) => {
  const placeLayout = Layout.usePlacer();
  const store = useStore<RootState>();
  const client = PSynnax.use();
  const addStatus = Status.useAggregator();
  return () => import_({ store, placeLayout, client, addStatus, workspaceKey });
};
