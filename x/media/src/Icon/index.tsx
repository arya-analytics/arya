// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { FC } from "react";

import { OS } from "@synnaxlabs/x";
import {
  AiFillCaretDown,
  AiFillCaretLeft,
  AiFillCaretRight,
  AiFillCaretUp,
  AiFillDelete,
  AiFillFolder,
  AiFillInfoCircle,
  AiFillWarning,
  AiOutlineBorder,
  AiOutlineCheck,
  AiOutlineClose,
  AiOutlineMinus,
  AiOutlineExpand,
  AiFillGithub,
  AiFillLinkedin,
} from "react-icons/ai";
import { BsStack, BsLightbulbFill, BsShiftFill } from "react-icons/bs";
import {
  FaApple,
  FaBezierCurve,
  FaDiceD20,
  FaDocker,
  FaLinux,
  FaStream,
  FaWindows,
} from "react-icons/fa";
import { FiMenu } from "react-icons/fi";
import { GrPan } from "react-icons/gr";
import { HiDownload, HiLightningBolt, HiOutlinePlus } from "react-icons/hi";
import { IoMdRefresh } from "react-icons/io";
import { IoBookSharp, IoCopySharp, IoTime } from "react-icons/io5";
import {
  MdEdit,
  MdOutlineDeviceHub,
  MdQuestionMark,
  MdSensors,
  MdWorkspacesFilled,
  MdAreaChart,
  MdEditOff,
  MdOutlineAccessTimeFilled,
  MdKeyboardAlt,
  MdKeyboardArrowDown,
  MdKeyboardArrowLeft,
  MdKeyboardArrowRight,
  MdKeyboardArrowUp,
  MdKeyboardBackspace,
  MdKeyboardCapslock,
  MdKeyboardHide,
  MdKeyboardReturn,
  MdKeyboardTab,
  MdKeyboardCommandKey,
  MdKeyboardOptionKey,
  MdFiberManualRecord,
  MdInsights,
  MdLabel,
  MdSquareFoot,
  MdKeyboardControlKey,
} from "react-icons/md";
import { RiSettings3Fill as RiSettingsFill } from "react-icons/ri";
import { SiNpm, SiPnpm, SiPython, SiTypescript, SiYarn } from "react-icons/si";
import {
  TbZoomFilled,
  TbZoomReset,
  TbArrowRight,
  TbArrowDown,
  TbArrowLeft,
  TbArrowUp,
} from "react-icons/tb";

const IconOS: Record<OS, IconFC> = {
  Linux: FaLinux,
  MacOS: FaApple,
  Windows: FaWindows,
  Docker: FaDocker,
};

export const Icon: IconType = {
  Circle: MdFiberManualRecord,
  Edit: MdEdit,
  EditOff: MdEditOff,
  Add: HiOutlinePlus,
  Subtract: AiOutlineMinus,
  Copy: IoCopySharp,
  Close: AiOutlineClose,
  Info: AiFillInfoCircle,
  Warning: AiFillWarning,
  Check: AiOutlineCheck,
  Refresh: IoMdRefresh,
  Delete: AiFillDelete,
  Time: IoTime,
  Acquire: FaStream,
  Analyze: FaBezierCurve,
  Concepts: BsLightbulbFill,
  Visualize: MdAreaChart,
  Expand: AiOutlineExpand,
  Cluster: BsStack,
  Control: FaDiceD20,
  Caret: {
    Right: AiFillCaretRight,
    Left: AiFillCaretLeft,
    Up: AiFillCaretUp,
    Down: AiFillCaretDown,
  },
  Settings: RiSettingsFill,
  Reference: IoBookSharp,
  Bolt: HiLightningBolt,
  Download: HiDownload,
  Range: MdOutlineAccessTimeFilled,
  Node: MdOutlineDeviceHub,
  Channel: MdSensors,
  Resources: AiFillFolder,
  Group: AiFillFolder,
  Workspace: MdWorkspacesFilled,
  OS: IconOS,
  Box: AiOutlineBorder,
  Python: SiPython,
  Typescript: SiTypescript,
  NPM: SiNpm,
  PNPM: SiPnpm,
  Yarn: SiYarn,
  QuestionMark: MdQuestionMark,
  Menu: FiMenu,
  Logo: {
    Github: AiFillGithub,
    LinkedIn: AiFillLinkedin,
  },
  Arrow: {
    Right: TbArrowRight,
    Down: TbArrowDown,
    Up: TbArrowUp,
    Left: TbArrowLeft,
  },
  Keyboard: {
    Command: MdKeyboardCommandKey,
    Windows: FaWindows,
    Tab: MdKeyboardTab,
    Return: MdKeyboardReturn,
    Backspace: MdKeyboardBackspace,
    Capslock: MdKeyboardCapslock,
    Hide: MdKeyboardHide,
    Control: MdKeyboardControlKey,
    Arrow: {
      Up: MdKeyboardArrowUp,
      Down: MdKeyboardArrowDown,
      Left: MdKeyboardArrowLeft,
      Right: MdKeyboardArrowRight,
    },
    Alt: MdKeyboardAlt,
    Option: MdKeyboardOptionKey,
    Shift: BsShiftFill,
  },
  Tooltip: MdInsights,
  Annotate: MdLabel,
  Zoom: TbZoomFilled,
  Pan: GrPan,
  Rule: MdSquareFoot,
  ZoomReset: TbZoomReset,
};

type IconFC = FC<React.SVGProps<SVGSVGElement>>;

export interface IconType {
  Circle: IconFC;
  Edit: IconFC;
  EditOff: IconFC;
  Add: IconFC;
  Subtract: IconFC;
  Copy: IconFC;
  Close: IconFC;
  Info: IconFC;
  Warning: IconFC;
  Check: IconFC;
  Refresh: IconFC;
  Delete: IconFC;
  Time: IconFC;
  Acquire: IconFC;
  Analyze: IconFC;
  Concepts: IconFC;
  Expand: IconFC;
  Visualize: IconFC;
  Cluster: IconFC;
  Control: IconFC;
  Settings: IconFC;
  Caret: {
    Right: IconFC;
    Left: IconFC;
    Up: IconFC;
    Down: IconFC;
  };
  Arrow: {
    Right: IconFC;
    Left: IconFC;
    Up: IconFC;
    Down: IconFC;
  };
  Reference: IconFC;
  Bolt: IconFC;
  Download: IconFC;
  Range: IconFC;
  Node: IconFC;
  Channel: IconFC;
  Resources: IconFC;
  Group: IconFC;
  Workspace: IconFC;
  OS: Record<OS, IconFC>;
  Box: IconFC;
  Python: IconFC;
  Typescript: IconFC;
  NPM: IconFC;
  PNPM: IconFC;
  Yarn: IconFC;
  QuestionMark: IconFC;
  Menu: IconFC;
  Logo: {
    Github: IconFC;
    LinkedIn: IconFC;
  };
  Keyboard: {
    Command: IconFC;
    Windows: IconFC;
    Tab: IconFC;
    Return: IconFC;
    Backspace: IconFC;
    Capslock: IconFC;
    Hide: IconFC;
    Control: IconFC;
    Arrow: {
      Up: IconFC;
      Down: IconFC;
      Left: IconFC;
      Right: IconFC;
    };
    Alt: IconFC;
    Option: IconFC;
    Shift: IconFC;
  };
  Zoom: IconFC;
  Pan: IconFC;
  Tooltip: IconFC;
  Annotate: IconFC;
  Rule: IconFC;
  ZoomReset: IconFC;
}
