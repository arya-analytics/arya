// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

package workspace

import (
	"github.com/google/uuid"
	"github.com/synnaxlabs/x/gorp"
)

type Workspace struct {
	Key    uuid.UUID `json:"key" msgpack:"key"`
	Name   string    `json:"name" msgpack:"name"`
	Author uuid.UUID `json:"author" msgpack:"author"`
	Layout string    `json:"layout" msgpack:"layout"`
}

var _ gorp.Entry[uuid.UUID] = Workspace{}

// GorpKey implements gorp.Entry.
func (w Workspace) GorpKey() uuid.UUID { return w.Key }

// SetOptions implements gorp.Entry.
func (w Workspace) SetOptions() []interface{} { return nil }
