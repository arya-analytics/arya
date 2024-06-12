// Copyright 2024 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

#include <include/gtest/gtest.h>
#include "client/cpp/synnax.h"
#include "x/go/telem/x/go/telem/telem.pb.h"
#include <iostream>

///// @brief create basic int series.
TEST(TestSeries, testConstruction) {
    const std::vector<uint8_t> vals = {1, 2, 3, 4, 5};
    const synnax::Series s{vals};
    ASSERT_EQ(s.data_type, synnax::UINT8);
    const auto v = s.values<std::uint8_t>();
    ASSERT_EQ(v.size(), vals.size());
    for (size_t i = 0; i < vals.size(); i++)
        ASSERT_EQ(v[i], vals[i]);
}

//// @brief it should correctly initialize and parse a string series.
TEST(TestSeries, testStringVectorConstruction) {
    const std::vector<std::string> vals = {"hello", "world"};
    const Series s{vals};
    ASSERT_EQ(s.data_type, synnax::STRING);
    ASSERT_EQ(s.size, 2);
    ASSERT_EQ(s.byteSize(), 12);
    const auto v = s.string();
    for (size_t i = 0; i < vals.size(); i++)
        ASSERT_EQ(v[i], vals[i]);
}

TEST(TestSeries, testStringConstruction) {
    const std::string val = "hello";
    const Series s{val};
    ASSERT_EQ(s.data_type, synnax::STRING);
    ASSERT_EQ(s.size, 1);
    ASSERT_EQ(s.byteSize(), 6);
    const auto v = s.string();
    ASSERT_EQ(v[0], val);
}

//// @brief it should correctly serialize and deserialize the series from protoubuf.
TEST(TestSeries, testProto) {
    const std::vector<uint8_t> vals = {1, 2, 3, 4, 5};
    const Series s{vals};
    const auto s2 = new telem::PBSeries();
    s.to_proto(s2);
    const Series s3{*s2};
    const auto v = s3.values<std::uint8_t>();
    for (size_t i = 0; i < vals.size(); i++)
        ASSERT_EQ(v[i], vals[i]);
    delete s2;
}

/// @brief it should correctly return the value at a particular index for a fixed
/// density data type.
TEST(TestSeries, testAtFixed) {
    const std::vector<uint8_t> vals = {1, 2, 3, 4, 5};
    const Series s{vals};
    ASSERT_EQ(s.at<uint8_t>(0), 1);
    ASSERT_EQ(s.at<uint8_t>(1), 2);
    ASSERT_EQ(s.at<uint8_t>(2), 3);
    ASSERT_EQ(s.at<uint8_t>(3), 4);
    ASSERT_EQ(s.at<uint8_t>(4), 5);
}

/// @brief it should correclty return the value at a particular index for a variable
/// length data type.
TEST(TestSeries, testAtVar) {
    const std::vector<std::string> vals = {"hello", "world"};
    const Series s{vals};
    std::string value;
    s.at(0, value);
    ASSERT_EQ(value, "hello");
    s.at(1, value);
    ASSERT_EQ(value, "world");
}

TEST(TestSeries, testAllocation) {
    const Series s{synnax::UINT32, 5};
    ASSERT_EQ(s.data_type, synnax::UINT32);
    ASSERT_EQ(s.size, 0);
    ASSERT_EQ(s.cap, 5);
    ASSERT_EQ(s.byteSize(), 0);
    ASSERT_EQ(s.byteCap(), 20);
}

TEST(TestSeries, testWrite) {
    Series s{synnax::UINT32, 5};
    std::uint32_t value = 1;
    ASSERT_EQ(s.write(value), 1);
    value++;
    ASSERT_EQ(s.write(value), 1);
    value++;
    ASSERT_EQ(s.write(value), 1);
    value++;
    ASSERT_EQ(s.write(value), 1);
    value++;
    ASSERT_EQ(s.write(value), 1);
    value++;
    ASSERT_EQ(s.write(value), 0);
    ASSERT_EQ(s.size, 5);
    ASSERT_EQ(s.at<std::uint32_t>(0), 1);
    ASSERT_EQ(s.at<std::uint32_t>(1), 2);
    ASSERT_EQ(s.at<std::uint32_t>(2), 3);
    ASSERT_EQ(s.at<std::uint32_t>(3), 4);
    ASSERT_EQ(s.at<std::uint32_t>(4), 5);
}

TEST(TestSeries, testWriteVector) {
    Series s{synnax::FLOAT32, 5};
    const std::vector<float> values = {1.0, 2.0, 3.0, 4.0, 5.0};
    ASSERT_EQ(s.write(values), 5);
    ASSERT_EQ(s.write(values), 0);
    ASSERT_EQ(s.size, 5);
    const auto v = s.values<float>();
    ASSERT_EQ(s.at<float>(1), 2.0);
    for (size_t i = 0; i < values.size(); i++)
        ASSERT_EQ(v[i], values[i]);
}
