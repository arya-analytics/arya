// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { type Primitive, isStringer, type PrimitiveRecord } from "@/primitive";
import { type spatial } from "@/spatial";

export type CompareF<T> = (a: T, b: T) => number;

/**
 * Creates the appropriate compare function for sorting the given
 * primitive type.
 *
 * @param v The primitive value to create a compare function for.
 * This is used to determine the type of comparison to perform.
 * @param reverse Whether to reverse the sort order.
 */
export const newF = <T extends Primitive>(
  v: T,
  reverse: boolean = false,
): CompareF<T> => {
  const t = isStringer(v) ? "stringer" : typeof v;
  let f: CompareF<T>;
  switch (t) {
    case "string":
      f = (a: T, b: T) => (a as string).localeCompare(b as string);
      break;
    case "stringer":
      f = (a: T, b: T) =>
        (a as string).toString().localeCompare((b as string).toString());
      break;
    case "number":
      f = (a: T, b: T) => (a as number) - (b as number);
      break;
    case "bigint":
      f = (a: T, b: T) => ((a as bigint) - (b as bigint) > BigInt(0) ? 1 : -1);
      break;
    case "boolean":
      f = (a: T, b: T) => Number(a) - Number(b);
      break;
    default:
      console.warn("sortFunc: unknown type");
      return () => -1;
  }
  return reverse ? reverseF(f) : f;
};

/**
 * Creates a compare function that compares the field of the given object.
 *
 * @param key The key of the field to compare.
 * @param value The object to compare the field of. This is used to determine the type of
 * comparison to perform.
 * @param reverse Whether to reverse the sort order.
 */
export const newFieldF = <T extends PrimitiveRecord>(
  key: keyof T,
  value: T,
  reverse?: boolean,
): CompareF<T> => {
  const f = newF(value[key], reverse);
  return (a: T, b: T) => f(a[key], b[key]);
};

/**
 * Compares the two primitive arrays.
 * @param a The first array to compare.
 * @param b The second array to compare.
 * @returns The array with the greater length if the array lengths are not equal. If the
 * arrays are the same length, returns 0 if all elements are equal, otherwise returns -1.
 */
export const primitiveArrays = <T extends Primitive>(
  a: readonly T[] | T[],
  b: readonly T[] | T[],
): number => {
  if (a.length !== b.length) return a.length - b.length;
  return a.every((v, i) => v === b[i]) ? 0 : -1;
};

export const unorderedPrimitiveArrays = <T extends Primitive>(
  a: readonly T[] | T[],
  b: readonly T[] | T[],
): number => {
  if (a.length !== b.length) return a.length - b.length;
  if (a.length === 0) return 0;
  const compareF = newF(a[0]);
  const aSorted = [...a].sort(compareF);
  const bSorted = [...b].sort(compareF);
  return aSorted.every((v, i) => v === bSorted[i]) ? 0 : -1;
};

export const order = (a: spatial.Order, b: spatial.Order): number => {
  if (a === b) return 0;
  if (a === "first" && b === "last") return 1;
  return -1;
};

/** @returns the reverse of the given compare function. */
export const reverseF =
  <T>(f: CompareF<T>): CompareF<T> =>
  (a: T, b: T) =>
    f(b, a);

/** The equal return value of a compare function. */
export const EQUAL = 0;

/** The less than return value of a compare function. */
export const LESS_THAN = -1;

/** The greater than return value of a compare function. */
export const GREATER_THAN = 1;

export const isLessThan = (n: number): boolean => n < EQUAL;

export const isGreaterThan = (n: number): boolean => n > EQUAL;

export const isGreaterThanEqual = (n: number): boolean => n >= EQUAL;
