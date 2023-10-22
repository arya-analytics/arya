// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { type ComponentPropsWithoutRef, type ReactElement } from "react";

import { Color } from "@/color";
import { CSS } from "@/css";

import "@/vis/regulator/Regulator.css";

export interface RegulatorProps extends Omit<ComponentPropsWithoutRef<"svg">, "color"> {
  color?: Color.Crude;
  label?: string;
}

export const Regulator = ({
  color,
  className,
  ...props
}: RegulatorProps): ReactElement => {
  return (
    <svg
      width="100"
      height="138"
      viewBox="0 0 100 138"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="100" height="50" fill="white" />
      <g filter="url(#filter0_i_679_22)">
        <path
          d="M33.4147 64.7347C31.0593 63.6723 31.0594 60.3277 33.4147 59.2653L76.2665 39.9368C78.252 39.0412 80.5 40.4934 80.5 42.6715V81.3285C80.5 83.5066 78.252 84.9588 76.2665 84.0632L33.4147 64.7347Z"
          stroke="black"
          stroke-width="3"
        />
      </g>
      <line
        x1="29.5011"
        y1="62.9424"
        x2="31.5011"
        y2="10.9424"
        stroke="black"
        stroke-width="3"
      />
      <g filter="url(#filter1_i_679_22)">
        <path
          d="M27.2653 65.4147C28.3277 63.0593 31.6723 63.0594 32.7347 65.4147L52.0632 108.267C52.9588 110.252 51.5066 112.5 49.3285 112.5H10.6715C8.49336 112.5 7.04123 110.252 7.93679 108.267L27.2653 65.4147Z"
          stroke="black"
          stroke-width="3"
        />
      </g>
      <line
        x1="40.7631"
        y1="38.2914"
        x2="18.7631"
        y2="51.2914"
        stroke="black"
        stroke-width="3"
      />
      <line x1="31.5" y1="114" x2="31.5" y2="138" stroke="black" stroke-width="3" />
      <line
        x1="40.7631"
        y1="22.2914"
        x2="18.7631"
        y2="35.2914"
        stroke="black"
        stroke-width="3"
      />
      <line
        x1="40.7631"
        y1="30.2914"
        x2="18.7631"
        y2="43.2914"
        stroke="black"
        stroke-width="3"
      />
      <defs>
        <filter
          id="filter0_i_679_22"
          x="30.1482"
          y="38.1663"
          width="51.8518"
          height="51.6674"
          filterUnits="userSpaceOnUse"
          color-interpolation-filters="sRGB"
        >
          <feFlood flood-opacity="0" result="BackgroundImageFix" />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="BackgroundImageFix"
            result="shape"
          />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="4" />
          <feGaussianBlur stdDeviation="2" />
          <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
          />
          <feBlend mode="normal" in2="shape" result="effect1_innerShadow_679_22" />
        </filter>
        <filter
          id="filter1_i_679_22"
          x="6.16632"
          y="62.1482"
          width="47.6674"
          height="55.8518"
          filterUnits="userSpaceOnUse"
          color-interpolation-filters="sRGB"
        >
          <feFlood flood-opacity="0" result="BackgroundImageFix" />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="BackgroundImageFix"
            result="shape"
          />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="4" />
          <feGaussianBlur stdDeviation="2" />
          <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
          />
          <feBlend mode="normal" in2="shape" result="effect1_innerShadow_679_22" />
        </filter>
      </defs>
    </svg>
  );
};
