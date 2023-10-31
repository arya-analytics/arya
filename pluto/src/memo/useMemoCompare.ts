// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { type DependencyList, useRef } from "react";

import { compare, deep } from "@synnaxlabs/x";
import type { Primitive } from "@synnaxlabs/x";

export const useMemoCompare = <V, D extends DependencyList>(
  factory: () => V,
  areEqual: (prevDevps: D, nextDeps: D) => boolean,
  deps: D,
): V => {
  const ref = useRef<{ deps: D; value: V }>();
  if (ref.current == null) ref.current = { deps, value: factory() };
  else if (!areEqual(ref.current.deps, deps)) ref.current = { deps, value: factory() };
  return ref.current.value;
};

export const compareArrayDeps = <T extends Primitive>(
  [a]: readonly [T[]] | [T[]],
  [b]: readonly [T[]] | [T[]],
): boolean => compare.primitiveArrays(a, b) === 0;

export const useMemoDeepEqualProps = <T extends Record<string, unknown>>(
  props: T,
): T => {
  const ref = useRef<T>();
  if (ref.current == null) ref.current = props;
  else if (!deep.equal(ref.current, props)) ref.current = props;
  return ref.current;
};
