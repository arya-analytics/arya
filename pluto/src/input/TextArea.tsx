// Copyright 2024 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { type ComponentPropsWithoutRef, forwardRef } from "react";

import { CSS } from "@/css";
import { type ExtensionProps } from "@/input/types";

import "@/input/TextArea.css";

type HTMlTextAreaProps = Omit<
  ComponentPropsWithoutRef<"textarea">,
  "size" | "onChange" | "value" | "children" | "placeholder"
>;
export interface TextAreaProps extends ExtensionProps<string>, HTMlTextAreaProps {
  selectOnFocus?: boolean;
  centerPlaceholder?: boolean;
}

/**
 * A controlled text area input component.
 *
 * @param props - The props for the input component. Unlisted props are passed to the
 * underlying input element.
 * @param props.value - The value of the input.
 * @param props.onChange - A function to call when the input value changes.
 * @param props.size - The size of the input: "small" | "medium" | "large".
 * @param props.selectOnFocus - Whether the input should select its contents when focused.
 * @param props.centerPlaceholder - Whether the placeholder should be centered.
 */
export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    {
      size = "medium",
      value,
      style,
      onChange,
      className,
      onFocus,
      selectOnFocus = false,
      centerPlaceholder = false,
      placeholder,
      variant = "outlined",
      sharp = false,
      children,
      ...props
    },
    ref,
  ) => (
    <textarea
      style={style}
      className={CSS(
        CSS.B("textarea"),
        CSS.BM("textarea", variant),
        CSS.sharp(sharp),
        className,
      )}
      ref={ref}
      value={value}
      // remove newlines
      onChange={(e) => onChange(e.target.value.replace(/\n/g, ""))}
      onFocus={(e) => {
        if (selectOnFocus) e.target.select();
        onFocus?.(e);
      }}
      placeholder={placeholder as string}
      {...props}
    />
  ),
);
TextArea.displayName = "InputTextArea";
