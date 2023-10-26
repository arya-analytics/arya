// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

/// GTest.
#include <gtest/gtest.h>

/// Local headers.
#include "synnax/telem/series.h"
#include "telempb/telem.pb.h"

/// std.
#include <iostream>

///// @brief create basic int series
TEST(TestSeries, testConstruction)
{
    std::vector<std::uint8_t> vals = {1, 2, 3, 4, 5};
    synnax::Series s{vals};
    ASSERT_EQ(s.getDataType(), synnax::UINT8);
    auto v = s.uint8();
    for (auto i = 0; i < vals.size(); i++) {
        ASSERT_EQ(v[i], vals[i]);
    }
}

//// @brief it should correctly serialize and deserialize the series from protoubuf
TEST(TestSeries, testProto)
{
    std::vector<std::uint8_t> vals = {1, 2, 3, 4, 5};
    synnax::Series s{vals};
    telempb::Series s2;
    s.to_proto(s2);
    synnax::Series s3{s2};
    auto v = s3.uint8();
    for (auto i = 0; i < vals.size(); i++) {
        ASSERT_EQ(v[i], vals[i]);
    }
}


