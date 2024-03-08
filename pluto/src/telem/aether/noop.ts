// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { TimeStamp, observe } from "@synnaxlabs/x";

import { color } from "@/color/core";
import { type status } from "@/status/aether";
import { type Factory } from "@/telem/aether/factory";
import {
  type NumberSinkSpec,
  type BooleanSink,
  type BooleanSinkSpec,
  type NumberSink,
  type Telem,
  type BooleanSource,
  type BooleanSourceSpec,
  type NumberSource,
  type NumberSourceSpec,
  type ColorSourceSpec,
  type Spec,
  type ColorSource,
  type StringSourceSpec,
  type StatusSourceSpec,
} from "@/telem/aether/telem";

class Noop extends observe.Observer<void> implements Telem {
  async cleanup(): Promise<void> {}
}

class NoopBooleanSink extends Noop implements BooleanSink {
  static readonly TYPE = "noop-boolean-sink";

  async set(): Promise<void> {
    return await Promise.resolve();
  }
}

export const noopBooleanSinkSpec: BooleanSinkSpec = {
  type: NoopBooleanSink.TYPE,
  props: {},
  variant: "sink",
  valueType: "boolean",
};

class NumericSink extends Noop implements NumberSink {
  static readonly TYPE = "noop-numeric-sink";

  async set(): Promise<void> {
    return await Promise.resolve();
  }
}

export const noopNumericSinkSpec: NumberSinkSpec = {
  type: NumericSink.TYPE,
  props: {},
  variant: "sink",
  valueType: "number",
};

class NoopBooleanSource extends Noop implements BooleanSource {
  static readonly TYPE = "noop-boolean-source";

  async value(): Promise<boolean> {
    return await Promise.resolve(false);
  }
}

export const noopBooleanSourceSpec: BooleanSourceSpec = {
  type: NoopBooleanSource.TYPE,
  props: {},
  variant: "source",
  valueType: "boolean",
};

class NumericSource extends Noop implements NumberSource {
  static readonly TYPE = "noop-numeric-source";

  async value(): Promise<number> {
    return 0;
  }
}

export const noopNumericSourceSpec: NumberSourceSpec = {
  type: NumericSource.TYPE,
  props: {},
  variant: "source",
  valueType: "number",
};

class StringSource extends Noop implements StringSource {
  static readonly TYPE = "noop-string-source";

  async value(): Promise<string> {
    return "";
  }
}

export const noopStringSourceSpec: StringSourceSpec = {
  type: StringSource.TYPE,
  props: {},
  variant: "source",
  valueType: "string",
};

class StatusSource extends Noop implements StatusSource {
  static readonly TYPE = "noop-status-source";

  async value(): Promise<status.Spec> {
    return {
      key: "noop",
      variant: "disabled",
      message: "unknown",
      time: TimeStamp.now(),
    };
  }
}

export const noopStatusSourceSpec: StatusSourceSpec = {
  type: StatusSource.TYPE,
  props: {},
  variant: "source",
  valueType: "status",
};

class NoopColorSource extends Noop implements ColorSource {
  static readonly TYPE = "noop-color-source";

  async value(): Promise<color.Color> {
    return color.ZERO;
  }
}

export const noopColorSourceSpec: ColorSourceSpec = {
  type: NoopColorSource.TYPE,
  props: {},
  variant: "source",
  valueType: "color",
};

const REGISTRY: Record<string, new () => Telem> = {
  [NoopBooleanSink.TYPE]: NoopBooleanSink,
  [NumericSink.TYPE]: NumericSink,
  [NoopBooleanSource.TYPE]: NoopBooleanSource,
  [NumericSource.TYPE]: NumericSource,
  [StatusSource.TYPE]: StatusSource,
  [NoopColorSource.TYPE]: NoopColorSource,
  [StringSource.TYPE]: StringSource,
};

export class NoopFactory implements Factory {
  type = "noop";
  create(spec: Spec): Telem | null {
    const F = REGISTRY[spec.type];
    if (F == null) return null;
    return new F();
  }
}
