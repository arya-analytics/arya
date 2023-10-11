// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { type ReactElement, useState } from "react";

import { ontology } from "@synnaxlabs/client";
import { Icon } from "@synnaxlabs/media";
import { type Haul, Menu, Tree, useAsyncEffect, Synnax } from "@synnaxlabs/pluto";

import { Group } from "@/group";
import { Layout } from "@/layout";
import { LinePlot } from "@/lineplot";
import { type Ontology } from "@/ontology";
import { PID } from "@/pid";
import { Range } from "@/range";

const canDrop = (): boolean => false;

const onSelect: Ontology.HandleSelect = ({ store, placeLayout, selection }): void => {
  const state = store.getState();
  const layout = Layout.selectActiveMosaicTab(state);
  if (selection.length === 0) return;

  // If no layout is selected, create a new line plot and add the selected channels
  // to it.
  if (layout == null) {
    placeLayout(
      LinePlot.create({
        channels: {
          ...LinePlot.ZERO_CHANNELS_STATE,
          y1: selection.map((s) => Number(s.id.key)),
        },
      })
    );
    return;
  }

  // Otherwise, update the layout with the selected channels.
  switch (layout.type) {
    case LinePlot.LAYOUT_TYPE:
      store.dispatch(
        LinePlot.setYChannels({
          key: layout.key,
          mode: "add",
          axisKey: "y1",
          channels: selection.map((s) => Number(s.id.key)),
        })
      );
  }
};

const haulItems = ({ name, id }: ontology.Resource): Haul.Item[] => [
  {
    type: "channel",
    key: Number(id.key),
  },
  {
    type: PID.HAUL_TYPE,
    key: "value",
    data: { telem: { channel: Number(id.key) }, label: name },
  },
];

const allowRename = (): boolean => true;

const handleSetAlias = async ({
  id,
  name,
  client,
  store,
  state: { setNodes, nodes },
}: Ontology.HandleTreeRenameProps): Promise<void> => {
  const activeRange = Range.select(store.getState());
  if (activeRange == null) return;
  const rng = await client.ranges.retrieve(activeRange.key);
  await rng.setAlias(Number(id.key), name);
  setNodes([...Tree.updateNode(nodes, id.toString(), (n) => ({ ...n, name }))]);
};

const handleRename: Ontology.HandleTreeRename = (p) => {
  void handleSetAlias(p);
};

const handleDeleteAlias = async ({
  selection: { resources },
  client,
  store,
  state: { setNodes, nodes },
}: Ontology.TreeContextMenuProps): Promise<void> => {
  const activeRange = Range.select(store.getState());
  if (activeRange == null) return;
  const rng = await client.ranges.retrieve(activeRange.key);
  await rng.deleteAlias(...resources.map((r) => Number(r.id.key)));
  let next: Tree.Node[] = nodes;
  resources.forEach((r) => {
    next = Tree.updateNode(next, r.id.toString(), (n) => ({
      ...n,
      name: r.name,
    }));
  });
  setNodes([...next]);
};

const TreeContextMenu: Ontology.TreeContextMenu = (props) => {
  const { store, selection } = props;
  const activeRange = Range.select(store.getState());
  const { nodes } = selection;

  const handleSelect = (itemKey: string): void => {
    switch (itemKey) {
      case "alias":
        Tree.startRenaming(nodes[0].key);
        break;
      case "deleteAlias":
        void handleDeleteAlias(props);
        break;
      case "group":
        void Group.fromSelection(props);
        break;
    }
  };

  const singleResource = selection.resources.length === 1;

  return (
    <Menu.Menu level="small" iconSpacing="small" onChange={handleSelect}>
      <Group.GroupMenuItem selection={selection} />
      {activeRange != null && (
        <>
          {singleResource && (
            <Menu.Item itemKey="alias" startIcon={<Icon.Rename />}>
              Set Alias Under {activeRange.name}
            </Menu.Item>
          )}
          <Menu.Item itemKey="deleteAlias" startIcon={<Icon.Delete />}>
            Clear Alias Under {activeRange.name}
          </Menu.Item>
          <Menu.Item itemKey="plot" startIcon={<Icon.Visualize />}>
            Plot for {activeRange.name}
          </Menu.Item>
        </>
      )}
    </Menu.Menu>
  );
};

export const Item: Tree.Item = (props): ReactElement => {
  const [entry, setEntry] = useState(props.entry);
  const range = Range.useSelect();
  const client = Synnax.use();

  useAsyncEffect(async () => {
    if (range == null || !range.persisted || client == null) return;
    const rng = await client.ranges.retrieve(range.key);
    const alias = await rng.listAliases();
    const key = Number(new ontology.ID(props.entry.key).key);
    setEntry({ ...entry, name: alias[key] ?? props.entry.name });
  }, [range, client, props.entry.key, props.entry.name]);

  return <Tree.DefaultItem {...props} entry={entry} />;
};

export const ONTOLOGY_SERVICE: Ontology.Service = {
  type: "channel",
  icon: <Icon.Channel />,
  hasChildren: false,
  allowRename,
  onRename: handleRename,
  canDrop,
  onSelect,
  haulItems,
  Item,
  TreeContextMenu,
};
