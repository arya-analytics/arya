// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { TimeSpan, TimeStamp } from "@synnaxlabs/x/telem";
import { URL } from "@synnaxlabs/x/url";
import { z } from "zod";

import { auth } from "@/auth";
import { channel } from "@/channel";
import { connection } from "@/connection";
import { errorsMiddleware } from "@/errors";
import { framer } from "@/framer";
import { hardware } from "@/hardware";
import { device } from "@/hardware/device";
import { rack } from "@/hardware/rack";
import { task } from "@/hardware/task";
import { label } from "@/label";
import { ontology } from "@/ontology";
import { ranger } from "@/ranger";
import { Transport } from "@/transport";
import { workspace } from "@/workspace";

export const synnaxPropsZ = z.object({
  host: z
    .string({
      required_error: "Host is required",
    })
    .min(1, "Host is required"),
  port: z
    .number({
      required_error: "Port is required",
    })
    .or(
      z.string({
        required_error: "Port is required",
      }),
    ),
  username: z.string().optional(),
  password: z.string().optional(),
  connectivityPollFrequency: TimeSpan.z.default(TimeSpan.seconds(30)),
  secure: z.boolean().optional().default(false),
  name: z.string().optional(),
});

export type SynnaxProps = z.input<typeof synnaxPropsZ>;
export type ParsedSynnaxProps = z.output<typeof synnaxPropsZ>;

/**
 * Client to perform operations against a Synnax cluster.
 *
 * @property channel - Channel client for creating and retrieving channels.
 * @property data - Data client for reading and writing telemetry.
 * @property connectivity - Client for retrieving connectivity information.
 * @property ontology - Client for querying the cluster's ontology.
 */
export default class Synnax extends framer.Client {
  readonly createdAt: TimeStamp;
  readonly props: ParsedSynnaxProps;
  readonly ranges: ranger.Client;
  readonly channels: channel.Client;
  readonly auth: auth.Client | undefined;
  readonly connectivity: connection.Checker;
  readonly ontology: ontology.Client;
  readonly workspaces: workspace.Client;
  readonly labels: label.Client;
  readonly hardware: hardware.Client;
  static readonly connectivity = connection.Checker;
  private readonly transport: Transport;

  /**
   * @param props.host - Hostname of a node in the cluster.
   * @param props.port - Port of the node in the cluster.
   * @param props.username - Username for authentication. Not required if the
   * cluster is insecure.
   * @param props.password - Password for authentication. Not required if the
   * cluster is insecure.
   * @param props.connectivityPollFrequency - Frequency at which to poll the
   * cluster for connectivity information. Defaults to 5 seconds.
   * @param props.secure - Whether to connect to the cluster using TLS. The cluster
   * must be configured to support TLS. Defaults to false.
   *
   * A Synnax client must be closed when it is no longer needed. This will stop
   * the client from polling the cluster for connectivity information.
   */
  constructor(props_: SynnaxProps) {
    const props = synnaxPropsZ.parse(props_);
    const { host, port, username, password, connectivityPollFrequency, secure } = props;
    const transport = new Transport(new URL({ host, port: Number(port) }), secure);
    transport.use(errorsMiddleware);
    let auth_: auth.Client | undefined;
    if (username != null && password != null) {
      const auth_ = new auth.Client(transport.unary, {
        username,
        password,
      });
      transport.use(auth_.middleware());
    }
    const chRetriever = new channel.CacheRetriever(
      new channel.ClusterRetriever(transport.unary),
    );
    const chCreator = new channel.Writer(transport.unary);
    super(transport.stream, chRetriever);
    this.createdAt = TimeStamp.now();
    this.props = props;
    this.auth = auth_;
    this.transport = transport;
    this.channels = new channel.Client(this, chRetriever, transport.unary, chCreator);
    this.connectivity = new connection.Checker(
      transport.unary,
      connectivityPollFrequency,
      props.name,
    );
    this.ontology = new ontology.Client(transport.unary, this);
    const rangeWriter = new ranger.Writer(this.transport.unary);
    this.labels = new label.Client(this.transport.unary, this);
    this.ranges = new ranger.Client(
      this,
      rangeWriter,
      this.transport.unary,
      chRetriever,
      this.labels,
    );
    this.workspaces = new workspace.Client(this.transport.unary);
    const devices = new device.Client(this.transport.unary, this);
    const tasks = new task.Client(this.transport.unary, this);
    const racks = new rack.Client(this.transport.unary, this, tasks);
    this.hardware = new hardware.Client(tasks, racks, devices);
  }

  get key(): string {
    return this.createdAt.valueOf().toString();
  }

  close(): void {
    this.connectivity.stopChecking();
  }
}
