// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

package control

import (
	"github.com/cockroachdb/errors"
	"math"
)

type Authority uint8

const (
	Absolute Authority = math.MaxUint8
)

var Unauthorized = errors.New("unauthorized")

type Concurrency uint8

const (
	Exclusive Concurrency = iota
	Shared
)
