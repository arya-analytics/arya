// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { type Store } from "@reduxjs/toolkit";
import { type ontology, type Synnax, type ranger } from "@synnaxlabs/client";
import { Icon } from "@synnaxlabs/media";
import { Menu, type Haul } from "@synnaxlabs/pluto";
import { Tree } from "@synnaxlabs/pluto/tree";
import { toArray } from "@synnaxlabs/x";

import { Group } from "@/group";
import { Layout } from "@/layout";
import { LinePlot } from "@/lineplot";
import { setRanges } from "@/lineplot/slice";
import { Ontology } from "@/ontology";
import { editLayout } from "@/range/EditLayout";
import { type Range } from "@/range/range";
import { select } from "@/range/selectors";
import { type StoreState, add, remove, setActive } from "@/range/slice";

const fromClientRange = (ranges: ranger.Range | ranger.Range[]): Range[] =>
  toArray(ranges).map((range) => ({
    variant: "static",
    key: range.key,
    name: range.name,
    timeRange: {
      start: Number(range.timeRange.start.valueOf()),
      end: Number(range.timeRange.end.valueOf()),
    },
    persisted: true,
  }));

const handleSelect: Ontology.HandleSelect = ({ selection, client, store }) => {
  void (async () => {
    const ranges = await client.ranges.retrieve(selection.map((s) => s.id.key));
    store.dispatch(add({ ranges: fromClientRange(ranges) }));
  })();
};

const handleDelete = async ({
  client,
  store,
  selection: { resources },
}: Ontology.TreeContextMenuProps): Promise<void> => {
  const keys = resources.map((r) => r.id.key);
  await client.ranges.delete(keys);
  store.dispatch(remove({ keys }));
};

const handleRename: Ontology.HandleTreeRename = ({
  id,
  name,
  client,
  state,
  store,
}) => {
  if (name.length === 0) return;
  void (async () => {
    if (client == null || id.type !== "range") return;
    await client.ranges.rename(id.key, name);
    const next = Tree.updateNode({
      tree: state.nodes,
      key: id.toString(),
      updater: (node) => ({
        ...node,
        name,
      }),
    });
    state.setNodes([...next]);
    const existing = select(store.getState(), id.key);
    if (existing == null) return;
    const range = await client.ranges.retrieve(id.key);
    store.dispatch(add({ ranges: fromClientRange(range) }));
  })();
};

const fetchIfNotInState = async (
  store: Store<StoreState>,
  client: Synnax,
  key: string,
): Promise<void> => {
  const existing = select(store.getState(), key);
  if (existing == null) {
    const range = await client.ranges.retrieve(key);
    store.dispatch(add({ ranges: fromClientRange(range) }));
  }
};

const handleActivate = async ({
  client,
  store,
  selection: { resources },
}: Ontology.TreeContextMenuProps): Promise<void> => {
  const res = resources[0];
  await fetchIfNotInState(store, client, res.id.key);
  store.dispatch(setActive(res.id.key));
};

const handleAddToActivePlot = async ({
  client,
  selection: { resources },
  store,
}: Ontology.TreeContextMenuProps): Promise<void> => {
  const active = Layout.selectActiveMosaicTab(store.getState());
  if (active == null) return;
  const res = resources[0];
  await fetchIfNotInState(store, client, res.id.key);
  store.dispatch(
    setRanges({
      key: active.key,
      axisKey: "x1",
      mode: "add",
      ranges: [res.id.key],
    }),
  );
};

const handleAddToNewPlot = async ({
  client,
  placeLayout,
  selection: { resources },
  store,
}: Ontology.TreeContextMenuProps): Promise<void> => {
  const res = resources[0];
  await fetchIfNotInState(store, client, res.id.key);
  placeLayout(
    LinePlot.create({
      name: `Plot for ${res.name}`,
      ranges: {
        x1: [res.id.key],
        x2: [],
      },
    }),
  );
};

const handleEdit = ({
  selection: { resources },
  placeLayout,
}: Ontology.TreeContextMenuProps): void => {
  placeLayout({ ...editLayout("Edit Range"), key: resources[0].id.key });
};

const TreeContextMenu: Ontology.TreeContextMenu = (props) => {
  const { selection, store } = props;
  const state = store.getState();
  const activeRange = select(state);
  const layout = Layout.selectActiveMosaicTab(state);
  const { resources, nodes } = selection;

  const handleSelect = (itemKey: string): void => {
    switch (itemKey) {
      case "delete":
        void handleDelete(props);
        return;
      case "rename":
        Tree.startRenaming(nodes[0].key);
        return;
      case "activate":
        void handleActivate(props);
        return;
      case "addToActivePlot":
        void handleAddToActivePlot(props);
        return;
      case "addToNewPlot":
        void handleAddToNewPlot(props);
        return;
      case "edit":
        handleEdit(props);
        return;
      case "group":
        void Group.fromSelection(props);
    }
  };

  return (
    <Menu.Menu onChange={handleSelect} level="small" iconSpacing="small">
      <Group.GroupMenuItem selection={selection} />
      {resources.length === 1 && (
        <>
          {resources[0].id.key !== activeRange?.key && (
            <Menu.Item itemKey="activate">Set as Active Range</Menu.Item>
          )}
          <Ontology.RenameMenuItem />
          <Menu.Item itemKey="edit" startIcon={<Icon.Edit />}>
            Edit
          </Menu.Item>
        </>
      )}
      {layout?.type === "lineplot" && (
        <Menu.Item itemKey="addToActivePlot" startIcon={<Icon.Visualize />}>
          Add to {layout.name}
        </Menu.Item>
      )}
      <Menu.Item
        itemKey="addToNewPlot"
        startIcon={[<Icon.Add key="add" />, <Icon.Visualize key="plot" />]}
      >
        Add to New Plot
      </Menu.Item>
      <Menu.Item itemKey="delete" startIcon={<Icon.Delete />}>
        Delete
      </Menu.Item>
    </Menu.Menu>
  );
};

const haulItems = ({ id }: ontology.Resource): Haul.Item[] => [
  {
    type: "range",
    key: id.key,
  },
];

export const ONTOLOGY_SERVICE: Ontology.Service = {
  type: "range",
  hasChildren: true,
  icon: <Icon.Range />,
  canDrop: () => true,
  onSelect: handleSelect,
  TreeContextMenu,
  haulItems,
  allowRename: () => true,
  onRename: handleRename,
};
