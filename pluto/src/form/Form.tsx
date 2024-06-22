// Copyright 2024 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

/* eslint-disable @typescript-eslint/no-unnecessary-type-constraint */
import { type Destructor, shallowCopy, toArray } from "@synnaxlabs/x";
import { deep } from "@synnaxlabs/x/deep";
import { zodutil } from "@synnaxlabs/x/zodutil";
import {
  createContext,
  FC,
  type PropsWithChildren,
  type ReactElement,
  useCallback,
  useContext as reactUseContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { z } from "zod";

import { useSyncedRef } from "@/hooks/ref";
import { Input } from "@/input";
import { state } from "@/state";
import { type status } from "@/status/aether";

/** Props for the @see useField hook */
export interface UseFieldProps<I, O = I> {
  path: string;
  optional?: false;
  onChange?: (value: O, extra: ContextValue & { path: string }) => void;
}

export interface UseNullableFieldProps<I, O = I>
  extends Omit<UseFieldProps<I, O>, "optional"> {
  optional: true;
}

/** Return type for the @see useField hook */
export interface UseFieldReturn<I extends Input.Value, O extends Input.Value = I>
  extends FieldState<I> {
  onChange: (value: O) => void;
  setStatus: (status: status.CrudeSpec) => void;
  status: status.CrudeSpec;
}

interface UseField {
  <I extends Input.Value, O extends Input.Value = I>(
    props: UseFieldProps<I, O>,
  ): UseFieldReturn<I, O>;
  <I extends Input.Value, O extends Input.Value = I>(
    props: UseNullableFieldProps<I, O>,
  ): UseFieldReturn<I, O> | null;
}

/**
 * Hook for managing a particular field in a form.
 *
 * @param props - The props for the hook
 * @param props.path - The path to the field in the form.
 */
export const useField = (<I extends Input.Value, O extends Input.Value = I>({
  path,
  optional = false,
  onChange,
}: UseFieldProps<I, O>): UseFieldReturn<I, O> | null => {
  const ctx = useContext();
  const { get, bind, set, setStatus } = ctx;

  const [state, setState] = useState<FieldState<I> | null>(get<I>({ path, optional }));

  useLayoutEffect(() => {
    setState(get<I>({ path, optional }));
    return bind({ path, onChange: setState, listenToChildren: false });
  }, [path, bind, setState, optional]);

  const handleChange = useCallback(
    (value: O) => {
      onChange?.(value, { ...ctx, path });
      set({ path, value });
    },
    [path, set, onChange],
  );

  const handleSetStatus = useCallback(
    (status: status.CrudeSpec) => setStatus(path, status),
    [path, setStatus],
  );

  if (state == null) {
    if (!optional) throw new Error(`Field state is null: ${path}`);
    return null;
  }

  return { onChange: handleChange, setStatus: handleSetStatus, ...state };
}) as UseField;

export type UseFieldValue = (<I extends Input.Value, O extends Input.Value = I>(
  path: string,
  optional?: false,
  ctx?: ContextValue,
) => O) &
  (<I extends Input.Value, O extends Input.Value = I>(
    path: string,
    optional: true,
    ctx?: ContextValue,
  ) => O | null);

export type UseFieldState = (<I extends Input.Value, O extends Input.Value = I>(
  path: string,
  optional?: false,
  ctx?: ContextValue,
) => FieldState<O>) &
  (<I extends Input.Value, O extends Input.Value = I>(
    path: string,
    optional: true,
    ctx?: ContextValue,
  ) => FieldState<O> | null);

export const useFieldState = <I extends Input.Value, O extends Input.Value = I>(
  path: string,
  optional: boolean = false,
  ctx?: ContextValue,
): FieldState<O> | null => {
  const { get, bind } = useContext(ctx);
  const [, setChangeTrigger] = useState(0);
  useLayoutEffect(() => {
    setChangeTrigger((prev) => prev + 1);
    return bind<O>({ path, onChange: () => setChangeTrigger((p) => p + 1) });
  }, [path, bind]);
  return get<O>({ path, optional }) ?? null;
};

export const useFieldValue = (<I extends Input.Value, O extends Input.Value = I>(
  path: string,
  optional: boolean = false,
  ctx?: ContextValue,
): O | null => {
  const { get, bind } = useContext(ctx);
  const [, setChangeTrigger] = useState(0);
  useLayoutEffect(() => {
    setChangeTrigger((prev) => prev + 1);
    return bind<O>({ path, onChange: () => setChangeTrigger((p) => p + 1) });
  }, [path, bind]);
  return get<O>({ path, optional })?.value ?? null;
}) as UseFieldValue;

export const useFieldValid = (path: string): boolean =>
  useFieldState(path, true)?.status?.variant === "success";

export interface UseFieldListenerProps<
  I extends Input.Value,
  Z extends z.ZodTypeAny = z.ZodTypeAny,
> {
  ctx?: ContextValue<Z>;
  path: string;
  onChange: (state: FieldState<I>, extra: ContextValue) => void;
}

export const useFieldListener = <
  I extends Input.Value,
  Z extends z.ZodTypeAny = z.ZodTypeAny,
>({
  path,
  ctx: override,
  onChange,
}: UseFieldListenerProps<I, Z>): void => {
  const ctx = useContext(override);
  useLayoutEffect(
    () =>
      ctx.bind<I>({
        path,
        onChange: (fs) => onChange(fs, ctx),
        listenToChildren: false,
      }),
    [path, ctx],
  );
};

export interface UseChildFieldValuesProps {
  path: string;
  optional?: false;
}

export interface UseNullableChildFieldValuesProps {
  path: string;
  optional: true;
}

export interface UseChildFieldValues {
  <V extends unknown = unknown>(props: UseChildFieldValuesProps): V;
  <V extends unknown = unknown>(props: UseNullableChildFieldValuesProps): V | null;
}

export const useChildFieldValues = (<V extends unknown = unknown>({
  path,
  optional = false,
}: UseChildFieldValuesProps): V | null => {
  const { bind, get } = useContext();
  const [state, setState] = useState<FieldState<V> | null>(get<V>({ path, optional }));
  useLayoutEffect(() => {
    setState(get<V>({ path, optional }));
    return bind<V>({
      path,
      onChange: (fs) => setState({ ...fs, value: shallowCopy(fs.value) }),
      listenToChildren: true,
    });
  }, [path, bind, get]);
  if (state == null && !optional) throw new Error("Field state is null");
  return state?.value ?? null;
}) as UseChildFieldValues;

export interface UseFieldArrayProps {
  path: string;
  updateOnChildren?: boolean;
}

export interface UseFieldArrayReturn<V extends unknown> {
  value: V[];
  push: (value: V | V[]) => void;
  remove: (index: number | number[]) => void;
  keepOnly: (indices: number | number[]) => void;
  set: (values: state.SetArg<V[]>) => void;
}

export const useFieldArray = <V extends unknown = unknown>({
  path,
  updateOnChildren = false,
}: UseFieldArrayProps): UseFieldArrayReturn<V> => {
  const { bind, get, set } = useContext();
  const [fState, setFState] = useState<V[]>(get<V[]>({ path, optional: false }).value);

  useLayoutEffect(() => {
    setFState(get<V[]>({ path, optional: false }).value);
    return bind<V[]>({
      path,
      onChange: (fs) => setFState(shallowCopy<V[]>(fs.value)),
      listenToChildren: updateOnChildren,
    });
  }, [path, bind, get, setFState]);

  const push = useCallback(
    (value: V | V[]) => {
      const copy = shallowCopy(get<V[]>({ path, optional: false }).value);
      copy.push(...toArray(value));
      set({ path, value: copy });
    },
    [path, get, set],
  );

  const remove = useCallback(
    (index: number | number[]) => {
      const val = get<V[]>({ path, optional: false }).value;
      const indices = new Set(toArray(index));
      set({ path, value: val.filter((_, i) => !indices.has(i)) });
    },
    [path, fState, get],
  );

  const keepOnly = useCallback(
    (index: number | number[]) => {
      const val = get<V[]>({ path, optional: false }).value;
      const indices = new Set(toArray(index));
      set({ path, value: val.filter((_, i) => indices.has(i)) });
    },
    [path, fState, get],
  );

  const handleSet = useCallback(
    (setter: state.SetArg<V[]>) => {
      set({
        path,
        value: state.executeSetter(setter, get<V[]>({ path }).value),
      });
    },
    [path, set],
  );

  return { value: fState, push, remove, keepOnly, set: handleSet };
};

export type Listener<V = unknown> = (state: FieldState<V>) => void;

export interface FieldState<V = unknown> {
  value: V;
  status: status.CrudeSpec;
  touched: boolean;
  required: boolean;
}

interface RequiredGetProps {
  path: string;
  optional?: boolean;
}

interface OptionalGetProps {
  path: string;
  optional: true;
}

type GetProps = RequiredGetProps | OptionalGetProps;

interface GetFunc {
  <V extends Input.Value>(props: RequiredGetProps): FieldState<V>;
  <V extends Input.Value>(props: OptionalGetProps): FieldState<V> | null;
}

interface SetProps {
  path: string;
  value: unknown;
}

type SetFunc = (props: SetProps) => void;

interface BindProps<V = unknown> {
  path: string;
  onChange: Listener<V>;
  listenToChildren?: boolean;
}

type BindFunc = <V = unknown>(props: BindProps<V>) => Destructor;

export interface ContextValue<Z extends z.ZodTypeAny = z.ZodTypeAny> {
  bind: BindFunc;
  set: SetFunc;
  get: GetFunc;
  value: () => z.output<Z>;
  validate: (path?: string) => boolean;
  validateAsync: (path?: string) => Promise<boolean>;
  has: (path: string) => boolean;
  setStatus: (path: string, status: status.CrudeSpec) => void;
}

export const Context = createContext<ContextValue>({
  bind: () => () => {},
  set: () => {},
  get: <V extends any = unknown>(): FieldState<V> => ({
    value: undefined as unknown as V,
    status: { key: "", variant: "success", message: "" },
    touched: false,
    required: false,
  }),
  validate: () => false,
  validateAsync: () => Promise.resolve(false),
  value: () => ({}),
  has: () => false,
  setStatus: () => {},
});

export const useContext = <Z extends z.ZodTypeAny = z.ZodTypeAny>(
  override?: ContextValue<Z>,
): ContextValue<Z> => {
  const internal = reactUseContext(Context);
  return override ?? (internal as unknown as ContextValue<Z>);
};

const NO_ERROR_STATUS = (path: string): status.CrudeSpec => ({
  key: path,
  variant: "success",
  message: "",
});

interface UseRef<Z extends z.ZodTypeAny> {
  state: z.output<Z>;
  status: Map<string, status.CrudeSpec>;
  touched: Set<string>;
  listeners: Map<string, Set<Listener>>;
  parentListeners: Map<string, Set<Listener>>;
}

export interface UseProps<Z extends z.ZodTypeAny> {
  values: z.output<Z>;
  sync?: boolean;
  onChange?: (values: z.output<Z>) => void;
  schema?: Z;
}

export type UseReturn<Z extends z.ZodTypeAny> = ContextValue<Z>;

const getVariant = (issue: z.ZodIssue): status.Variant =>
  issue.code === z.ZodIssueCode.custom &&
  issue.params != null &&
  "variant" in issue.params
    ? issue.params.variant
    : "error";

export const use = <Z extends z.ZodTypeAny>({
  values,
  sync = false,
  schema,
  onChange,
}: UseProps<Z>): UseReturn<Z> => {
  const ref = useRef<UseRef<Z>>({
    state: values,
    status: new Map(),
    touched: new Set(),
    listeners: new Map(),
    parentListeners: new Map(),
  });
  const schemaRef = useSyncedRef(schema);
  const onChangeRef = useSyncedRef(onChange);

  const bind: BindFunc = useCallback(
    <V extends any = unknown>({
      path,
      onChange: callback,
      listenToChildren = false,
    }: BindProps<V>): Destructor => {
      const { parentListeners, listeners } = ref.current;
      const lis = listenToChildren ? parentListeners : listeners;
      if (!lis.has(path)) lis.set(path, new Set());
      lis.get(path)?.add(callback as Listener);
      return () => lis.get(path)?.delete(callback as Listener);
    },
    [],
  );

  const get: GetFunc = useCallback(
    <V extends any = unknown>({ path, optional }: GetProps): FieldState<V> | null => {
      const { state, status, touched } = ref.current;
      const value = deep.get(state, path, optional);
      if (value == null) return null;
      const fs = {
        value: value as V,
        status: status.get(path) ?? NO_ERROR_STATUS(path),
        touched: touched.has(path),
        required: false,
      };
      if (schemaRef.current == null) return fs;
      const schema = schemaRef.current;
      const zField = zodutil.getFieldSchema(schema, path, true);
      if (zField == null) return fs;
      fs.required = !zField.isOptional();
      return fs;
    },
    [],
  ) as GetFunc;

  const processValidationResult = useCallback(
    (
      result: z.SafeParseReturnType<z.input<Z>, z.output<Z>>,
      path: string = "",
    ): boolean => {
      const { status, listeners, touched } = ref.current;
      if (result.success) {
        const keys = Array.from(status.keys());
        status.clear();
        keys.forEach((p) => {
          const fs = get({ path: p, optional: true });
          if (fs == null) return;
          listeners.get(p)?.forEach((l) => l(fs));
        });
        return true;
      }
      let success = true;
      const issueKeys = new Set(result.error.issues.map((i) => i.path.join(".")));
      result.error.issues.forEach((issue) => {
        const issuePath = issue.path.join(".");
        if (!deep.pathsMatch(issuePath, path)) return;
        const variant = getVariant(issue);
        if (variant !== "warning") success = false;
        status.set(issuePath, {
          key: issuePath,
          variant: getVariant(issue),
          message: issue.message,
        });
        touched.add(issuePath);
        let fs = get({ path: issuePath, optional: true });
        // If we can't find the field value, this means the user never set it, so instead
        // we just to a best effort construction of the field state. This means that if
        // the user has a field rendered for this path, the error will be displayed.
        if (fs == null)
          fs = {
            value: undefined,
            status: status.get(issuePath) ?? NO_ERROR_STATUS(issuePath),
            touched: false,
            required: false,
          };
        listeners.get(issuePath)?.forEach((l) => l(fs));
      });
      status.forEach((_, subPath) => {
        if (!issueKeys.has(subPath)) {
          status.delete(subPath);
          const fs = get({ path: subPath, optional: true });
          if (fs != null) listeners.get(subPath)?.forEach((l) => l(fs));
        }
      });
      return success;
    },
    [],
  );

  const validate = useCallback(
    (path?: string): boolean => {
      if (schemaRef.current == null) return true;
      const { state } = ref.current;
      const result = schemaRef.current.safeParse(state);
      return processValidationResult(result, path);
    },
    [processValidationResult],
  );

  const validateAsync = useCallback(
    async (path?: string): Promise<boolean> => {
      if (schemaRef.current == null) return true;
      const { state } = ref.current;
      const result = await schemaRef.current.safeParseAsync(state);
      return processValidationResult(result, path);
    },
    [processValidationResult],
  );

  const set: SetFunc = useCallback(({ path, value }): void => {
    const { state, touched, listeners, parentListeners } = ref.current;
    touched.add(path);
    if (path.length === 0) ref.current.state = value as z.output<Z>;
    else deep.set(state, path, value);
    try {
      validate();
    } catch {
      validateAsync();
    }
    listeners.get(path)?.forEach((l) => {
      const fs = get({ path, optional: true });
      if (fs != null) l(fs);
    });
    parentListeners.forEach((lis, lisPath) => {
      if (deep.pathsMatch(path, lisPath)) {
        const v = get({ path: lisPath, optional: true });
        if (v != null) lis.forEach((l) => l(v));
      }
    });
    onChangeRef.current?.(ref.current.state);
  }, []);

  const has = useCallback((path: string): boolean => {
    const { state } = ref.current;
    return deep.has(state, path);
  }, []);

  const setStatus = useCallback((path: string, status: status.CrudeSpec): void => {
    const { listeners } = ref.current;
    ref.current.status.set(path, status);
    const fs = get({ path });
    listeners.get(path)?.forEach((l) => l(fs));
  }, []);

  useEffect(() => {
    if (!sync) return;
    const { listeners } = ref.current;
    ref.current.state = values;
    listeners.forEach((lis, p) => {
      const v = get({ path: p, optional: true });
      if (v == null) return;
      lis.forEach((l) => l(v));
    });
  }, [sync, values]);

  return useMemo(
    (): ContextValue<Z> => ({
      bind,
      set,
      get,
      validate,
      validateAsync,
      value: () => ref.current.state,
      has,
      setStatus,
    }),
    [bind, set, get, validate],
  );
};

export const Form = (props: PropsWithChildren<ContextValue>): ReactElement => {
  return <Context.Provider value={props}>{props.children}</Context.Provider>;
};
