// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { type UnknownRecord } from "@/record";
import { Primitive } from "@/primitive";

type DeepEqualBaseRecord = UnknownRecord | {
  equals?: (other: any) => boolean;
}

export const equal = <T extends DeepEqualBaseRecord | DeepEqualBaseRecord[] | Primitive[]>(a: T, b: T): boolean => {
  const aIsArray = Array.isArray(a);
  const bIsArray = Array.isArray(b);
  if (aIsArray !== bIsArray) return false;
  if (aIsArray && bIsArray) {
    const aArr = a as DeepEqualBaseRecord[];
    const bArr = b as DeepEqualBaseRecord[];
    if (aArr.length !== bArr.length) return false;
    for (let i = 0; i < aArr.length; i++) {
      if (!equal(aArr[i], bArr[i])) return false;
    }
    return true;
  }
  if (typeof a !== "object" || typeof b !== "object") return a === b;
  if ("equals" in a) 
    return (a.equals as (other: any) => boolean)(b);
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  for (const key of aKeys) {
    // @ts-expect-error
    const aVal = a[key];
    // @ts-expect-error
    const bVal = b[key];
    if (typeof aVal === "object" && typeof bVal === "object") {
      if (!equal(aVal, bVal)) return false;
    } else if (aVal !== bVal) return false;
  }
  return true;
};

export const partialEqual = <T extends UnknownRecord<T>>(
  base: T,
  partial: Partial<T>,
): boolean => {
  const baseKeys = Object.keys(base);
  const partialKeys = Object.keys(partial);
  if (partialKeys.length > baseKeys.length) return false;
  for (const key of partialKeys) {
    // @ts-expect-error
    const baseVal = base[key];
    // @ts-expect-error
    const partialVal = partial[key];
    if (typeof baseVal === "object" && typeof partialVal === "object") {
      if (!partialEqual(baseVal, partialVal)) return false;
    } else if (baseVal !== partialVal) return false;
  }
  return true;
};
