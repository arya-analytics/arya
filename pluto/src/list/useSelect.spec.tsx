// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { useState } from "react";

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { type UseSelectMultipleProps, useSelect } from "@/list/useSelect";

interface Entry {
  key: string;
  name: string;
}

const data: Entry[] = [
  {
    key: "1",
    name: "John",
  },
  {
    key: "2",
    name: "James",
  },
  {
    key: "3",
    name: "Javier",
  },
];

const useSelecMultipleWrapper = (
  props: Omit<UseSelectMultipleProps<string, Entry>, "data" | "value" | "onChange">,
) => {
  const [value, setValue] = useState<string[]>([]);
  const { clear, onSelect } = useSelect<string, Entry>({
    ...props,
    data,
    value,
    onChange: setValue,
  });
  return { value, clear, onSelect };
};

const useSelectSingleWrapper = (
  props: Omit<UseSelectMultipleProps<string, Entry>, "data" | "value" | "onChange">,
) => {
  const [value, setValue] = useState<string | null>(null);
  // @ts-expect-error - just for testing purposes so we don't need to configure
  // a different wrapper for the allowNone: false case
  const { clear, onSelect } = useSelect<string, Entry>({
    allowNone: true,
    ...props,
    data,
    value,
    onChange: setValue,
    allowMultiple: false,
  });
  return { value, clear, onSelect };
};

describe("useSelect", () => {
  describe("multiple selection", () => {
    it("should select two items", () => {
      const { result } = renderHook(useSelecMultipleWrapper);
      act(() => result.current.onSelect("1"));
      expect(result.current.value).toEqual(["1"]);
      act(() => result.current.onSelect("2"));
      expect(result.current.value).toEqual(["1", "2"]);
    });
    it("should deselect an item when you click it again", () => {
      const { result } = renderHook(useSelecMultipleWrapper);
      act(() => result.current.onSelect("1"));
      act(() => result.current.onSelect("2"));
      act(() => result.current.onSelect("1"));
      expect(result.current.value).toEqual(["2"]);
    });
    it("should clear all selections", () => {
      const { result } = renderHook(useSelecMultipleWrapper);
      act(() => result.current.onSelect("1"));
      act(() => result.current.onSelect("2"));
      act(() => result.current.clear());
      expect(result.current.value).toEqual([]);
    });
    describe("no not allow none", () => {
      it("should not allow clearing all selections", () => {
        const { result } = renderHook(() =>
          useSelecMultipleWrapper({ allowNone: false }),
        );
        act(() => result.current.onSelect("1"));
        act(() => result.current.onSelect("2"));
        act(() => result.current.clear());
        expect(result.current.value).toEqual(["1"]);
      });
      it("should not allow removing the last selection", () => {
        const { result } = renderHook(() =>
          useSelecMultipleWrapper({ allowNone: false }),
        );
        act(() => result.current.onSelect("1"));
        act(() => result.current.onSelect("1"));
        expect(result.current.value).toEqual(["1"]);
      });
      it("should automatically populate the first item", () => {
        const { result } = renderHook(() =>
          useSelecMultipleWrapper({ allowNone: false }),
        );
        expect(result.current.value).toEqual(["1"]);
      });
    });
  });
  describe("single selection", () => {
    it("should select one item", () => {
      const { result } = renderHook(useSelectSingleWrapper);
      act(() => result.current.onSelect("1"));
      expect(result.current.value).toEqual("1");
      act(() => result.current.onSelect("2"));
      expect(result.current.value).toEqual("2");
    });
    it("should deselect an item when you click it again", () => {
      const { result } = renderHook(useSelectSingleWrapper);
      act(() => result.current.onSelect("1"));
      act(() => result.current.onSelect("1"));
      expect(result.current.value).toEqual(null);
    });
    describe("no not allow none", () => {
      it("should not allow clearing all selections", () => {
        const { result } = renderHook(() =>
          useSelectSingleWrapper({ allowNone: false }),
        );
        act(() => result.current.onSelect("1"));
        act(() => result.current.onSelect("1"));
        expect(result.current.value).toEqual("1");
      });
      it("should automatically populate the first item", () => {
        const { result } = renderHook(() =>
          useSelectSingleWrapper({ allowNone: false }),
        );
        expect(result.current.value).toEqual("1");
      });
    });
  });
});
