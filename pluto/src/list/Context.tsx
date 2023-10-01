// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import {
  type PropsWithChildren,
  useContext as reactUseContext,
  createContext,
  type ReactElement,
} from "react";

import { type Key, type KeyedRenderableRecord } from "@synnaxlabs/x";

import { type UseTransformsReturn } from "@/hooks/useTransforms";
import { type ColumnSpec } from "@/list/types";
import { type state } from "@/state";

export interface ContextProps<
  K extends Key = Key,
  E extends KeyedRenderableRecord<K, E> = KeyedRenderableRecord<K>,
> extends Omit<UseTransformsReturn<E>, "transform"> {
  columnar: {
    columns: Array<ColumnSpec<K, E>>;
    setColumns: (
      cbk: (columns: Array<ColumnSpec<K, E>>) => Array<ColumnSpec<K, E>>,
    ) => void;
  };
  data: E[];
  sourceData: E[];
  setSourceData: state.Set<E[]>;
  select: {
    value: K[];
    onChange: (value: K[]) => void;
    onSelect?: (key: K) => void;
    clear?: () => void;
    setOnSelect: (cbk: (key: K) => void) => void;
    setClear: (cbk: () => void) => void;
  };
  hover: {
    value: number;
    onChange: state.Set<number>;
  };
  infinite: {
    hasMore: boolean;
    setHasMore: state.Set<boolean>;
    onFetchMore?: () => void;
    setOnFetchMore: (cbk: () => void) => void;
  };
  emptyContent?: ReactElement;
  setEmptyContent: (content: ReactElement) => void;
}

export const Context = createContext<ContextProps>({
  columnar: {
    columns: [],
    setColumns: () => undefined,
  },
  sourceData: [],
  data: [],
  setTransform: () => undefined,
  deleteTransform: () => undefined,
  setSourceData: () => undefined,
  select: {
    value: [],
    onChange: () => undefined,
    onSelect: undefined,
    setOnSelect: () => undefined,
    clear: undefined,
    setClear: () => undefined,
  },
  infinite: {
    hasMore: false,
    setHasMore: () => undefined,
    onFetchMore: undefined,
    setOnFetchMore: () => undefined,
  },
  hover: {
    value: -1,
    onChange: () => undefined,
  },
  emptyContent: undefined,
  setEmptyContent: () => undefined,
});

/**
 * A hook to access the context information for a list. This hook should only be used
 * when you know what you are doing, and are looking to extend the functionality of a
 * list component.
 */
export const useContext = <
  K extends Key = Key,
  E extends KeyedRenderableRecord<K, E> = KeyedRenderableRecord<K>,
>(): ContextProps<K, E> => {
  return reactUseContext(Context) as unknown as ContextProps<K, E>;
};

export interface ProviderProps<
  K extends Key = Key,
  E extends KeyedRenderableRecord<K, E> = KeyedRenderableRecord<K>,
> extends PropsWithChildren<unknown> {
  value: ContextProps<K, E>;
}

export const Provider = <
  K extends Key = Key,
  E extends KeyedRenderableRecord<K, E> = KeyedRenderableRecord<K>,
>({
  value,
  children,
}: ProviderProps<K, E>): ReactElement => {
  return (
    <Context.Provider value={value as unknown as ContextProps}>
      {children}
    </Context.Provider>
  );
};
