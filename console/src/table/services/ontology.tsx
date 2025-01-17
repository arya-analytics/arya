// Copyright 2024 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { ontology, type Synnax } from "@synnaxlabs/client";
import { Icon } from "@synnaxlabs/media";
import { Menu as PMenu, Mosaic, Tree } from "@synnaxlabs/pluto";
import { errors } from "@synnaxlabs/x";
import { useMutation } from "@tanstack/react-query";

import { Menu } from "@/components/menu";
import { Export } from "@/export";
import { Group } from "@/group";
import { useAsyncActionMenu } from "@/hooks/useAsyncAction";
import { Layout } from "@/layout";
import { Link } from "@/link";
import { type Ontology } from "@/ontology";
import { useConfirmDelete } from "@/ontology/hooks";
import { Table } from "@/table";

const useDelete = (): ((props: Ontology.TreeContextMenuProps) => void) => {
  const confirm = useConfirmDelete({ type: "Table" });
  return useMutation<void, Error, Ontology.TreeContextMenuProps, Tree.Node[]>({
    onMutate: async ({ selection, removeLayout, state: { nodes, setNodes } }) => {
      if (!(await confirm(selection.resources))) throw errors.CANCELED;
      const ids = selection.resources.map((res) => new ontology.ID(res.key));
      const keys = ids.map((id) => id.key);
      removeLayout(...keys);
      const prevNodes = Tree.deepCopy(nodes);
      const next = Tree.removeNode({
        tree: nodes,
        keys: ids.map((id) => id.toString()),
      });
      setNodes([...next]);
      return prevNodes;
    },
    mutationFn: async ({ client, selection }) => {
      const ids = selection.resources.map((res) => new ontology.ID(res.key));
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await client.workspaces.table.delete(ids.map((id) => id.key));
    },
    onError: (e, { state: { setNodes }, handleException }, prevNodes) => {
      if (prevNodes != null) setNodes(prevNodes);
      if (errors.CANCELED.matches(e)) return;
      handleException(e, "Failed to delete table");
    },
  }).mutate;
};

const TreeContextMenu: Ontology.TreeContextMenu = (props) => {
  const {
    selection,
    selection: { resources },
  } = props;
  const del = useDelete();
  const handleLink = Link.useCopyToClipboard();
  const handleExport = Table.useExport();
  const group = Group.useCreateFromSelection();
  const onSelect = useAsyncActionMenu({
    delete: () => del(props),
    rename: () => Tree.startRenaming(resources[0].key),
    link: () =>
      handleLink({ name: resources[0].name, ontologyID: resources[0].id.payload }),
    export: () => handleExport(resources[0].id.key),
    group: () => group(props),
  });
  const isSingle = resources.length === 1;
  return (
    <PMenu.Menu onChange={onSelect} level="small" iconSpacing="small">
      <Menu.RenameItem />
      <Menu.DeleteItem />
      <Group.GroupMenuItem selection={selection} />
      <PMenu.Divider />
      {isSingle && (
        <>
          <Export.MenuItem />
          <Link.CopyMenuItem />
          <PMenu.Divider />
        </>
      )}
      <Menu.HardReloadItem />
    </PMenu.Menu>
  );
};

const handleRename: Ontology.HandleTreeRename = {
  eager: ({ id: { key }, name, store }) => store.dispatch(Layout.rename({ key, name })),
  execute: async ({ client, id, name }) =>
    await client.workspaces.table.rename(id.key, name),
  rollback: ({ id: { key }, name, store }) =>
    store.dispatch(Layout.rename({ key, name })),
};

const loadTable = async (
  client: Synnax,
  id: ontology.ID,
  placeLayout: Layout.Placer,
) => {
  const table = await client.workspaces.table.retrieve(id.key);
  placeLayout(Table.create({ ...table.data, key: table.key, name: table.name }));
};

const handleSelect: Ontology.HandleSelect = async ({
  client,
  selection,
  placeLayout,
}) => await loadTable(client, selection[0].id, placeLayout);

const handleMosaicDrop: Ontology.HandleMosaicDrop = ({
  client,
  id,
  location,
  nodeKey,
  placeLayout,
  handleException,
}) => {
  void (async () => {
    try {
      const table = await client.workspaces.table.retrieve(id.key);
      placeLayout(
        Table.create({
          name: table.name,
          ...table.data,
          key: id.key,
          location: "mosaic",
          tab: { mosaicKey: nodeKey, location },
        }),
      );
    } catch (e) {
      handleException(e, "Failed to load table");
    }
  })();
};

export const ONTOLOGY_SERVICE: Ontology.Service = {
  type: "table",
  icon: <Icon.Table />,
  hasChildren: false,
  haulItems: (r) => [{ type: Mosaic.HAUL_CREATE_TYPE, key: r.id.toString() }],
  allowRename: () => true,
  onRename: handleRename,
  canDrop: () => false,
  TreeContextMenu,
  onMosaicDrop: handleMosaicDrop,
  onSelect: handleSelect,
};
