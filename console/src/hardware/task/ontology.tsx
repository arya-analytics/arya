// Copyright 2024 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { Icon } from "@synnaxlabs/media";
import { Menu as PMenu, Tree } from "@synnaxlabs/pluto";
import { useMutation } from "@tanstack/react-query";

import { Cluster } from "@/cluster";
import { Menu } from "@/components/menu";
import { Group } from "@/group";
import { NI } from "@/hardware/ni";
import { OPC } from "@/hardware/opc";
import { Layout } from "@/layout";
import { Link } from "@/link";
import { Ontology } from "@/ontology";

const ZERO_LAYOUT_STATES: Record<string, Layout.State> = {
  [OPC.Task.configureReadLayout.type]: OPC.Task.configureReadLayout,
  [NI.Task.configureAnalogReadLayout.type]: NI.Task.configureAnalogReadLayout,
  [NI.Task.configureDigitalWriteLayout.type]: NI.Task.configureDigitalWriteLayout,
  [NI.Task.configureDigitalReadLayout.type]: NI.Task.configureDigitalReadLayout,
};

const handleSelect: Ontology.HandleSelect = ({
  selection,
  placeLayout,
  client,
  addStatus,
}) => {
  if (selection.length === 0) return;
  const task = selection[0].id;
  void (async () => {
    try {
      const t = await client.hardware.tasks.retrieve(task.key);
      const baseLayout = ZERO_LAYOUT_STATES[t.type];
      placeLayout({ ...baseLayout, key: selection[0].id.key });
    } catch (e) {
      addStatus({ variant: "error", message: (e as Error).message });
    }
  })();
};

const useDelete = (): ((props: Ontology.TreeContextMenuProps) => void) =>
  useMutation({
    onMutate: ({ state: { nodes, setNodes }, selection: { resources } }) => {
      const prevNodes = Tree.deepCopy(nodes);
      setNodes([
        ...Tree.removeNode({
          tree: nodes,
          keys: resources.map(({ id }) => id.toString()),
        }),
      ]);
      return prevNodes;
    },
    mutationFn: (props: Ontology.TreeContextMenuProps) => {
      const {
        client,
        selection: { resources },
      } = props;
      return client.hardware.tasks.delete(resources.map(({ id }) => BigInt(id.key)));
    },
    onError: (e: Error, { addStatus, selection: { resources } }) => {
      let message = "Failed to delete tasks";
      if (resources.length === 1)
        message = `Failed to delete task ${resources[0].name}`;
      addStatus({
        variant: "error",
        key: "deleteTaskError",
        message,
        description: e.message,
      });
    },
  }).mutate;

const TreeContextMenu: Ontology.TreeContextMenu = (props) => {
  const { store, selection, client, addStatus } = props;
  const { resources, nodes } = selection;
  const clusterKey = Cluster.useSelectActiveKey();
  const del = useDelete();
  const onSelect = {
    delete: () => del(props),
    edit: () =>
      handleSelect({
        selection: resources,
        placeLayout: props.placeLayout,
        client,
        addStatus,
        store,
        removeLayout: props.removeLayout,
        services: props.services,
      }),
    rename: () => Tree.startRenaming(nodes[0].key),
    link: () => {
      const url = `synnax://cluster/${clusterKey}/task/${selection.resources[0].id.key}`;
      void navigator.clipboard.writeText(url);
    },
  };
  const singleResource = resources.length === 1;
  return (
    <PMenu.Menu level="small" iconSpacing="small" onChange={onSelect}>
      <Group.GroupMenuItem selection={selection} />
      {singleResource && (
        <>
          <Ontology.RenameMenuItem />
          <Link.CopyMenuItem />
          <PMenu.Divider />
        </>
      )}
      <PMenu.Item itemKey="delete" startIcon={<Icon.Delete />}>
        Delete
      </PMenu.Item>
      <PMenu.Divider />
      <Menu.HardReloadItem />
    </PMenu.Menu>
  );
};

const handleRename: Ontology.HandleTreeRename = {
  execute: async ({ client, id, name }) => {
    const task = await client.hardware.tasks.retrieve(id.key);
    await client.hardware.tasks.create({ ...task, name });
  },
};

export const ONTOLOGY_SERVICE: Ontology.Service = {
  type: "task",
  hasChildren: false,
  icon: <Icon.Task />,
  canDrop: () => false,
  onSelect: handleSelect,
  TreeContextMenu,
  haulItems: () => [],
  allowRename: () => true,
  onRename: handleRename,
};
