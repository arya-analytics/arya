// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

#pragma once

/// std
#include <numbers>
#include <string>

/// api protos
#include "v1/framer.pb.h"

namespace synnax {
typedef uint8_t Authority;

const Authority ABSOLUTE = 255;

struct Subject {
    std::string name;
    std::string key;

    void to_proto(api::v1::ControlSubject *s) const {
        s->set_name(name);
        s->set_key(key);
    }
};
}



