// Copyright 2024 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

#pragma once

#include <string>
#include <vector>
#include <map>
#include <queue>
#include <utility>
#include <memory>
#include <atomic>
#include <thread>
#include <set>

#include "nidaqmx_api.h"
#include "daqmx.h"
#include "nisyscfg.h"
#include "client/cpp/synnax.h"
#include "driver/task/task.h"
#include "driver/pipeline/acquisition.h"
#include "driver/errors/errors.h"
#include "driver/breaker/breaker.h"
#include "driver/pipeline/control.h"
#include "nlohmann/json.hpp"
#include "driver/task/task.h"
#include "driver/config/config.h"
#include "driver/ni/error.h"
#include <condition_variable>
#include "ts_queue.h"
#include "driver/ni/scale.h"
#include "ai_channels.h"

namespace ni {
    typedef struct ChannelConfig {
        uint32_t channel_key;
        std::string name;
        std::string channel_type;
        std::shared_ptr<ni::Analog> ni_channel;
    } ChannelConfig;

    typedef struct ReaderConfig {
        std::string device_key;
        std::vector<ChannelConfig> channels;
        std::uint64_t sample_rate = 0;
        std::uint64_t stream_rate = 0;
        std::string device_name;
        std::string task_name;
        std::string timing_source; // for sample clock
        std::uint64_t period = 0;
        synnax::ChannelKey task_key;
        std::set<uint32_t> index_keys;
    } ReaderConfig;

    /////////////////////////////////////////////////////////////////////////////////////////////
    //                                                                                         //
    //                                     DAQ INTERFACES                                      //
    //                                                                                         //
    /////////////////////////////////////////////////////////////////////////////////////////////

    ///////////////////////////////////////////////////////////////////////////////////
    //                                    NiSource                                   //
    ///////////////////////////////////////////////////////////////////////////////////
    class Source : public pipeline::Source {
    public:
        explicit Source(TaskHandle task_handle,
                        const std::shared_ptr<task::Context> &ctx,
                        const synnax::Task task);


        int init();

        ~Source();

        void clearTask();

        int checkNIError(int32 error);

        void logError(std::string err_msg);

        std::vector<synnax::ChannelKey> getChannelKeys();

        virtual void parseConfig(config::Parser &parser);

        virtual freighter::Error start();

        virtual freighter::Error stop();

        virtual void stoppedWithErr(const freighter::Error &err) override;

        virtual bool ok();

        virtual void getIndexKeys();

        virtual std::pair<synnax::Frame, freighter::Error> read() = 0;

        virtual void parseChannels(config::Parser &parser) = 0;

        virtual int configureTiming() = 0;

        virtual void acquireData() = 0;

        virtual int createChannels() = 0;

        typedef struct DataPacket {
            void *data; // actual data
            uint64_t t0;  // initial timestamp
            uint64_t tf;  // final timestamp
            int32 samplesReadPerChannel;
        } DataPacket;
        TSQueue<DataPacket> data_queue;


        TaskHandle task_handle = 0;
        ReaderConfig reader_config;
        uint64_t numChannels = 0;
        int numSamplesPerChannel = 0;
        int bufferSize = 0;

        bool ok_state = true;
        json err_info;
        std::shared_ptr<task::Context> ctx;
        breaker::Breaker breaker;
        std::atomic<bool> running = false;
        std::thread sample_thread;
        synnax::Task task;
        uint32_t buffered_frames = 0;
    };

    ///////////////////////////////////////////////////////////////////////////////////
    //                                    AnalogReadSource                           //
    ///////////////////////////////////////////////////////////////////////////////////
    class AnalogReadSource : public Source {
    public:
        explicit AnalogReadSource(
                TaskHandle task_handle,
                const std::shared_ptr<task::Context> &ctx,
                const synnax::Task task
        ) : Source(task_handle, ctx, task) {}

        std::pair<synnax::Frame, freighter::Error> read() override;

        void acquireData() override;

        int configureTiming() override;

        int createChannels() override;
        std::shared_ptr<ni::Analog> parseChannel(config::Parser &parser, std::string channel_type, std::string channel_name);
        void parseChannels(config::Parser &parser) override;

        int createChannel(ChannelConfig &channel);

        // NI related resources
        uint64_t numAIChannels = 0;
    };


    ///////////////////////////////////////////////////////////////////////////////////
    //                                    DigitalReadSource                           //
    ///////////////////////////////////////////////////////////////////////////////////
    class DigitalReadSource : public Source {
    public:
        explicit DigitalReadSource(
                TaskHandle task_handle,
                const std::shared_ptr<task::Context> &ctx,
                const synnax::Task task
        ) : Source(task_handle, ctx, task) {}

        std::pair<synnax::Frame, freighter::Error> read() override;

        void acquireData() override;

        int configureTiming() override;

        int createChannels() override;

        void parseChannels(config::Parser &parser) override;
    };


    ///////////////////////////////////////////////////////////////////////////////////
    //                                    StateSource                                //
    ///////////////////////////////////////////////////////////////////////////////////
    class StateSource : public pipeline::Source {
    public:
        explicit StateSource() = default;

        explicit StateSource(std::uint64_t state_rate, synnax::ChannelKey &drive_state_index_key,
                             std::vector<synnax::ChannelKey> &drive_state_channel_keys);

        std::pair<synnax::Frame, freighter::Error> read();

        freighter::Error start();

        freighter::Error stop();

        synnax::Frame getDriveState();

        void updateState(std::queue<synnax::ChannelKey> &modified_state_keys,
                         std::queue<std::uint8_t> &modified_state_values);

    private:
        std::mutex state_mutex;
        std::condition_variable waiting_reader;
        std::uint64_t state_rate;
        std::chrono::duration<double> state_period;
        std::map<synnax::ChannelKey, uint8_t> state_map;
        synnax::ChannelKey drive_state_index_key;
    };


    ///////////////////////////////////////////////////////////////////////////////////
    //                                    DigitalWriteSink                           //
    ///////////////////////////////////////////////////////////////////////////////////
    typedef struct WriterConfig {
        std::vector<ChannelConfig> channels;
        std::uint64_t state_rate = 0;
        std::string device_name;
        std::string device_key;
        std::string task_name;
        synnax::ChannelKey task_key;


        std::vector<synnax::ChannelKey> drive_state_channel_keys;
        std::vector<synnax::ChannelKey> drive_cmd_channel_keys;

        synnax::ChannelKey drive_state_index_key;
        std::queue<synnax::ChannelKey> modified_state_keys;
        std::queue<std::uint8_t> modified_state_values;
    } WriterConfig;

    class DigitalWriteSink : public pipeline::Sink {
    public:
        explicit DigitalWriteSink(TaskHandle task_handle,
                                  const std::shared_ptr<task::Context> &ctx,
                                  const synnax::Task task);

        int init();

        freighter::Error write(synnax::Frame frame);

        freighter::Error stop();

        freighter::Error start();

        std::vector<synnax::ChannelKey> getCmdChannelKeys();

        std::vector<synnax::ChannelKey> getStateChannelKeys();

        void getIndexKeys();

        bool ok();

        ~DigitalWriteSink();


        std::shared_ptr<ni::StateSource> writer_state_source;
    private:
        freighter::Error formatData(synnax::Frame frame);

        void parseConfig(config::Parser &parser);

        int checkNIError(int32 error);

        uint8_t *writeBuffer;
        int bufferSize = 0;
        int numSamplesPerChannel = 0;
        std::int64_t numChannels = 0;
        TaskHandle task_handle = 0;

        json err_info;

        bool ok_state = true;
        std::shared_ptr<task::Context> ctx;
        WriterConfig writer_config;
        breaker::Breaker breaker;
        std::atomic<bool> running = false;
    };

    ///////////////////////////////////////////////////////////////////////////////////
    //                                    Scanner                                    //
    ///////////////////////////////////////////////////////////////////////////////////
    class Scanner {
    public:
        explicit Scanner() = default;

        explicit Scanner(const std::shared_ptr<task::Context> &ctx,
                         const synnax::Task &task);

        ~Scanner();

        void scan();

        bool ok();

        json getDevices();

        void createDevices();

    private:
        json getDeviceProperties(NISysCfgResourceHandle resource);


        json devices;
        bool ok_state = true;
        NISysCfgSessionHandle session;
        NISysCfgFilterHandle filter;
        NISysCfgEnumResourceHandle resources_handle;
        synnax::Task task;
        std::shared_ptr<task::Context> ctx;
    };

    /////////////////////////////////////////////////////////////////////////////////////////////
    //                                                                                         //
    //                                    TASK INTERFACES                                      //
    //                                                                                         //
    /////////////////////////////////////////////////////////////////////////////////////////////

    ///////////////////////////////////////////////////////////////////////////////////
    //                                    ScannerTask                                //
    ///////////////////////////////////////////////////////////////////////////////////
    class ScannerTask final : public task::Task {
    public:
        explicit ScannerTask(const std::shared_ptr<task::Context> &ctx,
                             synnax::Task task);

        void exec(task::Command &cmd) override;

        static std::unique_ptr<task::Task> configure(const std::shared_ptr<task::Context> &ctx,
                                                     const synnax::Task &task);

        void run();

        void start();

        void stop() override;

        bool ok();

        ~ScannerTask();

    private:
        std::atomic<bool> running;
        ni::Scanner scanner;
        std::shared_ptr<task::Context> ctx;
        synnax::Task task;
        std::thread thread;
        bool ok_state = true;
    };


    ///////////////////////////////////////////////////////////////////////////////////
    //                                    ReaderTask                                 //
    ///////////////////////////////////////////////////////////////////////////////////
    class ReaderTask final : public task::Task {
    public:


        explicit ReaderTask(const std::shared_ptr<task::Context> &ctx,
                            synnax::Task task,
                            std::shared_ptr<pipeline::Source> source,
                            std::shared_ptr<ni::Source> ni_source,
                            synnax::WriterConfig writer_config,
                            const breaker::Config breaker_config);

        void exec(task::Command &cmd) override;

        void stop() override;

        void start();

        bool ok();

        static std::unique_ptr<task::Task> configure(const std::shared_ptr<task::Context> &ctx,
                                                     const synnax::Task &task);

    private:
        std::atomic<bool> running = false;
        std::shared_ptr<task::Context> ctx;
        synnax::Task task;
        pipeline::Acquisition daq_read_pipe; // source is a daqreader 
        bool ok_state = true;
        std::shared_ptr<ni::Source> source;
    };

    ///////////////////////////////////////////////////////////////////////////////////
    //                                    WriterTask                                 //
    ///////////////////////////////////////////////////////////////////////////////////
    class WriterTask final : public task::Task {
    public:
        explicit WriterTask(const std::shared_ptr<task::Context> &ctx,
                            synnax::Task task,
                            std::shared_ptr<pipeline::Sink> sink,
                            std::shared_ptr<ni::DigitalWriteSink> ni_sink,
                            std::shared_ptr<pipeline::Source> writer_state_source,
                            synnax::WriterConfig writer_config,
                            synnax::StreamerConfig streamer_config,
                            const breaker::Config breaker_config);

        void exec(task::Command &cmd) override;

        void stop() override;

        void start();

        static std::unique_ptr<task::Task> configure(const std::shared_ptr<task::Context> &ctx,
                                                     const synnax::Task &task);

        bool ok();

        ~WriterTask() {
            LOG(INFO) << "WriterTask destructor called";
        }


    private:
        std::atomic<bool> running = false;
        std::shared_ptr<task::Context> ctx;
        synnax::Task task;
        pipeline::Control cmd_write_pipe;
        pipeline::Acquisition state_write_pipe;
        bool ok_state = true;
        std::shared_ptr<ni::DigitalWriteSink> sink;
    };


    ///////////////////////////////////////////////////////////////////////////////////
    //                                    Factory                                    //
    ///////////////////////////////////////////////////////////////////////////////////
    class Factory final : public task::Factory {
    public:
        std::pair<std::unique_ptr<task::Task>, bool> configureTask(const std::shared_ptr<task::Context> &ctx,
                                                                   const synnax::Task &task) override;

        std::vector<std::pair<synnax::Task, std::unique_ptr<task::Task> > >
        configureInitialTasks(const std::shared_ptr<task::Context> &ctx,
                              const synnax::Rack &rack) override;

        ~Factory() = default;

    };
}


