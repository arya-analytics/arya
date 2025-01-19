import { channel, type task } from "@synnaxlabs/client";
import { z } from "zod";

export const SEQUENCE_TYPE = "sequence";
export type SequenceType = typeof SEQUENCE_TYPE;

export const configZ = z.object({
  rate: z.number(),
  readFrom: z.array(channel.keyZ),
  writeTo: z.array(channel.keyZ),
  script: z.string(),
});

export type Config = z.infer<typeof configZ>;

export const ZERO_CONFIG: Config = {
  rate: 0,
  readFrom: [],
  writeTo: [],
  script: "",
};

export const stateDetailsZ = z.object({
  running: z.boolean(),
});

export type StateDetails = z.infer<typeof stateDetailsZ>;

export type Task = task.Task<Config, StateDetails, "sequence">;
export type Payload = task.Payload<Config, StateDetails, "sequence">;

export const ZERO_PAYLOAD: Payload = {
  key: "",
  name: "Sequence Task",
  config: ZERO_CONFIG,
  type: SEQUENCE_TYPE,
};
