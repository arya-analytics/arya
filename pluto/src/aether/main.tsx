// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import {
  type ComponentType,
  type FC,
  type PropsWithChildren,
  type ReactElement,
  createContext,
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { UnexpectedError, ValidationError } from "@synnaxlabs/client";
import { compare, type SenderHandler } from "@synnaxlabs/x";
import { type z } from "zod";

import { type MainMessage, type WorkerMessage } from "@/aether/message";
import { useUnmount } from "@/hooks/useMount";
import { useUniqueKey } from "@/hooks/useUniqueKey";
import { useMemoCompare } from "@/memo";
import { state } from "@/state";
import { prettyParse } from "@/util/zod";
import { Worker } from "@/worker";

export interface CreateReturn {
  setState: (state: any, transfer?: Transferable[]) => void;
  delete: () => void;
}

export interface ContextValue {
  path: string[];
  create: (type: string, path: string[], onReceive?: StateHandler) => CreateReturn;
}

const ZERO_CONTEXT_VALUE = {
  path: [],
  create: () => ({ setState: () => {}, delete: () => {} }),
};

export const Context = createContext<ContextValue>(ZERO_CONTEXT_VALUE);

export interface ProviderProps extends PropsWithChildren {
  workerKey: string;
  worker?: SenderHandler<MainMessage, WorkerMessage>;
}

export const Provider = ({
  workerKey,
  worker: propsWorker,
  children,
}: ProviderProps): ReactElement => {
  const contextWorker = Worker.use<MainMessage, WorkerMessage>(workerKey);
  const registry = useRef<Map<string, RegisteredComponent>>(new Map());
  const [ready, setReady] = useState(false);
  const worker = useMemo(
    () => propsWorker ?? contextWorker,
    [propsWorker, contextWorker],
  );

  const create: ContextValue["create"] = useCallback(
    (type, path, handler) => {
      const key = path.at(-1);
      if (key == null)
        throw new ValidationError(
          `[Aether.Provider] - received zero length path when registering component of type ${type}`,
        );
      if (type.length === 0)
        console.warn(
          `[Aether.Provider] - received zero length type when registering component at ${path.join(
            ".",
          )} This is probably a bad idea.`,
        );
      registry.current.set(key, { path, handler });
      return {
        setState: (state: any, transfer: Transferable[] = []): void => {
          if (worker == null) console.warn("aether - no worker");
          worker?.send({ variant: "update", path, state, type }, transfer);
        },
        delete: () => {
          if (worker == null) console.warn("aether - no worker");
          worker?.send({ variant: "delete", path, type });
        },
      };
    },
    [worker, registry],
  );

  useEffect(() => {
    worker?.handle((msg) => {
      const { key, state } = msg;
      const component = registry.current.get(key);
      if (component == null)
        throw new UnexpectedError(
          `[Aether.Provider] - received worker update message for unregistered component with key ${key}`,
        );
      if (component.handler == null)
        throw new UnexpectedError(
          `[Aether.Provider] - received worker update message for component with key ${key} that has no handler`,
        );
      component.handler(state);
    });
    setReady(true);
  }, [worker]);

  const value = useMemo<ContextValue>(() => ({ create, path: ["root"] }), [create]);

  return <Context.Provider value={value}>{ready && children}</Context.Provider>;
};

export const useAetherContext = (): ContextValue => useContext(Context);

export interface UseLifecycleReturn<S extends z.ZodTypeAny> {
  path: string[];
  setState: (state: z.input<S>, transfer?: Transferable[]) => void;
}

export interface UseLifecycleProps<S extends z.ZodTypeAny> {
  type: string;
  schema: S;
  aetherKey: string;
  initialState: z.input<S>;
  initialTransfer?: Transferable[];
  onReceive?: StateHandler;
}

const useLifecycle = <S extends z.ZodTypeAny>({
  type,
  aetherKey: key,
  initialState,
  schema,
  initialTransfer = [],
  onReceive,
}: UseLifecycleProps<S>): UseLifecycleReturn<S> => {
  const comms = useRef<CreateReturn | null>();
  const ctx = useAetherContext();
  const path = useMemoCompare(
    () => [...ctx.path, key],
    ([a], [b]) => compare.primitiveArrays(a, b) === 0,
    [ctx.path, key] as [string[], string],
  );

  const setState = useCallback(
    (state: z.input<S>, transfer: Transferable[] = []) =>
      comms.current?.setState(prettyParse(schema, state), transfer),
    [],
  );

  // We run the first effect synchronously so that parent components are created
  // before their children. This is impossible to do with effect hooks.
  if (comms.current == null) {
    comms.current = ctx.create(type, path, onReceive);
    comms.current.setState(initialState, initialTransfer);
  }

  // We run this effect whenever the identity of the aether component
  // we're using changes i.e. when the type or path changes. We also
  // run the effect when the onReceive callback changes, to make sure
  // that the callback is up to date. We don't run the effect when the
  // initialState or initialTransfer change, because this state is INITIAL.
  const first = useRef(true);
  useEffect(() => {
    // If we're on the first execution of the effect, we've already sent
    // what we need do synchronously, so don't re-execute.
    if (first.current) {
      first.current = false;
      return;
    }
    comms.current = ctx.create(type, path, onReceive);
    setState(initialState, initialTransfer);
    return () => {
      comms.current?.delete();
      comms.current = null;
    };
  }, [type, path, onReceive, setState]);

  useUnmount(() => {
    comms.current?.delete();
    comms.current = null;
  });

  return useMemo(() => ({ setState, path }), [setState, key, path]);
};

export interface UseProps<S extends z.ZodTypeAny>
  extends Omit<UseLifecycleProps<S>, "onReceive"> {}

export type UseReturn<S extends z.ZodTypeAny> = [
  {
    path: string[];
  },
  z.output<S>,
  (state: state.SetArg<z.input<S>>, transfer?: Transferable[]) => void,
];

export const use = <S extends z.ZodTypeAny>(props: UseProps<S>): UseReturn<S> => {
  const { type, schema, initialState } = props;

  const [internalState, setInternalState] = useState<z.output<S>>(() =>
    prettyParse(schema, initialState),
  );

  // Update the internal component state when we receive communications from the
  // aether.
  const handleReceive = useCallback(
    (state: any) => setInternalState(prettyParse(schema, state)),
    [schema],
  );

  const { path, setState: setAetherState } = useLifecycle({
    ...props,
    onReceive: handleReceive,
  });

  const setState = useCallback(
    (
      next: state.SetArg<z.input<S> | z.output<S>>,
      transfer: Transferable[] = [],
    ): void => {
      if (state.isSetter(next))
        setInternalState((prev) => {
          const nextS = next(prev);
          // This makes our setter impure, so it's something we should be wary of causing
          // unexpected behaviour in the the future.
          setAetherState(nextS, transfer);
          return nextS;
        });
      else {
        setInternalState(next);
        setAetherState(next, transfer);
      }
    },
    [path, type],
  );

  return [{ path }, internalState, setState];
};

type StateHandler = (state: any) => void;

interface RegisteredComponent {
  path: string[];
  handler?: StateHandler;
}

export interface CompositeProps extends PropsWithChildren {
  path: string[];
}

export const Composite = memo(({ children, path }: CompositeProps): JSX.Element => {
  const ctx = useAetherContext();
  const value = useMemo<ContextValue>(() => ({ ...ctx, path }), [ctx, path]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
});
Composite.displayName = "AetherComposite";

export const wrap = <P extends {}>(
  displayName: string,
  Component: ComponentType<P & { aetherKey: string }>,
): FC<P & { aetherKey?: string }> => {
  Component.displayName = `Aether.wrap(${displayName})`;
  const Wrapped = memo<P & { aetherKey?: string }>(
    ({ aetherKey, ...props }: P & { aetherKey?: string }): JSX.Element => {
      const key = useUniqueKey(aetherKey);
      return <Component {...(props as unknown as P)} aetherKey={key} />;
    },
  );
  Wrapped.displayName = displayName;
  return Wrapped;
};
