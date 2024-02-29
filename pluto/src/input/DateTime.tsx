// Copyright 2024 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { useState } from "react";

import { TimeSpan, TimeStamp } from "@synnaxlabs/x";

import { Text } from "@/input/Text";

import { type BaseProps } from "./types";

export interface DateTimeProps extends BaseProps<number> {}

export const DateTime = ({ value, onChange, onBlur, ...props }: DateTimeProps) => {
  const ts = new TimeStamp(value, "UTC");
  const [internalValue, setInternalVlaue] = useState(
    ts.fString("ISO", "local").slice(0, -1),
  );
  const [valueIsValid, setValueIsValid] = useState(true);

  const handleChange = (next: string | number): void => {
    let nextStr = next.toString();
    setInternalVlaue(nextStr);

    let ts = new TimeStamp(next, "UTC");
    if (nextStr.length < 23) nextStr += ".000";

    ts = ts.add(
      (TimeStamp.now().date().getTimezoneOffset() - ts.date().getTimezoneOffset()) *
        TimeSpan.MINUTE.valueOf(),
    );
    let ok = false;
    try {
      const str = ts.fString("ISO", "local");
      ok = str.slice(0, -1) === nextStr;
    } catch (_) {
      console.error("e");
    }
    if (!ok) {
      setValueIsValid(false);
      return;
    }
    onChange(ts.valueOf());
    setValueIsValid(true);
  };

  const handleBlur: React.FocusEventHandler<HTMLInputElement> = (e) => {
    setValueIsValid(true);
    setInternalVlaue(new TimeStamp(value, "UTC").fString("ISO", "local").slice(0, -1));
    onBlur?.(e);
  };

  return (
    <Text
      type="datetime-local"
      onBlur={handleBlur}
      required={false}
      value={
        valueIsValid
          ? new TimeStamp(value, "UTC").fString("ISO", "local").slice(0, -1)
          : internalValue
      }
      onChange={handleChange}
      {...props}
    />
  );
};
