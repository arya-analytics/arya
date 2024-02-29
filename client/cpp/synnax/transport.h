// Copyright 2024 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

#pragma once

/// internal
#include "synnax/framer/framer.h"
#include "synnax/channel/channel.h"
#include "synnax/ranger/ranger.h"
#include "synnax/auth/auth.h"
#include "synnax/device/device.h"

class Transport {
public:
    Transport(
            uint16_t port,
            const std::string &ip,
            const std::string &ca_cert_file,
            const std::string &client_cert_file,
            const std::string &client_key_file
    );

    void use(const std::shared_ptr<freighter::Middleware>&) const;

    std::unique_ptr<AuthLoginClient> auth_login;
    std::unique_ptr<StreamerClient> frame_stream;
    std::unique_ptr<WriterClient> frame_write;
    std::unique_ptr<ChannelCreateClient> chan_create;
    std::unique_ptr<ChannelRetrieveClient> chan_retrieve;
    std::unique_ptr<RangeRetrieveClient> range_retrieve;
    std::unique_ptr<RangeCreateClient> range_create;
    std::shared_ptr<RangeKVDeleteClient> range_kv_delete;
    std::shared_ptr<RangeKVGetClient> range_kv_get;
    std::shared_ptr<RangeKVSetClient> range_kv_set;
    std::unique_ptr<RangeSetActiveClient> range_set_active;
    std::unique_ptr<RangeRetrieveActiveClient> range_retrieve_active;
    std::unique_ptr<RangeClearActiveClient> range_clear_active;
    std::unique_ptr<DeviceCreateRackClient> rack_create_client;
    std::unique_ptr<DeviceRetrieveRackClient> rack_retrieve;
    std::unique_ptr<DeviceDeleteRackClient> rack_delete;
    std::shared_ptr<DeviceCreateModuleClient> module_create;
    std::shared_ptr<DeviceRetrieveModuleClient> module_retrieve;
    std::shared_ptr<DeviceDeleteModuleClient> module_delete;
};
