// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

/// std
#include <string>
#include <random>

/// GTest
#include <include/gtest/gtest.h>

/// internal.
#include "synnax/synnax.h"
#include "synnax/testutil/testutil.h"
#include "synnax/errors/errors.h"


std::mt19937 mt = random_generator(std::move("Ranger Tests"));

/// @brief it should create a new range and assign it a non-zero key.
TEST(RangerTests, testCreate) {
    auto client = new_test_client();
    auto [range, err] = client.ranges.create(
            "test",
            synnax::TimeRange(
                    synnax::TimeStamp(10),
                    synnax::TimeStamp(100)
            )
    );
    ASSERT_FALSE(err);
    ASSERT_EQ(range.name, "test");
    ASSERT_FALSE(range.key.length() == 0);
    ASSERT_EQ(range.time_range.start, synnax::TimeStamp(10));
    ASSERT_EQ(range.time_range.end, synnax::TimeStamp(100));
}

/// @brief it should retrieve a range by its key.
TEST(RangerTests, testRetrieveByKey) {
    auto client = new_test_client();
    auto [range, err] = client.ranges.create(
            "test",
            synnax::TimeRange(
                    synnax::TimeStamp(30),
                    synnax::TimeStamp(100)
            )
    );
    ASSERT_FALSE(err);
    auto [got, err2] = client.ranges.retrieveByKey(range.key);
    ASSERT_FALSE(err2) << err2.message();
    ASSERT_EQ(got.name, "test");
    ASSERT_FALSE(got.key.length() == 0);
    ASSERT_EQ(got.time_range.start, synnax::TimeStamp(30));
    ASSERT_EQ(got.time_range.end, synnax::TimeStamp(100));
}

/// @brief it should retrieve a range by its name.
TEST(RangerTests, testRetrieveByName) {
    auto client = new_test_client();
    auto rand_name = std::to_string(mt());
    auto [range, err] = client.ranges.create(
            rand_name,
            synnax::TimeRange(
                    synnax::TimeStamp(10),
                    synnax::TimeStamp(100)
            )
    );
    ASSERT_FALSE(err);
    auto [got, err2] = client.ranges.retrieveByName(rand_name);
    ASSERT_FALSE(err2);
    ASSERT_EQ(got.name, rand_name);
    ASSERT_FALSE(got.key.length() == 0);
    ASSERT_EQ(got.time_range.start, synnax::TimeStamp(10));
    ASSERT_EQ(got.time_range.end, synnax::TimeStamp(100));
}

/// @brief test retrieve by name not found
TEST(RangerTests, testRetrieveByNameNotFound) {
    auto client = new_test_client();
    auto [got, err] = client.ranges.retrieveByName("not_found");
    ASSERT_TRUE(err);
    ASSERT_EQ(err.type, synnax::NO_RESULTS);
}

/// @brief it should retrieve multiple ranges by their names.
TEST(RangerTests, testRetrieveMultipleByName) {
    auto client = new_test_client();
    auto rand_name = std::to_string(mt());
    auto [range, err] = client.ranges.create(
            rand_name,
            synnax::TimeRange(
                    synnax::TimeStamp(30),
                    synnax::TimeStamp(100)
            )
    );
    ASSERT_FALSE(err);
    auto [range2, err2] = client.ranges.create(
            rand_name,
            synnax::TimeRange(
                    synnax::TimeStamp(30),
                    synnax::TimeStamp(100)
            )
    );
    ASSERT_FALSE(err2);
    auto [got, err3] = client.ranges.retrieveByName(std::vector<std::string>{rand_name});
    ASSERT_FALSE(err3);
    ASSERT_EQ(got.size(), 2);
    ASSERT_EQ(got[0].name, rand_name);
    ASSERT_FALSE(got[0].key.length() == 0);
    ASSERT_EQ(got[0].time_range.start, synnax::TimeStamp(30));
    ASSERT_EQ(got[0].time_range.end, synnax::TimeStamp(100));
    ASSERT_EQ(got[1].name, rand_name);
    ASSERT_FALSE(got[1].key.length() == 0);
    ASSERT_EQ(got[1].time_range.start, synnax::TimeStamp(30));
    ASSERT_EQ(got[1].time_range.end, synnax::TimeStamp(100));
}

/// @brief it should retrieve multiple ranges by their keys.
TEST(RangerTests, testRetrieveMultipleByKey) {
    auto client = new_test_client();
    auto tr = synnax::TimeRange(
            synnax::TimeStamp(10 * synnax::SECOND),
            synnax::TimeStamp(100 * synnax::SECOND)
    );
    auto [range, err] = client.ranges.create("test", tr);
    ASSERT_FALSE(err) << err.message();
    auto [range2, err2] = client.ranges.create("test2", tr);
    ASSERT_FALSE(err2) << err2.message();
    auto [got, err3] = client.ranges.retrieveByKey(std::vector<std::string>{range.key, range2.key});
    ASSERT_FALSE(err3) << err3.message();
    ASSERT_EQ(got.size(), 2);
    ASSERT_EQ(got[0].name, "test");
    ASSERT_FALSE(got[0].key.length() == 0);
    ASSERT_EQ(got[0].time_range.start, synnax::TimeStamp(10 * synnax::SECOND));
    ASSERT_EQ(got[0].time_range.end, synnax::TimeStamp(100 * synnax::SECOND));
    ASSERT_EQ(got[1].name, "test2");
    ASSERT_FALSE(got[1].key.length() == 0);
    ASSERT_EQ(got[1].time_range.start, synnax::TimeStamp(10 * synnax::SECOND));
    ASSERT_EQ(got[1].time_range.end, synnax::TimeStamp(100 * synnax::SECOND));
}


/// @brief it should set a key-value pair on the range.
TEST(RangerTests, testSet) {
    auto client = new_test_client();
    auto [range, err] = client.ranges.create(
            "test",
            synnax::TimeRange(
                    synnax::TimeStamp(30),
                    synnax::TimeStamp(100)
            )
    );
    ASSERT_FALSE(err);
    err = range.kv.set("test", "test");
    ASSERT_FALSE(err);
}

/// @brief it should get a key-value pair on the range.
TEST(RangerTests, testGet) {
    auto client = new_test_client();
    auto [range, err] = client.ranges.create(
            "test",
            synnax::TimeRange(
                    synnax::TimeStamp(30),
                    synnax::TimeStamp(100)
            )
    );
    ASSERT_FALSE(err) << err.message();
    err = range.kv.set("test", "test");
    ASSERT_FALSE(err) << err.message();
    auto [val, err2] = range.kv.get("test");
    ASSERT_FALSE(err2) << err2.message();
    ASSERT_EQ(val, "test");
}

/// @brief it should retrieve a key-value pair from a retrieved range.
TEST(RangerTests, testGetFromRetrieved) {
    auto client = new_test_client();
    auto [range, err] = client.ranges.create(
            "test",
            synnax::TimeRange(
                    synnax::TimeStamp(30),
                    synnax::TimeStamp(100)
            )
    );
    ASSERT_FALSE(err) << err.message();
    err = range.kv.set("test", "test");
    ASSERT_FALSE(err) << err.message();
    auto [got, err2] = client.ranges.retrieveByKey(range.key);
    ASSERT_FALSE(err2) << err2.message();
    auto [val, err3] = got.kv.get("test");
    ASSERT_FALSE(err3) << err3.message();
    ASSERT_EQ(val, "test");
}


/// @brief it should delete a key-value pair on the range.
TEST(RangerTests, testKVDeelete) {
    auto client = new_test_client();
    auto [range, err] = client.ranges.create(
            "test",
            synnax::TimeRange(
                    synnax::TimeStamp(30),
                    synnax::TimeStamp(10 * synnax::SECOND)
            )
    );
    ASSERT_FALSE(err);
    err = range.kv.set("test", "test");
    ASSERT_FALSE(err);
    err = range.kv.del("test");
    ASSERT_FALSE(err);
    auto [val, err2] = range.kv.get("test");
    ASSERT_TRUE(err2) << err2.message();
    ASSERT_EQ(val, "");
}

/// @brief it should set a created range as the active range.
TEST(RangerTests, testSetActive) {
    auto client = new_test_client();
    auto [range, err] = client.ranges.create(
            "test",
            synnax::TimeRange(
                    synnax::TimeStamp(30),
                    synnax::TimeStamp(10 * synnax::SECOND)
            )
    );
    ASSERT_FALSE(err);
    err = client.ranges.setActive(range.key);
    ASSERT_FALSE(err);
    auto [got, err2] = client.ranges.retrieveActive();
    ASSERT_FALSE(err2);
    ASSERT_EQ(got.name, "test");
    ASSERT_FALSE(got.key.length() == 0);
    ASSERT_EQ(got.time_range.start, synnax::TimeStamp(30));
    ASSERT_EQ(got.time_range.end, synnax::TimeStamp(10 * synnax::SECOND));
}

/// @brief it should clear the active range.
TEST(RangerTests, testClearActive) {
    auto client = new_test_client();
    auto [range, err] = client.ranges.create(
            "test",
            synnax::TimeRange(
                    synnax::TimeStamp(30),
                    synnax::TimeStamp(10 * synnax::SECOND)
            )
    );
    ASSERT_FALSE(err);
    err = client.ranges.setActive(range.key);
    ASSERT_FALSE(err);
    err = client.ranges.clearActive();
    ASSERT_FALSE(err);
    auto [got, err2] = client.ranges.retrieveActive();
    ASSERT_TRUE(err2);
    ASSERT_EQ(err2.type, synnax::NO_RESULTS);
}