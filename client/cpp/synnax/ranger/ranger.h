// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

#pragma once

/// std.
#include <string>
#include <vector>
#include <memory>

/// freighter
#include "freighter/freighter.h"

/// api protos
#include "google/protobuf/empty.pb.h"
#include "v1/ranger.pb.h"

/// grpc
#include <grpcpp/grpcpp.h>

/// internal
#include "synnax/telem/telem.h"


typedef std::string Key;

using namespace synnax;

namespace synnax {

/// @brief type alias for the transport used to retrieve ranges.
typedef freighter::UnaryClient <
api::v1::RangeRetrieveResponse,
api::v1::RangeRetrieveRequest
> RangeRetrieveClient;

/// @brief type alias for the transport used to create ranges.
typedef freighter::UnaryClient <
api::v1::RangeCreateResponse,
api::v1::RangeCreateRequest
> RangeCreateClient;


/// @brief type alias for the transport used to get range-scoped key-values.
typedef freighter::UnaryClient <
api::v1::RangeKVGetResponse,
api::v1::RangeKVGetRequest
> RangeKVGetClient;

/// @brief type alias for the transport used to set range-scoped key-values.
typedef freighter::UnaryClient <
google::protobuf::Empty,
api::v1::RangeKVSetRequest
> RangeKVSetClient;

/// @brief type alias for the transport used to delete range-scoped key-values.
typedef freighter::UnaryClient <
google::protobuf::Empty,
api::v1::RangeKVDeleteRequest
> RangeKVDeleteClient;


/// @brief a range-scoped key-value store for storing meta-data and configuration
/// about a range.
class RangeKV {
private:
    std::string range_key;
    RangeKVGetClient *kv_get_client;
    RangeKVSetClient *kv_set_client;
    RangeKVDeleteClient *kv_delete_client;
public:
    RangeKV(
            std::string range_key,
            RangeKVGetClient *kv_get_client,
            RangeKVSetClient *kv_set_client,
            RangeKVDeleteClient *kv_delete_client
    ) : range_key(range_key), kv_get_client(kv_get_client),
        kv_set_client(kv_set_client), kv_delete_client(kv_delete_client) {}


    /// @brief gets the value of the given key.
    /// @param key - the key to get the value of.
    /// @returns a pair containing the value and an error where ok() is false if the
    /// value could not be retrieved. Use err.message() to get the error message
    /// or err.type to get the error type.
    [[nodiscard]] std::pair<std::string, freighter::Error> get(const std::string &key) const;

    /// @brief sets the value of the given key.
    /// @param key - the key to set the value of.
    /// @param value - the value to set.
    /// @returns an error where ok() is false if the value could not be set.
    /// Use err.message() to get the error message or err.type to get the error type.
    /// @note this will overwrite any existing value for the given key.
    [[nodiscard]] freighter::Error set(const std::string &key, const std::string &value) const;

    /// @brief deletes the value of the given key.
    /// @param key - the key to delete the value of.
    /// @returns an error where ok() is false if the value could not be deleted.
    /// Use err.message() to get the error message or err.type to get the error type.
    /// @note this operation is idempotent, an will not error if the key does not exist.
    [[nodiscard]] freighter::Error del(const std::string &key) const;
};

/// @brief a range is a user-defined region of a cluster's data. It's identified
/// by a name, time range, and uniquely generated. See
/// https://docs.synnaxlabs.com/concepts/read-ranges for an introduction to ranges
/// and how they work.
class Range {
public:
    Key key;
    std::string name;
    synnax::TimeRange time_range{};
    RangeKV kv = RangeKV("", nullptr, nullptr, nullptr);

    /// @brief constructs the range. Note that this does not mean the range has been
    /// persisted to the cluster. To persist the range, call create, at which
    /// point a unique key will be generated for the range.
    /// @param name - a human-readable name for the range. Does not need to be
    /// unique, and should represent the data that the range contains i.e.
    /// "Hot fire 1", "Print 22", or "Tank Burst Test".
    /// @param time_range - the time range of the range.
    Range(const std::string &name, synnax::TimeRange time_range);

    /// @brief constructs the range from its protobuf type.
    explicit Range(const api::v1::Range &rng);

private:
    /// @brief binds the range's fields to the given proto.
    void to_proto(api::v1::Range *rng) const;

    /// @brief constructs an empty, invalid range.
    Range() = default;

    friend class RangeClient;
};

/// @brief a client for performing operations on the ranges in a Synnax cluster.
class RangeClient {

public:
    RangeClient(RangeRetrieveClient *retrieve_client, RangeCreateClient *create_client, RangeKVGetClient *kv_get_client,
                RangeKVSetClient *kv_set_client, RangeKVDeleteClient *kv_delete_client) :
            retrieve_client(retrieve_client),
            create_client(create_client),
            kv_get_client(kv_get_client),
            kv_set_client(kv_set_client),
            kv_delete_client(kv_delete_client) {}

    /// @brief retrieves the currently active range in the cluster.
    /// @returns a pair containing the currently active range and an error. error.ok()
    /// will be false if there is no active range or the active range could not be
    /// retrieved.
    std::pair<Range, freighter::Error> activeRange();

    /// @brief retrieves the range with the given key.
    /// @param key - the key of the range to retrieve.
    /// @returns a pair containing the created range and an error where ok() is false
    /// if the range could not be retrieved. Use err.message() to get the error
    /// message or err.type to get the error type.
    [[nodiscard]] std::pair<Range, freighter::Error>
    retrieveByKey(const std::string &key) const;

    /// @brief retrieves the range with the given name.
    /// @param name - the name of the range to retrieve.
    /// @returns a pair containing the created range and an error where ok() is false
    /// if the range could not be retrieved. Use err.message() to get the error
    /// message or err.type to get the error type.
    [[nodiscard]] std::pair<Range, freighter::Error>
    retrieveByName(const std::string &name) const;

    /// @brief retrieves the ranges with the given keys.
    /// @param keys - the keys of the ranges to retrieve.
    /// @returns a pair containing the created ranges and an error where ok() is false
    /// if the ranges could not be retrieved. Use err.message() to get the error
    /// message or err.type to get the error type.
    [[nodiscard]] std::pair<std::vector<Range>, freighter::Error>
    retrieveByKey(std::vector<std::string> keys) const;

    /// @brief retrieves the ranges with the given names.
    /// @param names - the names of the ranges to retrieve.
    /// @returns a pair containing the created ranges and an error where ok() is false
    /// if the ranges could not be retrieved. Use err.message() to get the error
    /// message or err.type to get the error type.
    [[nodiscard]] std::pair<std::vector<Range>, freighter::Error>
    retrieveByName(std::vector<std::string> names) const;

    /// @brief creates the given ranges.
    /// @param ranges - the ranges to create.
    /// @modifies the ranges in the vector to set their keys and default values.
    /// @returns an error where ok() is false if the ranges could not be created.
    /// Use err.message() to get the error message or err.type to get the error type.
    [[nodiscard]] freighter::Error create(std::vector<Range> &ranges) const;

    /// @brief creates the given range.
    /// @param range - the range to create.
    /// @modifies the range to set its key and default values.
    /// @returns an error where ok() is false if the range could not be created.
    [[nodiscard]] freighter::Error create(Range &range) const;

    /// @brief creates a range with the given name and time range.
    /// @param name - the name of the range to create.
    /// @param time_range - the time range of the range to create.
    /// @returns a pair containing the created range and an error where ok() is false
    /// if the range could not be created. Use err.message() to get the error
    /// message or err.type to get the error type.
    [[nodiscard]] std::pair<Range, freighter::Error> create(std::string name, synnax::TimeRange time_range) const;

private:
    /// @brief range retrieval transport.
    RangeRetrieveClient *retrieve_client;
    /// @brief create retrieval transport.
    RangeCreateClient *create_client;
    /// @brief range kv get transport.
    RangeKVGetClient *kv_get_client;
    /// @brief range kv set transport.
    RangeKVSetClient *kv_set_client;
    /// @brief range kv delete transport.
    RangeKVDeleteClient *kv_delete_client;

    /// @brief retrieves a single range.
    std::pair<Range, freighter::Error> retrieveOne(api::v1::RangeRetrieveRequest &req) const;

    /// @brief retrieves multiple ranges.
    std::pair<std::vector<Range>, freighter::Error> retrieveMany(api::v1::RangeRetrieveRequest &req) const;

};

}