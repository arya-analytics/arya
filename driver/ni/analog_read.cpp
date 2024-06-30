// Copyright 2024 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

#include <cassert>
#include <chrono>
#include <stdio.h>
#include <utility>

#include "client/cpp/telem/telem.h"
#include "driver/ni/ni.h"
#include "glog/logging.h"
#include "nlohmann/json.hpp"

using json = nlohmann::json;

void ni::AnalogReadSource::parseChannels(config::Parser &parser) {
    std::uint64_t c_count = 0;
    parser.iter("channels",
                [&](config::Parser &channel_builder) {
                    // LOG(INFO) << channel_builder.get_json().dump(4);

                    ni::ChannelConfig config;
                    // analog channel names are formatted: <device_name>/ai<port>
                    std::string port = std::to_string(
                        channel_builder.required<std::uint64_t>("port"));
                    std::string name = this->reader_config.device_name;
                    config.name = name + "/ai" + port;

                    config.channel_key = channel_builder.required<uint32_t>("channel");
                    config.channel_type = channel_builder.required<std::string>("type");

                    config.ni_channel = this->parseChannel(
                        channel_builder, config.channel_type, config.name);

                    this->channel_map[config.name] =
                            "channels." + std::to_string(c_count);
                    LOG(INFO) << "Channel name: " << config.name;
                    if (channel_builder.required<bool>("enabled") == true) {
                        config.enabled = true;
                    }

                    this->reader_config.channels.push_back(config);

                    LOG(INFO) << "Count: " << c_count;
                    c_count++;
                });
}

std::shared_ptr<ni::Analog> ni::AnalogReadSource::parseChannel(
    config::Parser &parser, std::string channel_type, std::string channel_name) {
    if (channel_type == "ai_accel")
        return std::make_shared<Acceleration>(
            parser, this->task_handle, channel_name);
    if (channel_type == "ai_accel_4_wire_dc_voltage")
        return std::make_shared<
            Acceleration4WireDCVoltage>(parser, this->task_handle, channel_name);
    if (channel_type == "ai_accel_charge")
        return std::make_shared<AccelerationCharge>(
            parser, this->task_handle, channel_name);
    if (channel_type == "ai_bridge")
        return std::make_shared<Bridge>(
            parser, this->task_handle, channel_name);
    if (channel_type == "ai_charge")
        return std::make_shared<Charge>(
            parser, this->task_handle, channel_name);
    if (channel_type == "ai_current")
        return std::make_shared<Current>(
            parser, this->task_handle, channel_name);
    if (channel_type == "ai_current_rms")
        return std::make_shared<CurrentRMS>(
            parser, this->task_handle, channel_name);
    if (channel_type == "ai_force_bridge_polynomial")
        return std::make_shared<
            ForceBridgePolynomial>(parser, this->task_handle, channel_name);
    if (channel_type == "ai_force_bridge_table")
        return std::make_shared<
            ForceBridgeTable>(parser, this->task_handle, channel_name);
    if (channel_type == "ai_force_bridge_two_point_lin")
        return std::make_shared<
            ForceBridgeTwoPointLin>(parser, this->task_handle, channel_name);
    if (channel_type == "ai_force_iepe")
        return std::make_shared<ForceIEPE>(
            parser, this->task_handle, channel_name);
    if (channel_type == "ai_freq_voltage")
        return std::make_shared<FrequencyVoltage>(
            parser, this->task_handle, channel_name);
    if (channel_type == "ai_microphone")
        return std::make_shared<Microphone>(
            parser, this->task_handle, channel_name);
    if (channel_type == "ai_pressure_bridge_polynomial")
        return std::make_shared<
            PressureBridgePolynomial>(parser, this->task_handle, channel_name);
    if (channel_type == "ai_pressure_bridge_table")
        return std::make_shared<
            PressureBridgeTable>(parser, this->task_handle, channel_name);
    if (channel_type == "ai_pressure_bridge_two_point_lin")
        return std::make_shared<
            PressureBridgeTwoPointLin>(parser, this->task_handle, channel_name);
    if (channel_type == "ai_resistance")
        return std::make_shared<Resistance>(
            parser, this->task_handle, channel_name);
    if (channel_type == "ai_rosette_strain_gage")
        return std::make_shared<
            RosetteStrainGage>(parser, this->task_handle, channel_name);
    if (channel_type == "ai_rtd")
        return std::make_shared<RTD>(
            parser, this->task_handle, channel_name);
    if (channel_type == "ai_strain_gage")
        return std::make_shared<StrainGage>(
            parser, this->task_handle, channel_name);
    if (channel_type == "ai_temp_built_in_sensor")
        return std::make_shared<
            TemperatureBuiltInSensor>(parser, this->task_handle, channel_name);
    if (channel_type == "ai_thermocouple")
        return std::make_shared<Thermocouple>(
            parser, this->task_handle, channel_name);
    if (channel_type == "ai_thrmstr_iex")
        return std::make_shared<ThermistorIEX>(
            parser, this->task_handle, channel_name);
    if (channel_type == "ai_thrmstr_vex")
        return std::make_shared<ThermistorVex>(
            parser, this->task_handle, channel_name);
    if (channel_type == "ai_torque_bridge_polynomial")
        return std::make_shared<
            TorqueBridgePolynomial>(parser, this->task_handle, channel_name);
    if (channel_type == "ai_torque_bridge_table")
        return std::make_shared<
            TorqueBridgeTable>(parser, this->task_handle, channel_name);
    if (channel_type == "ai_torque_bridge_two_point_lin")
        return std::make_shared<
            TorqueBridgeTwoPointLin>(parser, this->task_handle, channel_name);
    if (channel_type == "ai_velocity_iepe")
        return std::make_shared<VelocityIEPE>(
            parser, this->task_handle, channel_name);
    if (channel_type == "ai_voltage")
        return std::make_shared<Voltage>(
            parser, this->task_handle, channel_name);
    if (channel_type == "ai_voltage_rms")
        return std::make_shared<VoltageRMS>(
            parser, this->task_handle, channel_name);
    if (channel_type == "ai_voltage_with_excit")
        return std::make_shared<
            VoltageWithExcit>(parser, this->task_handle, channel_name);
    return std::make_shared<Voltage>(parser, this->task_handle, channel_name);
}


int ni::AnalogReadSource::configureTiming() {
    if (this->reader_config.timing_source == "none") {
        if (this->checkNIError(ni::NiDAQmxInterface::CfgSampClkTiming(this->task_handle,
            "",
            this->reader_config.sample_rate.value,
            DAQmx_Val_Rising,
            DAQmx_Val_ContSamps,
            this->reader_config.sample_rate.value))) {
            LOG(ERROR) << "[ni.reader] failed while configuring timing for task " <<
                    this->reader_config.task_name;
            this->ok_state = false;
            return -1;
        }
    } else {
        if (this->checkNIError(ni::NiDAQmxInterface::CfgSampClkTiming(this->task_handle,
            this->reader_config.timing_source.c_str(),
            this->reader_config.sample_rate.value,
            DAQmx_Val_Rising,
            DAQmx_Val_ContSamps,
            this->reader_config.sample_rate.value))) {
            LOG(ERROR) << "[ni.reader] failed while configuring timing for task " <<
                    this->reader_config.task_name;
            this->ok_state = false;
            return -1;
        }
    }
    // we read data in chunks of numSamplesPerChannel such that we can send frames of data of size numSamplesPerChannel at the stream rate
    // e.g. if we have 4 channels and we want to stream at 100Hz at a 1000hz sample rate
    // make a make a call to read 10 samples at 100hz
    this->numSamplesPerChannel = std::floor(
        this->reader_config.sample_rate.value / this->reader_config.stream_rate.value);
    this->bufferSize = this->numAIChannels * this->numSamplesPerChannel;
    this->timer = loop::Timer(this->reader_config.stream_rate);
    return 0;
}

void ni::AnalogReadSource::acquireData() {
     while (this->breaker.running()) {
        DataPacket data_packet;
        data_packet.analog_data.resize(this->bufferSize);
        data_packet.t0 = (uint64_t) ((synnax::TimeStamp::now()).value);
        if (this->checkNIError(ni::NiDAQmxInterface::ReadAnalogF64(
            this->task_handle,
            this->numSamplesPerChannel,
            -1,
            DAQmx_Val_GroupByChannel,
            data_packet.analog_data.data(),
            data_packet.analog_data.size(),
            &data_packet.samplesReadPerChannel,
            NULL))) {
            this->logError(
                "failed while reading analog data for task " + this->reader_config.
                task_name);
        }
        data_packet.tf = (uint64_t) ((synnax::TimeStamp::now()).value);
        data_queue.enqueue(data_packet);
    }
}

std::pair<synnax::Frame, freighter::Error> ni::AnalogReadSource::read(
    breaker::Breaker &breaker) {
    synnax::Frame f = synnax::Frame(numChannels);

    // sleep per streaming period
    // timer.wait(breaker);
    auto [d, err] = data_queue.dequeue();
    if (!err)
        return std::make_pair(std::move(f), freighter::Error(
                                  driver::TEMPORARY_HARDWARE_ERROR,
                                  "Failed to read data from queue"));

    // interpolate  timestamps between the initial and final timestamp to ensure non-overlapping timestamps between batched reads
    uint64_t incr = ((d.tf - d.t0) / this->numSamplesPerChannel);
    // Construct and populate index channel
    std::vector<std::uint64_t> time_index(this->numSamplesPerChannel);
    for (uint64_t i = 0; i < d.samplesReadPerChannel; ++i)
        time_index[i] = d.t0 + (std::uint64_t) (incr * i);

    size_t s = d.samplesReadPerChannel;
    // Construct and populate synnax frame
    size_t data_index = 0;
    for (int ch = 0; ch < numChannels; ch++) {
        if (this->reader_config.channels[ch].channel_type == "index") {
            f.add(this->reader_config.channels[ch].channel_key,
                  synnax::Series(time_index, synnax::TIMESTAMP));
            continue;
        }
        auto series = synnax::Series(synnax::FLOAT32, s);
        // copy data from start to end into series
        for(int i = 0; i < s; i++) 
            series.write((float)(d.analog_data[data_index*s + i]));
        
        f.add(this->reader_config.channels[ch].channel_key, std::move(series));
        data_index++;
    }
    return std::make_pair(std::move(f), freighter::NIL);
}

int ni::AnalogReadSource::createChannels() {
    auto channels = this->reader_config.channels;
    for (auto &channel: channels) {
        this->numChannels++;
        if (channel.channel_type == "index" || !channel.enabled) continue;
        this->numAIChannels++;
        this->checkNIError(channel.ni_channel->createNIScale());
        this->checkNIError(channel.ni_channel->createNIChannel());
        LOG(INFO) << "[ni.reader] created scale for " << channel.name;
        if (!this->ok()) {
            this->logError("failed while creating channel " + channel.name);
            return -1;
        }
    }
    return 0;
}

int ni::AnalogReadSource::validateChannels() {
    for (auto &channel: this->reader_config.channels) {
        if (channel.channel_type == "index") {
            if (channel.channel_key == 0) {
                LOG(ERROR) << "[NI Reader] Index channel key is 0";
                return -1;
            }
            continue;
        }
        // if not index, make sure channel type is valid
        auto [channel_info, err] = this->ctx->client->channels.retrieve(
            channel.channel_key);
        if(channel_info.data_type != synnax::FLOAT32 || channel_info.data_type != synnax::FLOAT64) {
            this->logError("Channel " + channel.name + " is not of type FLOAT32 or FLOAT64");
            return -1;
        }
    }
    return 0;
}