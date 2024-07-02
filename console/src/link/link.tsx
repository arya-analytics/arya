// Copyright 2024 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { Dispatch, UnknownAction } from "@reduxjs/toolkit";
import { Synnax } from "@synnaxlabs/client";
import { Drift } from "@synnaxlabs/drift";
import { useSelectWindowKey } from "@synnaxlabs/drift/react";
import { Icon } from "@synnaxlabs/media";
import {
  Menu,
  Status,
  Synnax as PSynnax,
  useAsyncEffect,
  useSyncedRef,
} from "@synnaxlabs/pluto";
import { onOpenUrl } from "@tauri-apps/plugin-deep-link";
import { nanoid } from "nanoid";
import { ReactElement } from "react";
import { useDispatch, useStore } from "react-redux";

import { Cluster } from "@/cluster";
import { Layout } from "@/layout";

export interface HandlerProps {
  resource: string;
  resourceKey: string;
  client: Synnax;
  dispatch: Dispatch<UnknownAction>;
  placer: Layout.Placer;
  addStatus: (status: Status.CrudeSpec) => void;
  windowKey: string;
}

export type Handler = (props: HandlerProps) => Promise<boolean>;

export interface UseDeepLinkProps {
  handlers: Handler[];
}

export const useDeep = ({ handlers }: UseDeepLinkProps): void => {
  const client = PSynnax.use();
  const clientRef = useSyncedRef(client);
  const addStatus = Status.useAggregator();
  const dispatch = useDispatch();
  const placer = Layout.usePlacer();
  const store = useStore();
  const windowKey = useSelectWindowKey() as string;
  const openUrlErrorMessage =
    "Cannot open URL, URLs must be of the form synnax://cluster/<cluster-key> or synnax://cluster/<cluster-key>/<resource>/<resource-key>";
  const addOpenUrlErrorStatus = () => {
    addStatus({
      variant: "error",
      key: "openUrlError",
      message: openUrlErrorMessage,
    });
  };

  useAsyncEffect(async () => {
    const unlisten = await onOpenUrl(async (urls) => {
      dispatch(Drift.focusWindow({}));

      // Processing URL, making sure is has valid form
      const scheme = "synnax://";
      if (urls.length === 0 || !urls[0].startsWith(scheme)) {
        addOpenUrlErrorStatus();
        return;
      }
      const urlParts = urls[0].slice(scheme.length).split("/");
      if (urlParts.length !== 2 && urlParts.length !== 4) {
        addOpenUrlErrorStatus();
        return;
      }
      if (urlParts[0] !== "cluster") {
        addOpenUrlErrorStatus();
        return;
      }

      // Connecting to the cluster
      const clusterKey = urlParts[1];
      const connParams = Cluster.select(
        store.getState() as Cluster.StoreState,
        clusterKey,
      )?.props;
      const addClusterErrorStatus = () => {
        addStatus({
          variant: "error",
          key: "openUrlError-${clusterKey}",
          message: `Cannot open URL, Cluster with key ${clusterKey} not found`,
        });
      };
      if (connParams == null) {
        addClusterErrorStatus();
        return;
      }
      dispatch(Cluster.setActive(clusterKey));
      clientRef.current = new Synnax(connParams);
      if (clientRef.current == null) {
        addClusterErrorStatus();
        return;
      }
      if (urlParts.length === 2) return;

      // Processing the resource part of URL
      const resource = urlParts[2];
      const resourceKey = urlParts[3];
      for (const h of handlers)
        if (
          await h({
            resource,
            resourceKey,
            client: clientRef.current,
            dispatch,
            placer,
            addStatus,
            windowKey,
          })
        )
          return;
      addStatus({
        variant: "error",
        key: "openUrlError-ResourceNotFound-",
        message: `Cannot open link, ${resource} is unknown`,
      });
    });
    return () => unlisten();
  }, []);
};

export const CopyMenuItem = (): ReactElement => (
  <Menu.Item itemKey="link" size="small" startIcon={<Icon.Link />}>
    Copy link
  </Menu.Item>
);

export interface CopyLinkToClipboardProps {
  resource?: {
    type: string;
    key: string;
  };
  clusterKey: string;
  addStatus: (status: Status.CrudeSpec) => void;
  name: string;
}

export const CopyLinkToClipboard = (props: CopyLinkToClipboardProps): void => {
  let url = `synnax://cluster/${props.clusterKey}`;
  if (props.resource != null) url += `/${props.resource.type}/${props.resource.key}`;
  void navigator.clipboard.writeText(url);
  props.addStatus({
    variant: "info",
    key: nanoid(),
    message: `Link to ${props.name} copied to clipboard`,
  });
};
