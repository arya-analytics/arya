// Copyright 2024 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { user } from "@synnaxlabs/client";
import { Icon } from "@synnaxlabs/media";
import { Menu as PMenu, Tree } from "@synnaxlabs/pluto";
import { type ReactElement } from "react";

import { Menu } from "@/components/menu";
import { Ontology } from "@/ontology";
import { Permissions } from "@/permissions";
import { useSelectHasPermission } from "@/user/selectors";

const useSetPermissions =
  (): ((props: Ontology.TreeContextMenuProps) => void) =>
  ({ placeLayout, selection }) =>
    placeLayout(
      Permissions.setLayout({ user: selection.resources[0].data as user.User }),
    );

const TreeContextMenu: Ontology.TreeContextMenu = (props): ReactElement => {
  const {
    client,
    selection: { nodes, resources },
  } = props;
  const setPermissions = useSetPermissions();
  const handleSelect = {
    permissions: () => setPermissions(props),
    rename: () => Tree.startRenaming(nodes[0].key),
  };
  const singleResource = resources.length === 1;
  const isNotCurrentUser = resources[0].name !== client.props.username;
  const canSetPermissions = Permissions.useSelectCanEditPolicies();
  const canEdit = useSelectHasPermission();

  return (
    <PMenu.Menu onChange={handleSelect} level="small" iconSpacing="small">
      {singleResource && isNotCurrentUser && (
        <>
          {canSetPermissions && (
            <PMenu.Item itemKey="permissions" startIcon={<Icon.Access />}>
              Set Permissions
            </PMenu.Item>
          )}
          {canEdit && (
            <PMenu.Item itemKey="rename" startIcon={<Icon.Rename />}>
              Change Username
            </PMenu.Item>
          )}
          <PMenu.Divider />
        </>
      )}
      <Menu.HardReloadItem />
    </PMenu.Menu>
  );
};

const handleRename: Ontology.HandleTreeRename = {
  execute: async ({ client, id, name }) =>
    await client.user.changeUsername(id.key, name),
};

const allowRename: Ontology.AllowRename = (props): boolean => {
  console.log("allowRename");
  console.log(props);
  return true;
};

export const ONTOLOGY_SERVICE: Ontology.Service = {
  type: user.ONTOLOGY_TYPE,
  icon: <Icon.User />,
  hasChildren: true,
  allowRename,
  onRename: handleRename,
  haulItems: () => [],
  canDrop: () => false,
  onSelect: () => {},
  TreeContextMenu,
};
