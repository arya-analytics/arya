// Copyright 2024 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { type task } from "@synnaxlabs/client";
import { z } from "zod";

export const READ_TYPE = "opc_read";
export type ReadType = typeof READ_TYPE;

export type ReadChannelConfig = z.infer<typeof readChanZ>;

export const readStateDetails = z.object({
  running: z.boolean().optional().default(false),
  message: z.string().optional(),
});

export type ReadStateDetails = z.infer<typeof readStateDetails>;
export type ReadState = task.State<ReadStateDetails>;

export const readChanZ = z.object({
  key: z.string(),
  channel: z.number().min(1, "Channel must be specified"),
  nodeId: z.string().min(1, "Node ID must be specified"),
  enabled: z.boolean(),
});

export const readConfigZ = z
  .object({
    device: z.string().min(1, "Device must be specified"),
    sampleRate: z.number().min(1).max(10000),
    streamRate: z.number(),
    arrayMode: z.boolean(),
    arraySize: z.number().min(1),
    channels: z.array(readChanZ),
  })
  .refine(
    (cfg) => {
      if (cfg.arrayMode) return true;
      return cfg.sampleRate >= cfg.streamRate;
    },
    {
      message: "Sample rate must be greater than or equal to stream rate",
      path: ["sampleRate"],
    },
  )
  .refine(
    (cfg) => {
      if (!cfg.arrayMode) return true;
      return cfg.sampleRate >= cfg.arraySize;
    },
    {
      message: "Sample rate must be greater than or equal to the array size",
      path: ["sampleRate"],
    },
  )
  .refine(
    (cfg) => {
      if (cfg.arrayMode) return true;
      return cfg.streamRate > 0;
    },
    {
      message: "Stream rate must be greater than or equal to 1",
      path: ["streamRate"],
    },
  )
  // Error if channel ahs been duplicated
  .superRefine((cfg, ctx) => {
    const channels = new Map<number, number>();
    cfg.channels.forEach(({ channel }) =>
      channels.set(channel, (channels.get(channel) ?? 0) + 1),
    );
    cfg.channels.forEach(({ channel }, i) => {
      if (channel === 0 || (channels.get(channel) ?? 0) < 2) return;
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["channels", i, "channel"],
        message: "This channel has already been used elsewhere in the configuration",
      });
    });
  })
  // Warning if node ID is duplicated
  .superRefine((cfg, ctx) => {
    const nodeIds = new Map<string, number>();
    cfg.channels.forEach(({ nodeId }) =>
      nodeIds.set(nodeId, (nodeIds.get(nodeId) ?? 0) + 1),
    );
    cfg.channels.forEach(({ nodeId }, i) => {
      if (nodeId.length === 0 || (nodeIds.get(nodeId) ?? 0) < 2) return;
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["channels", i, "nodeId"],
        message: "This node ID has already been used elsewhere in the configuration",
        params: {
          variant: "warning",
        },
      });
    });
  });

export type ReadConfig = z.infer<typeof readConfigZ>;
export type Read = task.Task<ReadConfig, ReadStateDetails, ReadType>;
export type ReadPayload = task.Payload<ReadConfig, ReadStateDetails, ReadType>;
export const ZERO_READ_PAYLOAD: ReadPayload = {
  key: READ_TYPE,
  type: READ_TYPE,
  name: "OPC Read Task",
  config: {
    device: "",
    sampleRate: 50,
    streamRate: 25,
    arrayMode: false,
    arraySize: 1,
    channels: [],
  },
};

type NodeIdType = "Numeric" | "String" | "GUID" | "ByteString";

export interface NodeId {
  namespaceIndex: number;
  identifierType: NodeIdType;
  identifier: string | number; // Strings for String, GUID, and ByteString types, number for Numeric
}

export const parseNodeId = (nodeIdStr: string): NodeId | null => {
  const regex = /NS=(\d+);(I|S|G|B)=(.+)/;
  const match = nodeIdStr.match(regex);

  if (match === null) return null;

  const namespaceIndex = parseInt(match[1], 10);
  const typeCode = match[2];
  const identifier = match[3];

  let identifierType: NodeIdType;

  switch (typeCode) {
    case "I":
      identifierType = "Numeric";
      return {
        namespaceIndex,
        identifierType,
        identifier: parseInt(identifier, 10),
      };
    case "S":
      identifierType = "String";
      break;
    case "G":
      identifierType = "GUID";
      break;
    case "B":
      identifierType = "ByteString";
      break;
    default:
      return null;
  }

  return { namespaceIndex, identifierType, identifier };
};

export const nodeIdToString = (nodeId: NodeId): string => {
  const prefix = `NS=${nodeId.namespaceIndex};`;
  switch (nodeId.identifierType) {
    case "Numeric":
      return `${prefix}I=${nodeId.identifier}`;
    case "String":
    case "GUID":
    case "ByteString":
      return `${prefix}${nodeId.identifierType.charAt(0)}=${nodeId.identifier}`;
  }
};
