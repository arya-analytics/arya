// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { type ReactElement, useCallback, useMemo, useState } from "react";

import { Icon } from "@synnaxlabs/media";

import { Button } from "@/button";
import { CSS } from "@/css";
import { Haul } from "@/haul";
import { useCombinedStateAndRef } from "@/hooks/useCombinedStateAndRef";
import { type UseSelectMultipleProps } from "@/hooks/useSelectMultiple";
import { List } from "@/list";
import { CONTEXT_SELECTED, CONTEXT_TARGET } from "@/menu/ContextMenu";
import { Text } from "@/text";
import { Triggers } from "@/triggers";

import "@/tree/Tree.css";

export const HAUL_TYPE = "tree-item";

export interface Node {
  key: string;
  name: string;
  icon?: ReactElement;
  allowRename?: boolean;
  hasChildren?: boolean;
  children?: Node[];
  haulItems?: Haul.Item[];
  canDrop?: (items: Haul.Item[]) => boolean;
  href?: string;
}

export interface NodeWithDepth extends Node {
  depth: number;
}

export interface FlattenedNode extends Node {
  index: number;
  depth: number;
  expanded: boolean;
}

export interface HandleExpandProps {
  current: string[];
  action: "expand" | "contract";
  clicked: string;
}

export interface UseProps {
  onExpand?: (props: HandleExpandProps) => void;
}

export interface UseReturn {
  selected: string[];
  expanded: string[];
  onSelect: UseSelectMultipleProps<string, FlattenedNode>["onChange"];
}

export const use = (props?: UseProps): UseReturn => {
  const { onExpand } = props ?? {};
  const [expanded, setExpanded, ref] = useCombinedStateAndRef<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);

  const shiftRef = Triggers.useHeldRef({ triggers: [["Shift"]] });

  const handleSelect: UseSelectMultipleProps<string, FlattenedNode>["onChange"] =
    useCallback(
      (keys: string[], { clicked }): void => {
        setSelected(keys);
        if (clicked == null || shiftRef.current.held) return;
        const currentlyExpanded = ref.current;
        const action = currentlyExpanded.some((key) => key === clicked)
          ? "contract"
          : "expand";
        let nextExpanded = currentlyExpanded;
        if (action === "contract")
          nextExpanded = currentlyExpanded.filter((key) => key !== clicked);
        else nextExpanded = [...currentlyExpanded, clicked];
        setExpanded(nextExpanded);
        onExpand?.({ current: nextExpanded, action, clicked });
      },
      [onExpand],
    );

  return {
    onSelect: handleSelect,
    expanded,
    selected,
  };
};

export interface TreeProps
  extends Pick<ItemProps, "onDrop" | "onRename" | "onSuccessfulDrop" | "onDoubleClick">,
    Omit<
      List.VirtualCoreProps<string, FlattenedNode>,
      "onDrop" | "onSelect" | "itemHeight" | "children" | "onDoubleClick"
    > {
  nodes: Node[];
  selected?: string[];
  expanded?: string[];
  onSelect: UseSelectMultipleProps<string, FlattenedNode>["onChange"];
}

export const Tree = ({
  nodes,
  selected = [],
  expanded = [],
  onSelect,
  onDrop,
  onRename,
  onSuccessfulDrop,
  onDoubleClick,
  className,
  ...props
}: TreeProps): ReactElement => {
  const flat = useMemo(() => flatten(nodes, expanded), [nodes, expanded]);
  return (
    <List.List<string, FlattenedNode> data={flat}>
      <List.Selector
        value={selected}
        onChange={onSelect}
        allowMultiple
        replaceOnSingle
      />
      <List.Core.Virtual<string, FlattenedNode>
        itemHeight={27}
        className={CSS(className, CSS.B("tree"))}
        {...props}
      >
        {(props) => (
          <Item
            {...props}
            onDrop={onDrop}
            onRename={onRename}
            onSuccessfulDrop={onSuccessfulDrop}
            selectedItems={flat.filter((item) => selected.includes(item.key))}
            onDoubleClick={onDoubleClick}
          />
        )}
      </List.Core.Virtual>
    </List.List>
  );
};

interface ItemProps extends List.ItemProps<string, FlattenedNode> {
  onDrop?: (key: string, props: Haul.OnDropProps) => Haul.Item[];
  onSuccessfulDrop?: (key: string, props: Haul.OnSuccessfulDropProps) => void;
  onRename?: (key: string, name: string) => void;
  onDoubleClick?: (key: string, e: React.MouseEvent) => void;
  selectedItems: FlattenedNode[];
}

const expandedCaret = <Icon.Caret.Down className={CSS.B("caret")} />;
const collapsedCaret = <Icon.Caret.Right className={CSS.B("caret")} />;

const Item = ({
  entry,
  selected,
  onSelect,
  style,
  onDrop,
  onRename,
  onSuccessfulDrop,
  selectedItems,
  onDoubleClick,
}: ItemProps): ReactElement => {
  const {
    key,
    hasChildren = false,
    allowRename = false,
    children,
    icon,
    name,
    depth,
    expanded,
    href,
    haulItems = [],
  } = entry;

  const icons: ReactElement[] = [];
  if (hasChildren || (children != null && children.length > 0))
    icons.push(expanded ? expandedCaret : collapsedCaret);
  if (icon != null) icons.push(icon);

  const [draggingOver, setDraggingOver] = useState(false);

  const { startDrag, ...dropProps } = Haul.useDragAndDrop({
    type: "Tree.Item",
    key,
    canDrop: ({ items: entities, source }) => {
      const keys = entities.map((item) => item.key);
      setDraggingOver(false);
      return source.type === "Tree.Item" && !keys.includes(key);
    },
    onDrop: (props) => onDrop?.(key, props) ?? [],
    onDragOver: () => setDraggingOver(true),
  });

  const handleDragStart = (): void => {
    const selectedItemKeys = selectedItems.map(({ key }) => key);
    if (selectedItemKeys.includes(key)) {
      const selectedHaulItems = selectedItems
        .map(({ key, haulItems }) => [{ type: HAUL_TYPE, key }, ...(haulItems ?? [])])
        .flat();
      return startDrag(selectedHaulItems, (props) => onSuccessfulDrop?.(key, props));
    }
    startDrag(
      [{ type: HAUL_TYPE, key }, ...haulItems],
      (props) => onSuccessfulDrop?.(key, props),
    );
  };

  const baseProps: Button.LinkProps | Button.ButtonProps = {
    id: key,
    variant: "text",
    draggable: true,
    className: CSS(
      CONTEXT_TARGET,
      draggingOver && CSS.M("dragging-over"),
      selected && CONTEXT_SELECTED,
      CSS.selected(selected),
    ),
    onDragLeave: () => setDraggingOver(false),
    onDragStart: handleDragStart,
    onClick: () => onSelect?.(key),
    style: { ...style, paddingLeft: `${depth * 1.5 + 1}rem` },
    startIcon: icons,
    iconSpacing: "small",
    noWrap: true,
    onDoubleClick: (e) => onDoubleClick?.(key, e),
    href,
    ...dropProps,
  };

  const Base = href != null ? Button.Link : Button.Button;

  return (
    <Base {...baseProps}>
      <Text.MaybeEditable
        id={`text-${key}`}
        level="p"
        allowDoubleClick={false}
        value={name}
        onChange={
          onRename != null && allowRename ? (name) => onRename(key, name) : undefined
        }
      />
    </Base>
  );
};

export const startRenaming = (key: string): void => Text.edit(`text-${key}`);

export const shouldExpand = (node: Node, expanded: string[]): boolean =>
  expanded.includes(node.key);

export const flatten = (
  nodes: Node[],
  expanded: string[],
  depth: number = 0,
): FlattenedNode[] => {
  const flattened: FlattenedNode[] = [];
  nodes.forEach((node, index) => {
    const e = shouldExpand(node, expanded);
    flattened.push({ ...node, depth, expanded: e, index });
    if (e && node.children != null)
      flattened.push(...flatten(node.children, expanded, depth + 1));
  });
  return flattened;
};

export const moveNode = (
  tree: Node[],
  destination: string,
  ...keys: string[]
): Node[] => {
  keys.forEach((key) => {
    const node = findNode(tree, key);
    if (node == null) return;
    removeNode(tree, key);
    addNode(tree, destination, node);
  });
  return tree;
};

export const removeNode = (tree: Node[], ...keys: string[]): Node[] => {
  const treeKeys = tree.map((node) => node.key);
  keys.forEach((key) => {
    const index = treeKeys.indexOf(key);
    if (index !== -1) tree.splice(index, 1);
    else {
      const parent = findNodeParent(tree, key);
      if (parent != null)
        parent.children = parent.children?.filter((child) => child.key !== key);
    }
  });
  return tree;
};

export const addNode = (
  tree: Node[],
  destination: string,
  ...nodes: Node[]
): Node[] => {
  const node = findNode(tree, destination);
  if (node == null) throw new Error(`Could not find node with key ${destination}`);
  if (node.children == null) node.children = [];
  const keys = nodes.map((node) => node.key);
  node.children = [
    ...nodes,
    ...node.children.filter((child) => !keys.includes(child.key)),
  ];
  return tree;
};

export const updateNode = (
  tree: Node[],
  key: string,
  updater: (node: Node) => Node,
): Node[] => {
  const node = findNode(tree, key);
  if (node == null) throw new Error(`Could not find node with key ${key}`);
  const parent = findNodeParent(tree, key);
  if (parent != null) {
    // splice the updated node into the parent's children
    const index = parent.children?.findIndex((child) => child.key === key);
    if (index != null && index !== -1) parent.children?.splice(index, 1, updater(node));
  } else {
    // we're in the root, so just update the node
    tree.splice(
      tree.findIndex((node) => node.key === key),
      1,
      updater(node),
    );
  }
  return tree;
};

export const findNode = (
  tree: Node[],
  key: string,
  depth: number = 0,
): NodeWithDepth | null => {
  for (const node of tree) {
    if (node.key === key) {
      const n = node as NodeWithDepth;
      n.depth = depth;
      return n;
    }
    if (node.children != null) {
      const found = findNode(node.children, key, depth + 1);
      if (found != null) return found;
    }
  }
  return null;
};

export const findNodes = (tree: Node[], keys: string[]): NodeWithDepth[] => {
  const nodes: NodeWithDepth[] = [];
  for (const key of keys) {
    const node = findNode(tree, key);
    if (node != null) nodes.push(node);
  }
  return nodes;
};

export const findNodeParent = (tree: Node[], key: string): Node | null => {
  for (const node of tree) {
    if (node.children != null) {
      if (node.children.some((child) => child.key === key)) return node;
      const found = findNodeParent(node.children, key);
      if (found != null) return found;
    }
  }
  return null;
};
