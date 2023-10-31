// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { bounds } from "@synnaxlabs/x";
import { z } from "zod";

import { telem } from "@/telem/core";
import { TelemMeta } from "@/telem/core/base";

export class Factory implements telem.Factory {
  create(key: string, spec: telem.Spec, root: Factory): telem.Telem | null {
    switch (spec.type) {
      case NumericConverterSink.TYPE: {
        const props_ = NumericConverterSink.propsZ.parse(spec.props);
        const wrap = root.create(`${key}.wrap`, props_.wrap, root);
        if (wrap == null) return null;
        const t = new NumericConverterSink(key, wrap as telem.NumericSink);
        t.setProps(props_);
        return t;
      }
      case NumericConverterSource.TYPE: {
        const props_ = NumericConverterSource.propsZ.parse(spec.props);
        const wrap = root.create(`${key}.wrap`, props_.wrap, root);
        if (wrap == null) return null;
        const t = new NumericConverterSource(key, wrap as telem.NumericSource);
        t.setProps(props_);
        return t;
      }
    }
    return null;
  }
}

const numericConverterSinkProps = z.object({
  wrap: telem.numericSinkSpecZ,
  truthy: z.number().optional().default(1),
  falsy: z.number().optional().default(0),
});

export type NumericConverterSinkProps = z.infer<typeof numericConverterSinkProps>;

export class NumericConverterSink
  extends TelemMeta<typeof numericConverterSinkProps>
  implements telem.BooleanSink
{
  static readonly propsZ = numericConverterSinkProps;
  private readonly wrapped: telem.NumericSink;

  schema = NumericConverterSink.propsZ;

  static readonly TYPE = "boolean-numeric-converter-sink";

  constructor(key: string, wrap: telem.NumericSink) {
    super(NumericConverterSink.TYPE, key);
    this.wrapped = wrap;
  }

  invalidate(): void {
    this.wrapped.invalidate();
  }

  cleanup(): void {
    this.wrapped.cleanup();
    super.cleanup();
  }

  async setBoolean(value: boolean): Promise<void> {
    await this.wrapped.setNumber(value ? this.props.truthy : this.props.falsy);
  }

  setProps(props: any): void {
    super.setProps(props);
    this.wrapped.setProps(props.wrap.props);
  }
}

const numericConverterSourceProps = z.object({
  wrap: telem.numericSourceSpecZ,
  trueBound: bounds.bounds,
});

export type NumericConverterSourceProps = z.infer<typeof numericConverterSourceProps>;

export class NumericConverterSource
  extends TelemMeta<typeof numericConverterSourceProps>
  implements telem.BooleanSource
{
  wrapped: telem.NumericSource;
  curr: boolean | null = null;

  static readonly propsZ = numericConverterSourceProps;
  schema = NumericConverterSource.propsZ;

  static readonly TYPE = "boolean-source";

  constructor(key: string, wraps: telem.NumericSource) {
    super("bool.numericConverterSource", key);
    this.wrapped = wraps;

    this.wrapped.onChange(() => {
      void this.update();
    });
  }

  invalidate(): void {
    this.wrapped.invalidate();
  }

  cleanup(): void {
    this.wrapped.cleanup();
  }

  private async update(): Promise<void> {
    const raw = await this.wrapped.number();
    const value = bounds.contains(this.props.trueBound, raw);
    if (this.curr === value) return;
    this.curr = value;
    this.notify?.();
  }

  async boolean(): Promise<boolean> {
    if (this.curr == null) await this.update();
    return this.curr ?? false;
  }

  setProps(props: any): void {
    super.setProps(props);
    this.wrapped.setProps(props.wrap.props);
    void this.update();
  }
}
