// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import {
  createContext,
  type PropsWithChildren,
  useEffect,
  useContext as reactUseContext,
} from "react";

import { type channel } from "@synnaxlabs/client";
import { type z } from "zod";

import { Aether } from "@/aether";
import { useMemoDeepEqualProps } from "@/memo";
import { control } from "@/telem/control/aether";

export interface ControllerProps
  extends Omit<z.input<typeof control.controllerStateZ>, "needsControlOf">,
    PropsWithChildren {
  onStatusChange?: (status: control.Status) => void;
  name: string;
}

export interface ContextValue {
  needsControlOf: channel.Keys;
}

const Context = createContext<ContextValue>({ needsControlOf: [] });

export const useContext = (): ContextValue => reactUseContext(Context);

export const Controller = Aether.wrap<ControllerProps>(
  control.Controller.TYPE,
  ({ aetherKey, children, onStatusChange, ...props }) => {
    const memoProps = useMemoDeepEqualProps(props);
    const [{ path }, { status, needsControlOf }, setState] = Aether.use({
      aetherKey,
      type: control.Controller.TYPE,
      schema: control.controllerStateZ,
      initialState: memoProps,
    });
    useEffect(() => {
      if (status != null) onStatusChange?.(status);
    }, [status, onStatusChange]);
    useEffect(() => {
      setState((state) => ({ ...state, ...memoProps }));
    }, [memoProps, setState]);

    return (
      <Context.Provider value={{ needsControlOf }}>
        <Aether.Composite path={path}>{children}</Aether.Composite>;
      </Context.Provider>
    );
  },
);
