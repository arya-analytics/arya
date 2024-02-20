// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import {
  type FocusEventHandler,
  type ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  type AsyncTermSearcher,
  type Key,
  type KeyedRenderableRecord,
  primitiveIsZero,
} from "@synnaxlabs/x";

import { CSS } from "@/css";
import { Dropdown } from "@/dropdown";
import { useAsyncEffect } from "@/hooks";
import {
  selectValueIsZero,
  type UseSelectSingleProps,
  type UseSelectOnChangeExtra,
} from "@/list/useSelect";
import { Input } from "@/input";
import { List as CoreList } from "@/list";
import { ClearButton } from "@/select/ClearButton";
import { Core } from "@/select/List";

import "@/select/Single.css";

export interface SingleProps<K extends Key, E extends KeyedRenderableRecord<K, E>>
  extends Omit<Dropdown.DialogProps, "onChange" | "visible" | "children" | "variant">,
    Omit<UseSelectSingleProps<K, E>, "data" | "allowMultiple">,
    Omit<CoreList.ListProps<K, E>, "children">,
    Pick<Input.TextProps, "variant" | "disabled"> {
  tagKey?: keyof E | ((e: E) => string | number);
  columns?: Array<CoreList.ColumnSpec<K, E>>;
  inputProps?: Omit<Input.TextProps, "onChange">;
  searcher?: AsyncTermSearcher<string, K, E>;
  hideColumnHeader?: boolean;
}

/**
 * Allows a user to browse, search for, and select a value from a list of options.
 * It's important to note that Select maintains no internal selection state. The caller
 * must provide the selected value via the `value` prop and handle any changes via the
 * `onChange` prop.
 *
 * @param props - The props for the component. Any additional props will be passed to the
 * underlying input element.
 * @param props.data - The data to be used to populate the select options.
 * @param props.columns - The columns to be used to render the select options in the
 * dropdown. See the {@link ListColumn} type for more details on available options.
 * @param props.tagKey - The option field rendered when selected. Defaults to "key".
 * @param props.location - Whether to render the dropdown above or below the select
 * component. Defaults to "below".
 * @param props.onChange - The callback to be invoked when the selected value changes.
 * @param props.value - The currently selected value.
 */
export const Single = <
  K extends Key = Key,
  E extends KeyedRenderableRecord<K, E> = KeyedRenderableRecord<K>,
>({
  onChange,
  value,
  tagKey = "key",
  columns = [],
  data,
  emptyContent,
  inputProps,
  allowNone,
  searcher,
  className,
  variant,
  hideColumnHeader = false,
  disabled,
  ...props
}: SingleProps<K, E>): ReactElement => {
  const { visible, open, close } = Dropdown.use();
  const [selected, setSelected] = useState<E | null>(null);
  const searchMode = searcher != null;

  // This hook runs to make sure we have the selected entry populated when the value
  // changes externally.
  useAsyncEffect(async () => {
    if (selected?.key === value) return;
    if (selectValueIsZero(value)) return setSelected(null);
    let nextSelected: E | null = null;
    if (searchMode) {
      const [e] = await searcher.retrieve([value]);
      nextSelected = e ?? null;
    } else if (data != null) nextSelected = data.find((e) => e.key === value) ?? null;
    setSelected(nextSelected);
  }, [searcher, value]);

  const handleChange = useCallback<UseSelectSingleProps<K, E>["onChange"]>(
    (v: K, e: UseSelectOnChangeExtra<K, E>): void => {
      setSelected(v == null ? null : e.entries[0]);
      close();
      onChange(v, e);
    },
    [onChange, allowNone],
  );

  const InputWrapper = useMemo(
    () => (searchMode ? CoreList.Search : CoreList.Filter),
    [searchMode],
  );

  return (
    <Core<K, E>
      close={close}
      open={open}
      data={data}
      emtpyContent={emptyContent}
      allowMultiple={false}
      visible={visible}
      value={value}
      hideColumnHeader={hideColumnHeader}
      onChange={handleChange}
      allowNone={allowNone}
      columns={columns}
    >
      <InputWrapper<K, E> searcher={searcher}>
        {({ onChange }) => (
          <SingleInput<K, E>
            variant={variant}
            onChange={onChange}
            onFocus={open}
            selected={selected}
            tagKey={tagKey}
            visible={visible}
            allowNone={allowNone}
            className={className}
            disabled={disabled}
          />
        )}
      </InputWrapper>
    </Core>
  );
};

export interface SelectInputProps<K extends Key, E extends KeyedRenderableRecord<K, E>>
  extends Omit<Input.TextProps, "value" | "onFocus"> {
  tagKey: keyof E | ((e: E) => string | number);
  selected: E | null;
  visible: boolean;
  debounceSearch?: number;
  allowNone?: boolean;
  onFocus: () => void;
}

const SingleInput = <K extends Key, E extends KeyedRenderableRecord<K, E>>({
  tagKey,
  selected,
  visible,
  onChange,
  onFocus,
  allowNone = true,
  debounceSearch = 250,
  placeholder = "Select...",
  className,
  ...props
}: SelectInputProps<K, E>): ReactElement => {
  const { clear } = CoreList.useSelectionContext();
  // We maintain our own value state for two reasons:
  //
  //  1. So we can avoid executing a search when the user selects an item and hides the
  //     dropdown.
  //  2. So that we can display the previous search results when the user focuses on the
  //       while still being able to clear the input value for searching.
  //
  const [internalValue, setInternalValue] = useState("");

  // Runs to set the value of the input to the item selected from the list.
  useEffect(() => {
    if (visible) return;
    if (primitiveIsZero(selected?.key)) return setInternalValue("");
    if (selected == null) return;
    if (typeof tagKey === "function")
      return setInternalValue(tagKey(selected).toString());
    else return setInternalValue((selected?.[tagKey] as string | number).toString());
  }, [selected, visible, tagKey]);

  const handleChange = (v: string): void => {
    onChange(v);
    setInternalValue(v);
  };

  const handleFocus: FocusEventHandler<HTMLInputElement> = (e) => {
    setInternalValue("");
    onFocus?.();
  };

  const handleClick: React.MouseEventHandler<HTMLInputElement> = (e) => {
    if (visible) return;
    e.preventDefault();
    onFocus?.();
  };

  const handleClear = (): void => {
    setInternalValue("");
    clear?.();
  };

  return (
    <Input.Text
      className={CSS(CSS.BE("select", "input"), className)}
      value={internalValue}
      onChange={handleChange}
      onFocus={handleFocus}
      style={{ flexGrow: 1 }}
      onClick={handleClick}
      placeholder={placeholder}
      {...props}
    >
      {allowNone && <ClearButton onClick={handleClear} />}
    </Input.Text>
  );
};
