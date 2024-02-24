// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { type ReactElement, useCallback } from "react";

import { type Key, type Keyed } from "@synnaxlabs/x";

import { createFilterTransform } from "@/hooks";
import { useDebouncedCallback } from "@/hooks/useDebouncedCallback";
import { Input } from "@/input";
import { type OptionalControl } from "@/input/types";
import { useDataUtilContext } from "@/list/Data";
import { state } from "@/state";
import { type RenderProp } from "@/util/renderProp";

export interface FilterProps extends OptionalControl<string> {
  children?: RenderProp<Input.Control<string>>;
  debounce?: number;
}

/**
 * Implements in-browser filtration for a list.
 *
 * @param props - The props for the List.Search component.
 * @param props.children - A custom input render prop for the search functionality. This
 * must implement the InputControl<string> interface.
 * @param opts - Custom options for the search functionality. See the {@link fuse.IFuseOptions}
 * interface for more details.
 */
export const Filter = <K extends Key = Key, E extends Keyed<K> = Keyed<K>>({
  children = (props) => <Input.Text {...props} />,
  debounce = 250,
  onChange,
  value,
}: FilterProps): ReactElement | null => {
  const [internalValue, setInternalValue] = state.usePurePassthrough<string>({
    onChange,
    value,
    initial: "",
  });
  const { setTransform, deleteTransform } = useDataUtilContext<K, E>();

  const debounced = useDebouncedCallback(setTransform, debounce, []);

  const handleChange = useCallback(
    (term: string) => {
      setInternalValue(term);
      if (term.length === 0) deleteTransform("filter");
      else debounced("filter", createFilterTransform({ term }));
    },
    [setInternalValue],
  );

  return children({ value: internalValue, onChange: handleChange });
};

export interface Searcher<K extends Key = Key, E extends Keyed<K> = Keyed<K>> {
  search: (term: string) => E[];
}
