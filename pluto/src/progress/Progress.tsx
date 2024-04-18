// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { type ReactElement } from "react";

import { CSS } from "@/css";

import "@/progress/Progress.css";

interface ProgressProps {
  value: number;
}

export const Progress = ({ value }: ProgressProps): ReactElement => {
  return (
    <div className={CSS.B("progress")}>
      <div className={CSS.B("progress-bar")} style={{ width: `${value}%` }} />
    </div>
  );
};
