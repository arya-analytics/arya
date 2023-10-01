#  Copyright 2023 Synnax Labs, Inc.
#
#  Use of this software is governed by the Business Source License included in the file
#  licenses/BSL.txt.
#
#  As of the Change Date specified in that file, in accordance with the Business Source
#  License, use of this software will be governed by the Apache License, Version 2.0,
#  included in the file licenses/APL.txt.

import synnax as sy
import pandas as pd
import numpy as np
import time

client = sy.Synnax()

valve_en_time = client.channels.create(
    name="press_en_time",
    is_index=True,
    data_type=sy.DataType.TIMESTAMP,
)

valve_en_cmd_time = client.channels.create(
    name="press_en_cmd_time",
    is_index=True,
    data_type=sy.DataType.TIMESTAMP,
)

valve_en_cmd = client.channels.create(
    name="press_en_cmd",
    index=valve_en_cmd_time.key,
    data_type=sy.DataType.FLOAT32,
)

valve_en = client.channels.create(
    name="press_en",
    index=valve_en_time.key,
    data_type=sy.DataType.FLOAT32,
)


data_ch = client.channels.create(
    name="data",
    index=valve_en_time.key,
    data_type=sy.DataType.FLOAT32,
)

print(
    f"""
    Valve Enable Time Channel Key: {valve_en_time.key}
    Valve Enable Command Time Channel Key: {valve_en_cmd_time.key}
    Valve Enable Command Channel Key: {valve_en_cmd.key}
    Valve Enable Channel Key: {valve_en.key}
"""
)

rate = (sy.Rate.HZ * 20).period.seconds

i = 0
with client.new_streamer([valve_en_cmd.key]) as streamer:
    with client.new_writer(
        sy.TimeStamp.now(), [valve_en_time.key, valve_en.key, data_ch.key],
        name="DAQ"
    ) as writer:
        enabled = np.float32(0)
        press = 0
        while True:
            time.sleep(rate)
            if streamer.received:
                f = streamer.read()
                v = f[valve_en_cmd.key][0]
                print(f"Received valve enable command: {v}")
                enabled = v > 0.5
            if enabled:
                press += 10
            else:
                press -= 10
            ok = writer.write({
                    valve_en_time: sy.TimeStamp.now(),
                    valve_en: np.float32(enabled),
                    data_ch: np.float32(press),
            })
            i += 1
