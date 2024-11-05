#  Copyright 2024 Synnax Labs, Inc.
#
#  Use of this software is governed by the Business Source License included in the file
#  licenses/BSL.txt.
#
#  As of the Change Date specified in that file, in accordance with the Business Source
#  License, use of this software will be governed by the Apache License, Version 2.0,
#  included in the file licenses/APL.txt.

import json
from contextlib import contextmanager

from pydantic import BaseModel, conint

from synnax.telem import TimeSpan, CrudeRate
from synnax.hardware.task import MetaTask, TaskPayload, Task


class Channel(BaseModel):
    """Configuration for a channel in an OPC UA read task. A list of these objects
    should be passed to the `channels` field of the `ReadConfig` constructor.
    """
    channel: int
    """The Synnax channel key that will be written to during acquisition."""
    node_id: str
    """The OPC UA node ID to read from."""
    enabled: bool = True
    """Whether acquisition for this channel is enabled."""
    use_as_index: bool = False
    """Whether to use the values of this channel to store index timestamps. If no
    channels are marked as index channels within the task, timestamps will be
    automatically generated by the Synnax OPC UA driver and written to the correct
    index channels."""


class ReadConfig(BaseModel):
    """Configuration for an OPC UA read task. This typically should not be instantiated
    directly, but rather indirectly through the `ReadTask` constructor."""
    device: str
    sample_rate: conint(ge=0, le=50000)
    stream_rate: conint(ge=0, le=50000)
    channels: list[Channel]
    array_mode: bool
    array_size: conint(ge=0)
    data_saving: bool


class ReadTask(MetaTask):
    """A read task for sampling data from OPC UA devices and writing the data to a
    Synnax cluster.

    :param device: The key of the Synnax OPC UA device to read from.
    :param name: A human-readable name for the task.
    :param sample_rate: The rate at which to sample data from the OPC UA device.
    :param stream_rate: The rate at which acquired data will be streamed to the Synnax
        cluster. For example, a sample rate of 100Hz and a stream rate of 25Hz will
        result in groups of 4 samples being streamed to the cluster every 40ms.
    :param array_mode: Whether to sample data in array mode. In array mode, the task
        will read array nodes from the OPC UA device with a consistent size (specified in
        array_size) and write the entire array to the Synnax cluster. This mode is
        far more efficient for collecting data at very high rates, but requires more
        careful setup. For more information,
        see https://docs.synnaxlabs.com/reference/device-drivers/opc-ua/read-task#default-sampling-vs-array-sampling.
    :param: array_size: The size of the array to read from the OPC UA device. This
        field is only relevant if array_mode is set to True.
    :param: channels: A list of Channel objects that specify which OPC UA nodes to read
        from and how to write the data to the Synnax cluster.
    """
    TYPE = "opc_read"
    config: ReadConfig
    _internal: Task

    def __init__(
        self,
        internal: Task | None = None,
        *,
        device: str = "",
        name: str = "",
        sample_rate: CrudeRate = 1000,
        stream_rate: CrudeRate = 1000,
        data_saving: bool = False,
        array_mode: bool = False,
        array_size: int = 0,
        channels: list[Channel] = None,
    ):
        if internal is not None:
            self._internal = internal
            self.config = ReadConfig.parse_obj(json.loads(internal.config))
            return
        self._internal = Task(name=name, type=self.TYPE)
        self.config = ReadConfig(
            device=device,
            sample_rate=sample_rate,
            stream_rate=stream_rate,
            data_saving=data_saving,
            array_mode=array_mode,
            array_size=array_size,
            channels=channels,
        )

    def to_payload(self) -> TaskPayload:
        pld = self._internal.to_payload()
        pld.config = json.dumps(self.config.dict())
        return pld

    @property
    def key(self) -> int:
        return self._internal.key

    @property
    def name(self):
        return self._internal.name

    def set_internal(self, task: Task):
        self._internal = task

    def start(self, timeout: float | TimeSpan = 5):
        """Starts the task and blocks until the Synnax cluster has acknowledged the
        command or the specified timeout has elapsed.

        :raises TimeoutError: If the timeout is reached before the Synnax cluster
            acknowledges the command.
        :raises Exception: If the Synnax cluster fails to start the task correctly.
        """
        self._internal.execute_command_sync("start", timeout=timeout)

    def stop(self, timeout: float | TimeSpan = 5):
        """Stops the task and blocks until the Synnax cluster has acknowledged the
        command or the specified timeout has elapsed.

        :raises TimeoutError: If the timeout is reached before the Synnax cluster
            acknowledges the command.
        :raises Exception: If the Synnax cluster fails to stop the task correctly.
        """
        self._internal.execute_command_sync("stop", timeout=timeout)

    @contextmanager
    def run(self, timeout: float | TimeSpan = 5):
        """Context manager that starts the task before entering the block and stops the
        task after exiting the block. This is useful for ensuring that the task is
        properly stopped even if an exception occurs during execution.
        """
        self.start(timeout)
        try:
            yield
        finally:
            self.stop(timeout)
