// Copyright 2024 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

#include <utility>
#include <memory>
#include <thread>
#include "glog/logging.h"
#include "driver/config/config.h"
#include "task.h"

task::Manager::Manager(
    Rack rack,
    const std::shared_ptr<Synnax> &client,
    std::unique_ptr<task::Factory> factory,
    breaker::Config breaker
) : rack_key(rack.key),
    internal(rack),
    ctx(std::make_shared<task::SynnaxContext>(client)),
    factory(std::move(factory)),
    breaker(std::move(breaker)) {
}

const std::string TASK_SET_CHANNEL = "sy_task_set";
const std::string TASK_DELETE_CHANNEL = "sy_task_delete";
const std::string TASK_CMD_CHANNEL = "sy_task_cmd";

freighter::Error task::Manager::start(std::atomic<bool> &done) {
    if(running) return freighter::NIL;
    LOG(INFO) << "[task.manager] starting up";
    const auto err = startGuarded();
    breaker.start();
    if (err) {
        if (err.matches(freighter::UNREACHABLE) && breaker.wait(err)) start(done);
        done = true;
        return err;
    }
    breaker.reset();
    running = true;
    run_thread = std::thread(&Manager::run, this, std::ref(done));
    return freighter::NIL;
}

freighter::Error task::Manager::startGuarded() {
    // Fetch info about the rack.
    auto [rack, rack_err] = ctx->client->hardware.retrieveRack(rack_key);
    if (rack_err) return rack_err;
    internal = rack;

    // Fetch task set channel.
    auto [task_set, task_set_err] = ctx->client->channels.retrieve(TASK_SET_CHANNEL);
    if (task_set_err) return task_set_err;
    task_set_channel = task_set;

    // Fetch task delete channel.
    auto [task_del, task_del_err] = ctx->client->channels.retrieve(TASK_DELETE_CHANNEL);
    if (task_del_err) return task_del_err;
    task_delete_channel = task_del;

    // Fetch task command channel.
    auto [task_cmd, task_cmd_err] = ctx->client->channels.retrieve(TASK_CMD_CHANNEL);
    task_cmd_channel = task_cmd;

    // Retrieve all of the tasks that are already configured and start them.
    LOG(INFO) << "[task.manager] pulling and configuring existing tasks from Synnax";
    auto [tasks, tasks_err] = rack.tasks.list();
    if (tasks_err) return tasks_err;
    for (const auto &task: tasks) {
        auto [driver_task, ok] = factory->configureTask(ctx, task);
        if (ok && driver_task != nullptr)
            this->tasks[task.key] = std::move(driver_task);
    }

    LOG(INFO) << "[task.manager] configuring initial tasks from factory";
    auto initial_tasks = factory->configureInitialTasks(ctx, this->internal);
    for (auto &[sy_task, task]: initial_tasks)
        this->tasks[sy_task.key] = std::move(task);

    return task_cmd_err;
}


void task::Manager::run(std::atomic<bool> &done) {
    const auto err = runGuarded();
    if (err.matches(freighter::UNREACHABLE) && breaker.wait(err)) return run(done);
    done = true;
    done.notify_all();
    run_err = err;
    LOG(INFO) << "[task.manager] run thread exiting";
}

freighter::Error task::Manager::stop() {
    if(!running) return freighter::NIL;
    if (!run_thread.joinable()) return freighter::NIL;
    running = false;
    streamer->closeSend();
    run_thread.join();
    for (auto &[key, task]: tasks) task->stop();
    tasks.clear();
    return run_err;
}

freighter::Error task::Manager::runGuarded() {
    const std::vector stream_channels = {
        task_set_channel.key, task_delete_channel.key, task_cmd_channel.key
    };
    auto [s, open_err] = ctx->client->telem.openStreamer(StreamerConfig{
        .channels = stream_channels
    });
    if (open_err) return open_err;
    streamer = std::make_unique<Streamer>(std::move(s));

    LOG(INFO) << "[task.manager] operational";
    // If we pass here it means we've re-gained network connectivity and can reset the breaker.
    breaker.reset();

    while (running) {
        auto [frame, read_err] = streamer->read();
        if (read_err) break;
        for (size_t i = 0; i < frame.size(); i++) {
            const auto &key = (*frame.channels)[i];
            const auto &series = (*frame.series)[i];
            if (key == task_set_channel.key) processTaskSet(series);
            else if (key == task_delete_channel.key) processTaskDelete(series);
            else if (key == task_cmd_channel.key) processTaskCmd(series);
        }
    }
    return streamer->close();
}

void task::Manager::processTaskSet(const Series &series) {
    auto keys = series.uint64();
    for (auto key: keys) {
        // If a module exists with this key, stop and remove it.
        auto task_iter = tasks.find(key);
        if (task_iter != tasks.end()) {
            task_iter->second->stop();
            tasks.erase(task_iter);
        }
        auto [sy_task, err] = internal.tasks.retrieve(key);
        if (err) {
            std::cerr << err.message() << std::endl;
            continue;
        }
        LOG(INFO) << "[task.manager] configuring task " << sy_task.name << " with key: " << key << ".";
        auto [driver_task, ok] = factory->configureTask(ctx, sy_task);
        if (ok && driver_task != nullptr) tasks[key] = std::move(driver_task);
        else LOG(ERROR) << "[task.manager] failed to configure task: " << sy_task.name;
    }
}

void task::Manager::processTaskCmd(const Series &series) {
    const auto commands = series.string();
    for (const auto &cmd_str: commands) {
        auto parser = config::Parser(cmd_str);
        auto cmd = task::Command(parser);
        if (!parser.ok()) {
            LOG(WARNING) << "[task.manager] failed to parse command: " << parser.error_json().dump();
            continue;
        }
        LOG(INFO) << "[task.manager] processing command " << cmd.type << " for task " << cmd.task;
        auto it = tasks.find(cmd.task);
        if (it == tasks.end()) {
            LOG(WARNING) << "[task.manager] could not find task to execute command: " << cmd.task;
            continue;
        }
        it->second->exec(cmd);
    }
}


void task::Manager::processTaskDelete(const Series &series) {
    const auto keys = series.uint64();
    for (auto key: keys) {
        const auto it = tasks.find(key);
        if (it != tasks.end()) {
            it->second->stop();
            tasks.erase(it);
        }
    }
}
