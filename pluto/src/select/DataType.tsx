// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { type ReactElement } from "react";

import { Case, DataType as TelemDataType } from "@synnaxlabs/x";

import { type List } from "@/list";

import { DropdownButton, type DropdownButtonProps } from "./Button";

interface ListEntry {
  key: string;
  name: string;
}

const DATA: ListEntry[] = TelemDataType.ALL.filter(
  (d) => d !== TelemDataType.UNKNOWN,
).map((d) => ({
  key: d.toString(),
  name: Case.capitalize(d.toString()),
}));

const COLUMNS: Array<List.ColumnSpec<string, ListEntry>> = [
  {
    key: "name",
    name: "Name",
  },
];

export interface DataTypeProps
  extends Omit<DropdownButtonProps<string, ListEntry>, "data" | "columns"> {}

export const DataType = (props: DataTypeProps): ReactElement => (
  <DropdownButton<string, ListEntry>
    {...props}
    data={DATA}
    columns={COLUMNS}
    tagKey="name"
  />
);
