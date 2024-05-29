// Copyright 2024 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

//
// Created by Emiliano Bonilla on 1/3/24.
//

#include "driver/ni/ni.h"
#include "nlohmann/json.hpp"
#include "client/cpp/telem/telem.h"
#include <utility>
#include <chrono>
#include <stdio.h>
#include <cassert>
#include "glog/logging.h"

using json = nlohmann::json;

void ni::DigitalReadSource::parseChannels(config::Parser &parser){
    LOG(INFO) << "[NI Reader] Parsing Channels for task " << this->reader_config.task_name;
    // now parse the channels
    parser.iter("channels",
                [&](config::Parser &channel_builder){
                    ni::ChannelConfig config;

                    // digital channel names are formatted: <device_name>/port<port_number>/line<line_number>
                    config.name = (this->reader_config.device_name + "/port" + std::to_string(channel_builder.required<std::uint64_t>("port")) + "/line" + std::to_string(channel_builder.required<std::uint64_t>("line")));

                    config.channel_key = channel_builder.required<uint32_t>("channel");

                    // TODO: there could be more than 2 state logic
                    config.min_val = 0;
                    config.max_val = 1;

                    this->reader_config.channels.push_back(config);
                });
    assert(parser.ok());
}

int ni::DigitalReadSource::createChannels(){
    int err = 0;
    auto channels = this->reader_config.channels;
    for (auto &channel : channels){
        if (channel.channel_type != "index" ){
            err = this->checkNIError(ni::NiDAQmxInterface::CreateDIChan(task_handle, channel.name.c_str(), "", DAQmx_Val_ChanPerLine));
            LOG(INFO) << "Channel name: " << channel.name;
        } 
        LOG(INFO) << "Index channel added to task: " << channel.name;
        this->numChannels++; 
        if (err < 0){
            LOG(ERROR) << "[NI Reader] failed while configuring channel " << channel.name;
            this->ok_state = false;
            return -1;
        }
    }
    return 0;
}

int ni::DigitalReadSource::configureTiming(){
    if(this->reader_config.timing_source == "none"){ // if timing is not enabled, implement timing in software
        this->reader_config.period = (uint32_t)((1.0 / this->reader_config.sample_rate) * 1000000); // convert to microseconds

        this->numSamplesPerChannel = 1;
    } else{
        if (this->checkNIError(ni::NiDAQmxInterface::CfgSampClkTiming(this->task_handle,
                                                                    this->reader_config.timing_source.c_str(),
                                                                    this->reader_config.sample_rate,
                                                                    DAQmx_Val_Rising,
                                                                    DAQmx_Val_ContSamps,
                                                                    this->reader_config.sample_rate))){
            LOG(ERROR) << "[NI Reader] failed while configuring timing for task " << this->reader_config.task_name;
            this->ok_state = false;
            return -1;
        }

        this->numSamplesPerChannel = std::floor(this->reader_config.sample_rate / this->reader_config.stream_rate);
    }
    this->bufferSize = this->numChannels * this->numSamplesPerChannel;
    return 0;
}

// TODO: code dedup with analogreadsource read
std::pair<synnax::Frame, freighter::Error> ni::DigitalReadSource::read(){
    synnax::Frame f = synnax::Frame(numChannels);

    // sleep per stream rate
    std::this_thread::sleep_for(std::chrono::nanoseconds((uint64_t)((1.0 / this->reader_config.stream_rate )* 1000000000)));
    
    // take data off of queue
    std::optional<DataPacket> d = data_queue.dequeue();
    if(!d.has_value()) return std::make_pair(std::move(f), freighter::Error(driver::TYPE_TEMPORARY_HARDWARE_ERROR, "no data available to read"));
    uInt8* data = static_cast<uInt8*>(d.value().data);

    // interpolate  timestamps between the initial and final timestamp to ensure non-overlapping timestamps between batched reads
    uint64_t incr = ( (d.value().tf- d.value().t0) / this->numSamplesPerChannel );

    // Construct and populate index channel
    std::vector<std::uint64_t> time_index(this->numSamplesPerChannel);
    for (uint64_t i = 0; i < d.value().samplesReadPerChannel; ++i)
        time_index[i] = d.value().t0 + (std::uint64_t)(incr * i);
    
    // Construct and populate synnax frame
    uint64_t data_index = 0; // TODO: put a comment explaining the function of data_index
    for (int i = 0; i < numChannels; i++){
        if(this->reader_config.channels[i].channel_type == "index") {
            f.add(this->reader_config.channels[i].channel_key, synnax::Series(time_index, synnax::TIMESTAMP));
            continue;
        }

        std::vector<float> data_vec(d.value().samplesReadPerChannel);
        for (int j = 0; j < d.value().samplesReadPerChannel; j++)
            data_vec[j] = data[data_index * d.value().samplesReadPerChannel + j];
        f.add(this->reader_config.channels[i].channel_key, synnax::Series(data_vec, synnax::UINT8));
        data_index++;
    }

    if(d.has_value()) delete[] d.value().data;

    // return synnax frame
    return std::make_pair(std::move(f), freighter::NIL);
}

void ni::DigitalReadSource::acquireData(){
    while(this->running){
        DataPacket data_packet;
        data_packet.data = new uInt8[this->bufferSize];
        data_packet.t0 = (uint64_t) ((synnax::TimeStamp::now()).value);
        if (this->checkNIError(ni::NiDAQmxInterface::ReadDigitalLines(
                                                                this->task_handle,                        // task handle
                                                                this->numSamplesPerChannel,               // numSampsPerChan
                                                                -1,                                       // timeout
                                                                DAQmx_Val_GroupByChannel,                 // dataLayout
                                                                static_cast<uInt8*>(data_packet.data),    // readArray
                                                                this->bufferSize,                         // arraySizeInSamps
                                                                &data_packet.samplesReadPerChannel,                             // sampsPerChanRead
                                                                NULL,                                     // numBytesPerSamp
                                                                NULL))){
            LOG(ERROR) << "[NI Reader] failed while reading digital data for task " << this->reader_config.task_name;
        }
        data_packet.tf = (uint64_t)((synnax::TimeStamp::now()).value);
        data_queue.enqueue(data_packet);
    }
}