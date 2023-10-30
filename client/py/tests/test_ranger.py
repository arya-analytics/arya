#  Copyright 2023 Synnax Labs, Inc.
#
#  Use of this software is governed by the Business Source License included in the file
#  licenses/BSL.txt.
#
#  As of the Change Date specified in that file, in accordance with the Business Source
#  License, use of this software will be governed by the Apache License, Version 2.0,
#  included in the file licenses/APL.txt.

import numpy as np
import pytest

import synnax as sy


@pytest.mark.ranger
class TestRangeClient:
    @pytest.fixture(scope="class")
    def two_ranges(self, client: sy.Synnax) -> list[sy.Range]:
        return client.ranges.create(
            [
                sy.Range(
                    name="test",
                    time_range=sy.TimeStamp.now().span_range(10 * sy.TimeSpan.SECOND),
                ),
                sy.Range(
                    name="test2",
                    time_range=sy.TimeStamp.now().span_range(30 * sy.TimeSpan.SECOND),
                ),
            ]
        )

    def test_create_single(self, client: sy.Synnax):
        """Should create a single valid range"""
        rng = client.ranges.create(
            name="test",
            time_range=sy.TimeStamp.now().span_range(10 * sy.TimeSpan.SECOND),
        )
        assert rng.name == "test"
        assert rng.key != ""

    def test_create_multiple(self, two_ranges: list[sy.Range]):
        """Should create multiple valid ranges"""
        assert len(two_ranges) == 2
        for rng in two_ranges:
            assert rng.name.startswith("test")
            assert rng.key != ""

    def test_retrieve_by_key(self, two_ranges: list[sy.Range], client: sy.Synnax):
        """Should retrieve a range by key"""
        rng = client.ranges.retrieve(two_ranges[0].key)
        assert rng.name == two_ranges[0].name
        assert rng.key == two_ranges[0].key

    def test_retrieve_by_name(self, two_ranges: list[sy.Range], client: sy.Synnax):
        """Should retrieve a range by name"""
        rng = client.ranges.retrieve([two_ranges[0].name])[0]
        assert rng.name == two_ranges[0].name

    def test_retrieve_by_name_not_found(
        self, two_ranges: list[sy.Range], client: sy.Synnax
    ):
        """Should raise an error when a range is not found"""
        with pytest.raises(sy.exceptions.QueryError):
            client.ranges.retrieve("not_found")

    def test_search(self, two_ranges: list[sy.Range], client: sy.Synnax):
        """Should search for ranges"""
        rng = client.ranges.search(two_ranges[0].name)
        assert len(rng) > 0


@pytest.mark.ranger
class TestRangeChannelResolution:
    @pytest.fixture(scope="class")
    def rng(self, client: sy.Synnax) -> sy.Range:
        name = f"test_{np.random.randint(0, 10000)}"
        return client.ranges.create(
            name=name,
            time_range=sy.TimeStamp.now().span_range(10 * sy.TimeSpan.SECOND),
        )

    @pytest.fixture(scope="class", autouse=True)
    def two_channels(self, client: sy.Synnax, rng: sy.Range) -> list[sy.Channel]:
        return client.channels.create(
            [
                sy.Channel(
                    name=f"{rng.name}_test1",
                    data_type=sy.DataType.FLOAT32,
                    rate=1 * sy.Rate.HZ,
                ),
                sy.Channel(
                    name=f"{rng.name}_test2",
                    data_type=sy.DataType.FLOAT32,
                    rate=1 * sy.Rate.HZ,
                ),
            ]
        )

    def test_access_by_key(self, rng: sy.Range, two_channels: list[sy.Channel]):
        """Should access a channel by key"""
        assert rng[two_channels[0].key].key == two_channels[0].key

    def test_access_by_name(self, rng: sy.Range, two_channels: list[sy.Channel]):
        """Should access a channel by name"""
        assert rng[two_channels[0].name].name == two_channels[0].name

    def test_access_by_regex(self, rng: sy.Range, two_channels: list[sy.Channel]):
        """Should access a channel by regex"""
        channels = rng[f"{rng.name}_.*"]
        found = 0
        for ch in channels:
            found += 1
        assert found == 2


@pytest.mark.ranger
class TestRangeKV:
    def test_set_get_delete_single(self, client: sy.Synnax):
        rng = client.ranges.create(
            name="test",
            time_range=sy.TimeStamp.now().span_range(10 * sy.TimeSpan.SECOND),
        )
        rng.meta_data.set("test", "test")
        assert rng.meta_data.get("test") == "test"
        rng.meta_data.delete("test")
        with pytest.raises(sy.exceptions.QueryError):
            rng.meta_data.get("test")

    def test_set_get_delete_multiple(self, client: sy.Synnax):
        rng = client.ranges.create(
            name="test",
            time_range=sy.TimeStamp.now().span_range(10 * sy.TimeSpan.SECOND),
        )
        rng.meta_data.set({"test": "test", "test2": "test2"})
        assert rng.meta_data.get(["test", "test2"]) == {
            "test": "test",
            "test2": "test2",
        }
        rng.meta_data.delete(["test", "test2"])
        with pytest.raises(sy.exceptions.QueryError):
            rng.meta_data.get(["test", "test2"])


@pytest.mark.ranger
class TestRangeAlias:
    def test_basic_alias(self, client: sy.Synnax):
        ch = client.channels.create(
            name="test", data_type=sy.DataType.INT8, rate=1 * sy.Rate.HZ
        )
        rng = client.ranges.create(
            name="test",
            time_range=sy.TimeStamp.now().span_range(10 * sy.TimeSpan.SECOND),
        )
        rng.set_alias(ch.key, "alt_test")
        assert rng["alt_test"].key == ch.key
        assert rng["alt_test"].name == ch.name

    def test_alias_not_found(self, client: sy.Synnax):
        rng = client.ranges.create(
            name="test",
            time_range=sy.TimeStamp.now().span_range(10 * sy.TimeSpan.SECOND),
        )
        with pytest.raises(sy.exceptions.QueryError):
            rng["not_found"]

    def test_channel_not_found_on_set(self, client: sy.Synnax):
        rng = client.ranges.create(
            name="test",
            time_range=sy.TimeStamp.now().span_range(10 * sy.TimeSpan.SECOND),
        )
        with pytest.raises(sy.exceptions.QueryError):
            rng.set_alias("not_found", "test")
