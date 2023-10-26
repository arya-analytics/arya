// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

/// freighter
#include "freighter/gRPC/client.h"

/// protos and grpc
#include "v1/framer.pb.h"
#include "v1/framer.grpc.pb.h"
#include "v1/ranger.pb.h"
#include "v1/ranger.grpc.pb.h"
#include "v1/channel.pb.h"
#include "v1/channel.grpc.pb.h"
#include "v1/auth.pb.h"
#include "v1/auth.grpc.pb.h"
#include "google/protobuf/empty.pb.h"

/// internal
#include "synnax/transport.h"

using namespace api;

Transport::Transport(uint16_t port, const std::string &ip) {
    auto base_target = freighter::URL(ip, port, "").toString();
    auto pool = std::make_shared<GRPCPool>();

    auth_login = std::make_unique<GRPCUnaryClient<
            v1::LoginResponse,
            v1::LoginRequest,
            v1::AuthLoginService
    >>(pool, base_target);


    frame_stream = std::make_unique<GRPCStreamClient<
            v1::FrameStreamerResponse,
            v1::FrameStreamerRequest,
            v1::FrameStreamerService
    >>(pool, base_target);

    frame_write = std::make_unique<GRPCStreamClient<
            v1::FrameWriterResponse,
            v1::FrameWriterRequest,
            v1::FrameWriterService
    >>(pool, base_target);

    chan_create = std::make_unique<GRPCUnaryClient<
            v1::ChannelCreateResponse,
            v1::ChannelCreateRequest,
            v1::ChannelCreateService
    >>(pool, base_target);

    chan_retrieve = std::make_unique<GRPCUnaryClient<
            v1::ChannelRetrieveResponse,
            v1::ChannelRetrieveRequest,
            v1::ChannelRetrieveService
    >>(pool, base_target);

    range_retrieve = std::make_unique<GRPCUnaryClient<
            v1::RangeRetrieveResponse,
            v1::RangeRetrieveRequest,
            v1::RangeRetrieveService
    >>(pool, base_target);

    range_create = std::make_unique<GRPCUnaryClient<
            v1::RangeCreateResponse,
            v1::RangeCreateRequest,
            v1::RangeCreateService
    >>(pool, base_target);

    range_kv_delete = std::make_shared<GRPCUnaryClient<
            google::protobuf::Empty,
            v1::RangeKVDeleteRequest,
            v1::RangeKVDeleteService
    >>(pool, base_target);

    range_kv_get = std::make_shared<GRPCUnaryClient<
            v1::RangeKVGetResponse,
            v1::RangeKVGetRequest,
            v1::RangeKVGetService
    >>(pool, base_target);

    range_kv_set = std::make_shared<GRPCUnaryClient<
            google::protobuf::Empty,
            v1::RangeKVSetRequest,
            v1::RangeKVSetService
    >>(pool, base_target);
}

void Transport::use(std::shared_ptr<freighter::Middleware> mw) const {
    frame_stream->use(mw);
    frame_write->use(mw);
    chan_create->use(mw);
    chan_retrieve->use(mw);
    range_retrieve->use(mw);
    range_create->use(mw);
    range_kv_delete->use(mw);
    range_kv_get->use(mw);
    range_kv_set->use(mw);
}
