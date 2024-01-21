// Copyright 2024 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { type UnaryClient, sendRequired } from "@synnaxlabs/freighter";
import { z } from "zod";

import {
  moduleKeyZ,
  moduleZ,
  rackKeyZ,
  rackZ,
  type RackPayload,
  type ModulePayload,
  DevicePayload,
  deviceZ,
} from "@/hardware/writer";

const retrieveRackReqZ = z.object({
  keys: rackKeyZ.array(),
});

const retrieveRackResZ = z.object({
  racks: rackZ.array(),
});

const retrieveModuleReqZ = z.object({
  rack: rackKeyZ,
  keys: z.string().array(),
});

const retrieveModuleResZ = z.object({
  modules: moduleZ.array(),
});

const retrieveDeviceReqZ = z.object({
  keys: z.string().array(),
});

const retrieveDeviceResZ = z.object({
  devices: deviceZ.array(),
});

const RETRIEVE_RACK_ENDPOINT = "/hardware/rack/retrieve";
const RETRIEVE_MODULE_ENDPOINT = "/hardware/module/retrieve";
const RETRIEVE_DEVICE_ENDPOINT = "/hardware/device/retrieve";

export class Retriever {
  private readonly client: UnaryClient;

  constructor(client: UnaryClient) {
    this.client = client;
  }

  async retrieveRacks(keys: number[]): Promise<RackPayload[]> {
    const res = await sendRequired<typeof retrieveRackReqZ, typeof retrieveRackResZ>(
      this.client,
      RETRIEVE_RACK_ENDPOINT,
      { keys },
      retrieveRackResZ,
    );
    return res.racks;
  }

  async retrieveDevices(keys: string[]): Promise<DevicePayload[]> {
    const res = await sendRequired<typeof retrieveDeviceReqZ, typeof retrieveDeviceResZ>(
      this.client,
      RETRIEVE_DEVICE_ENDPOINT,
      { keys },
      retrieveDeviceResZ,
    );
    return res.devices;
  }

  async retrieveModules(rack: number = 0, keys: bigint[] = []): Promise<ModulePayload[]> {
    const res = await sendRequired<
      typeof retrieveModuleReqZ,
      typeof retrieveModuleResZ
    >(this.client, RETRIEVE_MODULE_ENDPOINT, { 
      rack, 
      keys: keys.map((k) => k.toString()),
    }, retrieveModuleResZ);
    return res.modules;
  }
}
