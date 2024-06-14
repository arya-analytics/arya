// Copyright 2024 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

#include <fstream>
#include <latch>
#include <glog/logging.h>
#include "nlohmann/json.hpp"
#include "driver/driver.h"

using json = nlohmann::json;

driver::Driver::Driver(
    Rack rack,
    const std::shared_ptr<Synnax> &client,
    std::unique_ptr<task::Factory> factory,
    const breaker::Config &breaker_config
): task_manager(rack, client, std::move(factory), breaker_config.child("task.manager")),
   heartbeat(rack.key, client, breaker_config.child("heartbeat")) {
}

const std::string VERSION = "0.1.0";

freighter::Error driver::Driver::run() {
    auto err = task_manager.start(done);
    if (err) return err;
    err = heartbeat.start(done);
    if (err) {
        task_manager.stop();
        return err;
    }
    LOG(INFO) << "[main] started successfully. waiting for shutdown";
    done.wait(false);
    heartbeat.stop();
    task_manager.stop();
    return freighter::NIL;
}

void driver::Driver::stop() {
    done = true;
    done.notify_all();
}
