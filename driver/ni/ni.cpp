// Copyright 2024 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.
#include "driver/ni/ni.h"
#include "driver/ni/scale.h"
#include <map>

const std::map<std::string, int32_t> ni::UNITS_MAP = {
    {"Volts", DAQmx_Val_Volts},
    {"Amps", DAQmx_Val_Amps},
    {"DegF", DAQmx_Val_DegF},
    {"DegC", DAQmx_Val_DegC},
    {"DegR", DAQmx_Val_DegR},
    {"Kelvins", DAQmx_Val_Kelvins},
    {"Strain", DAQmx_Val_Strain},
    {"Ohms", DAQmx_Val_Ohms},
    {"Hz", DAQmx_Val_Hz},
    {"Seconds", DAQmx_Val_Seconds},
    {"Meters", DAQmx_Val_Meters},
    {"Inches", DAQmx_Val_Inches},
    {"Degrees", DAQmx_Val_Degrees},
    {"Radians", DAQmx_Val_Radians},
    {"g", DAQmx_Val_g},
    {"MetersPerSecondSquared", DAQmx_Val_MetersPerSecondSquared},
    {"Newtons", DAQmx_Val_Newtons},
    {"Pounds", DAQmx_Val_Pounds},
    {"KilogramForce", DAQmx_Val_KilogramForce},
    {"PoundsPerSquareInch", DAQmx_Val_PoundsPerSquareInch},
    {"Bar", DAQmx_Val_Bar},
    {"Pascals", DAQmx_Val_Pascals},
    {"VoltsPerVolt", DAQmx_Val_VoltsPerVolt},
    {"mVoltsPerVolt", DAQmx_Val_mVoltsPerVolt},
    {"NewtonMeters", DAQmx_Val_NewtonMeters},
    {"InchOunces", DAQmx_Val_InchOunces},
    {"InchPounds", DAQmx_Val_InchPounds},
    {"FootPounds", DAQmx_Val_FootPounds},
    {"Strain", DAQmx_Val_Strain},
    {"FromTEDS", DAQmx_Val_FromTEDS}
};

///////////////////////////////////////////////////////////////////////////////////
//                                    NiSource                                   //
///////////////////////////////////////////////////////////////////////////////////


void ni::Source::getIndexKeys(){
    LOG(INFO) << "[NI Reader] acquiring index channels for task " << this->reader_config.task_name;
    std::set<std::uint32_t> index_keys;
    //iterate through channels in reader config
    for (auto &channel : this->reader_config.channels){
        auto [channel_info, err] = this->ctx->client->channels.retrieve(channel.channel_key);
        // TODO handle error with breaker
        if (err != freighter::NIL){
            this->logError("failed to retrieve channel " + std::to_string(channel.channel_key));
            return;
        } else{
            index_keys.insert(channel_info.index);
        }
    }

    LOG(INFO) << "[NI Reader] acquiring index channels for task 2 " << this->reader_config.task_name;

    // now iterate through the set and add all the index channels as configs
    for (auto it = index_keys.begin(); it != index_keys.end(); ++it){
        auto index_key = *it;
        auto [channel_info, err] = this->ctx->client->channels.retrieve(index_key);
        if (err != freighter::NIL){
            this->logError("failed to retrieve channel " + std::to_string(index_key));
            return;
        } else{
            ni::ChannelConfig index_channel;
            index_channel.channel_key = channel_info.key;
            index_channel.channel_type = "index";
            index_channel.name = channel_info.name;
            this->reader_config.channels.push_back(index_channel);
            // LOG(INFO) << "[NI Reader] index channel " << index_channel.channel_key << " and name: " << index_channel.name <<" added to task " << this->reader_config.task_name;
        }
    }
}


ni::Source::Source(
    TaskHandle task_handle,
    const std::shared_ptr<task::Context> &ctx,
    const synnax::Task task): task_handle(task_handle), ctx(ctx), task(task){
}

// TODO return error status for thsi function
void ni::Source::parseConfig(config::Parser &parser){
    // Get Acquisition Rate and Stream Rates
    this->reader_config.sample_rate = parser.required<uint64_t>("sample_rate");
    this->reader_config.stream_rate = parser.required<uint64_t>("stream_rate");
    this->reader_config.device_key = parser.required<std::string>("device");
    this->reader_config.timing_source = "none"; // parser.required<std::string>("timing_source"); TODO: uncomment this when ui provides timing source


    if(parser.optional<bool>("test", false)){
        this->reader_config.device_name = parser.required<std::string>("device_location");
    } else{
        auto [dev, err] = this->ctx->client->hardware.retrieveDevice(this->reader_config.device_key);
        if (err != freighter::NIL) {
            this->logError("failed to retrieve device " + this->reader_config.device_name);
            return;
        }
        this->reader_config.device_name = dev.location;
    }
   

    this->parseChannels(parser);
     if (!parser.ok() || !this->ok()){
        this->logError("failed to parse channels for " + this->reader_config.task_name + " Parser Error: " + parser.error_json().dump());
        this->ctx->setState({.task = task.key,
                             .variant = "error",
                             .details = parser.error_json()});
    }
}

int ni::Source::init(){
    // Create parser
    auto config_parser = config::Parser(this->task.config);
    this->reader_config.task_name = this->task.name;
    this->reader_config.task_key = this->task.key;


    // Parse configuration and make sure it is valid
    this->parseConfig(config_parser);

    if (!config_parser.ok() || !this->ok()){
        // Log error
        this->logError("failed to parse configuration for " + this->reader_config.task_name + " Parser Error: " + config_parser.error_json().dump());
        this->ctx->setState({.task = task.key,
                             .variant = "error",
                             .details = config_parser.error_json()});
        return -1;
    }

    LOG(INFO) << "[NI Reader] parsed config for " << this->reader_config.task_name;
    this->getIndexKeys(); 
    LOG(INFO) << "[NI Reader] index channels acquired for " << this->reader_config.task_name;
    // Create breaker
    auto breaker_config = breaker::Config{
        .name = task.name,
        .base_interval = 1 * SECOND,
        .max_retries = 20,
        .scale = 1.2,
    };
    this->breaker = breaker::Breaker(breaker_config);


    int err = this->createChannels();

    if(err){
        this->logError("failed to create channels for " + this->reader_config.task_name);
        return -1;
    }

    // Configure buffer size and read resources
    if(this->reader_config.sample_rate < this->reader_config.stream_rate){
        this->logError("Failed while configuring timing for NI hardware for task " + this->reader_config.task_name);
        this->err_info["error type"] = "Configuration Error";
        this->err_info["error details"] = "Stream rate is greater than sample rate";
        this->ctx->setState({.task = this->reader_config.task_key,
                             .variant = "error",
                             .details = err_info});
        return -1;
    }
    
    LOG(INFO) << "[NI Reader] configuring timing for NI hardware for task " << this->reader_config.task_name;
    if (this->configureTiming()) this->logError("[NI Reader] Failed while configuring timing for NI hardware for task " + this->reader_config.task_name);


    LOG(INFO) << "[NI Reader] successfully configured NI hardware for task " << this->reader_config.task_name;
    return 0;
}



freighter::Error ni::Source::start(){
    LOG(INFO) << "[NI Reader] starting reader for task " << this->reader_config.task_name;
    if(this->running.exchange(true) || !this->ok()){
        return freighter::NIL;
    }
    if (this->checkNIError(ni::NiDAQmxInterface::StartTask(this->task_handle))){
        this->logError("failed while starting reader for task " + this->reader_config.task_name + " requires reconfigure");
        this->clearTask();
        return freighter::Error(driver::CRITICAL_HARDWARE_ERROR);
    }else{
        this->sample_thread = std::thread(&ni::Source::acquireData, this);
    }
    return freighter::NIL;
}

freighter::Error ni::Source::stop(){
    LOG(INFO) << "[NI Reader] stopping reader for task " << this->reader_config.task_name;
    if(!this->running.exchange(false) || !this->ok()){
        return freighter::NIL;
    }
    this->sample_thread.join();
    if (this->checkNIError(ni::NiDAQmxInterface::StopTask(this->task_handle))){
        this->logError("failed while stopping reader for task " + this->reader_config.task_name);
        return freighter::Error(driver::CRITICAL_HARDWARE_ERROR);
    }
    data_queue.reset();
    LOG(INFO) << "[NI Reader] stopped reader for task " << this->reader_config.task_name;
    return  freighter::NIL;

}


void ni::Source::clearTask(){
    if (this->checkNIError(ni::NiDAQmxInterface::ClearTask(this->task_handle))){
        this->logError("failed while clearing reader for task " + this->reader_config.task_name);
    }
}


ni::Source::~Source(){
   this->clearTask();
}

int ni::Source::checkNIError(int32 error){
    if (error < 0){
        char errBuff[4096] = {'\0'};

        ni::NiDAQmxInterface::GetExtendedErrorInfo(errBuff, 4096);

        this->err_info["error type"] = "Vendor Error";
        this->err_info["error details"] = errBuff;
        
        this->ctx->setState({.task = this->reader_config.task_key,
                             .variant = "error",
                             .details = err_info});

        LOG(ERROR) << "[NI Reader] Vendor error: " << this->err_info["error details"];
        this->ok_state = false;
        return -1;
    }
    return 0;
}

bool ni::Source::ok(){ 
    return this->ok_state;
}


std::vector<synnax::ChannelKey> ni::Source::getChannelKeys(){
    std::vector<synnax::ChannelKey> keys;
    for (auto &channel : this->reader_config.channels){
        keys.push_back(channel.channel_key);
    }
    return keys;
}

void ni::Source::logError(std::string err_msg){
    LOG(ERROR) << "[NI Reader] " << err_msg;
    this->ok_state = false;
    return;
}