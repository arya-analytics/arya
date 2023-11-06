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

namespace synnax {
const std::string ERROR_PREFIX = "sy.api.";
const std::string VALIDATION_ERROR = ERROR_PREFIX + "validation";
const std::string QUERY_ERROR = ERROR_PREFIX + "query";
const std::string MULTIPLE_RESULTS = QUERY_ERROR + ".multiple_results";
const std::string NO_RESULTS = QUERY_ERROR + ".no_results";
}
