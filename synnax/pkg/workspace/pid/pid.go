// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

package pid

import (
	"github.com/google/uuid"
	"github.com/synnaxlabs/x/gorp"
)

type PID struct {
	Key      uuid.UUID `json:"key" msgpack:"key"`
	Snapshot bool      `json:"snapshot" msgpack:"snapshot"`
	Name     string    `json:"name" msgpack:"name"`
	Data     string    `json:"data" msgpack:"data"`
}

var _ gorp.Entry[uuid.UUID] = PID{}

// GorpKey implements gorp.Entry.
func (p PID) GorpKey() uuid.UUID { return p.Key }

// SetOptions implements gorp.Entry.
func (p PID) SetOptions() []interface{} { return nil }
