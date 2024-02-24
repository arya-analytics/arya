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
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactElement,
  useEffect,
  useRef,
} from "react";

import { type Key, type Keyed } from "@synnaxlabs/x";

import { useCombinedStateAndRef } from "@/hooks";
import { useGetTransformedData } from "@/list/Data";
import { useSelectionUtils } from "@/list/Selector";
import { Triggers } from "@/triggers";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface HoverProps<K extends Key = Key, E extends Keyed<K> = Keyed<K>>
  extends PropsWithChildren<{}> {
  disabled?: boolean;
  initialHover?: number;
}

const UP_TRIGGER: Triggers.Trigger = ["ArrowUp"];
const DOWN_TRIGGER: Triggers.Trigger = ["ArrowDown"];
const SELECT_TRIGGER: Triggers.Trigger = ["Enter"];
const TRIGGERS: Triggers.Trigger[] = [UP_TRIGGER, DOWN_TRIGGER, SELECT_TRIGGER];

export interface HoverContextValue {
  hover: number;
  setHover: (hover: number) => void;
}

const HoverContext = createContext<HoverContextValue>({
  hover: -1,
  setHover: () => {},
});

export const useHoverContext = (): HoverContextValue =>
  useContext(HoverContext) as unknown as HoverContextValue;

export const Hover = <K extends Key = Key, E extends Keyed<K> = Keyed<K>>({
  children,
  initialHover = -1,
  disabled = false,
}: HoverProps<K, E>): ReactElement => {
  const getData = useGetTransformedData<K, E>();
  const { onSelect } = useSelectionUtils();
  const [hover, setHover, ref] = useCombinedStateAndRef<number>(initialHover);
  const beforeDisabledRef = useRef(0);
  useEffect(() => {
    if (disabled) beforeDisabledRef.current = hover;
    setHover(disabled ? -1 : beforeDisabledRef.current);
  }, [disabled]);

  const handleTrigger = useCallback(
    ({ triggers, stage }: Triggers.UseEvent) => {
      if (stage !== "start") return;
      if (disabled) return;
      const data = getData();
      if (Triggers.match(triggers, [UP_TRIGGER]))
        setHover((pos) => (pos === 0 ? data.length - 1 : pos - 1));
      else if (Triggers.match(triggers, [DOWN_TRIGGER]))
        setHover((pos) => (pos === data.length - 1 ? 0 : pos + 1));
      else if (Triggers.match(triggers, [SELECT_TRIGGER]))
        onSelect?.(data[ref.current].key);
    },
    [onSelect, disabled],
  );

  Triggers.use({ triggers: TRIGGERS, callback: handleTrigger, loose: true });

  const ctxValue = useMemo<HoverContextValue>(
    () => ({ hover, setHover }),
    [hover, setHover],
  );

  return <HoverContext.Provider value={ctxValue}>{children}</HoverContext.Provider>;
};
