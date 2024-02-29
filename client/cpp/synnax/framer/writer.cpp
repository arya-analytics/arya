// Copyright 2024 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

/// std
#include <string>


/// api protos
#include "v1/framer.pb.h"

/// internal
#include "synnax/framer/framer.h"

const std::string WRITE_ENDPOINT = "/frame/write";

using namespace synnax;

/// @brief enumeration of possible writer commands.
enum WriterCommand : uint32_t {
    OPEN = 0,
    WRITE = 1,
    COMMIT = 2,
    ERROR = 3,
    SET_AUTHORITY = 4
};


std::pair<Writer, freighter::Error> FrameClient::openWriter(const WriterConfig &config) {
    auto [s, exc] = writer_client->stream(WRITE_ENDPOINT);
    if (exc) return {Writer(), exc};
    auto req = api::v1::FrameWriterRequest();
    req.set_command(OPEN);
    config.toProto(req.mutable_config());
    exc = s->send(req);
    if (exc) return {Writer(), exc};
    auto [_, recExc] = s->receive();
    return {Writer(std::move(s)), recExc};
}

Writer::Writer(std::unique_ptr<WriterStream> s): stream(std::move(s)) {}


void WriterConfig::toProto(api::v1::FrameWriterConfig *f) const {
    subject.to_proto(f->mutable_control_subject());
    f->set_start(start.value);
    for (auto &auth: authorities) f->add_authorities(auth);
    for (auto &ch: channels) f->add_keys(ch);
}

bool Writer::write(Frame fr) {
    assertOpen();
    if (err_accumulated) return false;
    api::v1::FrameWriterRequest req;
    req.set_command(WRITE);
    fr.toProto(req.mutable_frame());
    auto exc = stream->send(req);
    if (exc) err_accumulated = true;
    return !err_accumulated;
}

std::pair<synnax::TimeStamp, bool> Writer::commit() {
    assertOpen();
    if (err_accumulated) return {synnax::TimeStamp(), false};

    auto req = api::v1::FrameWriterRequest();
    req.set_command(COMMIT);
    auto exc = stream->send(req);
    if (exc) {
        err_accumulated = true;
        return {synnax::TimeStamp(0), false};
    }

    while (true) {
        auto [res, recExc] = stream->receive();
        if (recExc) {
            err_accumulated = true;
            return {synnax::TimeStamp(0), false};
        }
        if (res.command() == COMMIT) return {synnax::TimeStamp(res.end()), true};
    }
}

freighter::Error Writer::error() {
    assertOpen();

    auto req = api::v1::FrameWriterRequest();
    req.set_command(ERROR);
    auto exc = stream->send(req);
    if (exc) return exc;

    while (true) {
        auto [res, recExc] = stream->receive();
        if (recExc) return recExc;
        if (res.command() == ERROR) return {res.error()};
    }
}

freighter::Error Writer::close() {
    auto exc = stream->closeSend();
    if (exc) return exc;
    auto [_, recExc] = stream->receive();
    if (recExc.type == freighter::EOF_.type) return freighter::NIL;
    return recExc;
}


void Writer::assertOpen() const {
    if (closed)
        throw std::runtime_error("cannot call method on closed writer");
}
