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
#include "daqmx.h"


#include "client/cpp/synnax/synnax.h"
#include "driver/driver/task/task.h"
#include "driver/driver/pipeline/daqReader.h"
#include "driver/driver/errors/errors.h" 
#include "driver/driver/breaker/breaker.h"

// #include "driver/driver/modules/module.h"

namespace ni{

    typedef struct ChannelConfig{
        /// @brief synnax properties
        std::uint32_t name_space;
        std::string node_id; // TODO: not actually parsed in from task config rn
        uint32_t channel_key;

        /// @brief NI properties
        std::string name;
        std::string channel_type;
        float min_val;
        float max_val;
    } ChannelConfig;

    typedef struct ReaderConfig{
        std::vector<ChannelConfig> channels;
        std::uint64_t acq_rate = 0;
        std::uint64_t stream_rate = 0;
        std::string device_name;
        std::string task_name; 
        std::string reader_type;
        synnax::ChannelKey task_key;
        bool isDigital = false;
    } ReaderConfig;

    typedef struct WriterConfig{
        std::vector<ChannelConfig> channels;
        std::uint64_t state_rate = 0;
        std::string device_name;
        std::string task_name; 
        synnax::ChannelKey task_key;


        std::vector<synnax::ChannelKey> drive_state_channel_keys;
        std::vector<synnax::ChannelKey> drive_cmd_channel_keys;

        synnax::ChannelKey drive_state_index_key;
        std::queue<synnax::ChannelKey> modified_state_keys;
        std::queue<synnax::uint8_t> modified_state_vals;
    } WriterConfig;

    ///////////////////////////////////////////////////////////////////////////////////
    //                                    niDaqReader                                //
    ///////////////////////////////////////////////////////////////////////////////////

    class niDaqReader : public daq::daqReader{ // public keyword required to store pointer to niDaqreader in a pointer to acqReader
    public:
        // TODO: why do we not pass the task in by reference?
        explicit niDaqReader(TaskHandle taskHandle,
                             const std::shared_ptr<task::Context> &ctx,
                             const synnax::Task task);

        int init();
        std::pair<synnax::Frame, freighter::Error> read();
        freighter::Error stop();
        freighter::Error start();
        bool ok();

    private:
        // private helper functions
        void parse_digital_reader_config(config::Parser & parser);
        void parse_analog_reader_config(config::Parser & parser);
        int checkNIError(int32 error);

        // NI related resources
        TaskHandle taskHandle = 0;

        double *data;       // pointer to heap allocated dataBuffer to provide to DAQmx read functions
        uInt8 *digitalData; // pointer to heap allocated dataBuffer to provide to DAQmx read functions
        int bufferSize = 0; 
        uint64_t numChannels = 0;
        int numSamplesPerChannel = 0;
        json err_info;


        // Server related resources
        ReaderConfig reader_config;
        std::shared_ptr<task::Context> ctx;
        breaker::Breaker breaker;
        bool ok_state = true;


        std::pair<synnax::Frame, freighter::Error> readAnalog();
        std::pair<synnax::Frame, freighter::Error> readDigital();
    };



    ///////////////////////////////////////////////////////////////////////////////////
    //                                    niDaqWriter                                //
    ///////////////////////////////////////////////////////////////////////////////////

    class niDaqStateWriter : public::daq::daqStateWriter{
        public: 
            explicit niDaqStateWriter(synnax::Rate state_rate, drive_state_index_key);
            std::pair<synnax::Frame, freighter::Error> read();
            freighter::Error start();
            freighter::Error stop();
            synnax:Frame getState();
            void updateState(std::queue<synnax::ChannelKey> &modified_state_keys, std::queue<synnax::uint8_t> &modified_state_vals);
        private:
            std::mutex state_mutex;
            std::condition_variable waitingReader;
            synnax::Rate state_rate;
            std::chrono::duration<double> state_period;
            std::map<synnax::ChannelKey, uint8_t> state_map;
            synnax::ChannelKey drive_state_index_key;
    };

    class niDaqWriter : public daq::daqWriter{
    public:
        explicit niDaqWriter(TaskHandle taskHandle,
                             const std::shared_ptr<task::Context> &ctx,
                             const synnax::Task task);

        int init();
        freighter::Error write();
        freighter::Error stop();
        freighter::Error start();
        bool ok();

        ni::niDaqStateWriter writer_state_source;
    private:
        // private helper functions
        freighter::Error writeDigital(synnax::Frame frame);
        freighter::Error formatData(synnax::Frame frame);
        void parse_digital_writer_config(config::Parser &parser);
        int checkNIError(int32 error);

        // NI related resources
        uint8_t *writeBuffer;  
        int bufferSize = 0;   
        int numSamplesPerChannel = 0;
        std::int64_t numChannels = 0;
        TaskHandle taskHandle = 0;

        json err_info;

        // Server related resources
        bool ok_state = true;
        std::shared_ptr<task::Context> ctx;
        WriterConfig writer_config; 
        breaker::Breaker breaker;
    };



}
