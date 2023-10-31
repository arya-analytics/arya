#  Copyright 2023 Synnax Labs, Inc.
#
#  Use of this software is governed by the Business Source License included in the file
#  licenses/BSL.txt.
#
#  As of the Change Date specified in that file, in accordance with the Business Source
#  License, use of this software will be governed by the Apache License, Version 2.0,
#  included in the file licenses/APL.txt.

import random

import pytest

import synnax
from synnax import telem
from synnax.channel import Channel


@pytest.fixture(scope="session")
def client() -> synnax.Synnax:
    return synnax.Synnax(
        host="localhost",
        port=9090,
        username="synnax",
        password="seldon",
    )


@pytest.fixture
def channel(client: synnax.Synnax) -> Channel:
    return client.channels.create(
        name=f"test-{random.randint(0, 100000)}",
        leaseholder=1,
        rate=25 * telem.Rate.HZ,
        data_type=telem.DataType.FLOAT64,
    )
