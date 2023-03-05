// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { useState } from "react";

import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AiOutlineAim } from "react-icons/ai";
import { describe, expect, it, vitest } from "vitest";

import { Button } from ".";

describe("Button", () => {
  describe("Default", () => {
    it("should render a button with the provided text", () => {
      const c = render(<Button size="small">Hello</Button>);
      expect(c.getByText("Hello")).toBeTruthy();
    });
  });
  describe("Icon", () => {
    it("should render a button with the provided icon", () => {
      const c = render(
        <Button.Icon size="small">
          <AiOutlineAim aria-label="icon" />
        </Button.Icon>
      );
      expect(c.getByLabelText("icon")).toBeTruthy();
    });
  });
  describe("Link", () => {
    it("should render a link with the provided text", () => {
      const c = render(<Button.Link size="small">Hello</Button.Link>);
      expect(c.getByText("Hello")).toBeTruthy();
    });
  });
  describe("Toggle", () => {
    it("should a button that can be toggled", async () => {
      const onChange = vitest.fn();
      const ToggleTest = (): JSX.Element => {
        const [value, setValue] = useState(false);
        return (
          <Button.Toggle
            size="small"
            value={value}
            onChange={() => {
              onChange();
              setValue(!value);
            }}
          >
            Hello
          </Button.Toggle>
        );
      };
      const c = render(<ToggleTest />);
      const label = c.getByText("Hello");
      expect(label).toBeTruthy();
      const button = label.parentElement as HTMLElement;
      expect(button).toBeTruthy();
      expect(button.className).not.toContain("checked");
      await userEvent.click(label);
      expect(onChange).toHaveBeenCalled();
      expect(button.className).toContain("checked");
    });
  });
});
