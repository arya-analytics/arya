// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { type ReactElement, useState } from "react";

import type { Meta } from "@storybook/react";
import { type channel } from "@synnaxlabs/client";

import { SelectSingle, SelectMultiple } from "./Select";

const story: Meta<typeof SelectMultiple> = {
  title: "Channel Select",
  component: SelectMultiple,
};

export const Multiple = (): ReactElement => {
  const [value, setValue] = useState<channel.Key[]>([]);
  const [value2, setValue2] = useState<channel.Key[]>([]);
  return (
    <>
      <SelectMultiple value={value} onChange={setValue} />
      <SelectMultiple value={value2} onChange={setValue2} />
    </>
  );
};

export const Default = (): ReactElement => {
  const [value, setValue] = useState<channel.Key>(0);
  return <SelectSingle value={value} onChange={setValue} />;
};

// eslint-disable-next-line import/no-default-export
export default story;
