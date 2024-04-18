// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

package atomic

import (
	"sync/atomic"
)

// Int32Counter is an int32 counter that is safe for concurrent use.
type Int32Counter struct{ value int32 }

func (c *Int32Counter) Add(delta int32) int32 {
	return atomic.AddInt32(&c.value, delta)
}

func (c *Int32Counter) Value() int32 { return atomic.LoadInt32(&c.value) }

// Int64Counter is an int64 counter that is safe for concurrent use.
type Int64Counter struct{ value int64 }

func (c *Int64Counter) Add(delta int64) int64 { return atomic.AddInt64(&c.value, delta) }

func (c *Int64Counter) Value() int64 { return atomic.LoadInt64(&c.value) }

// UInt64Counter is an int64 counter that is safe for concurrent use.
type UInt64Counter struct{ value uint64 }

func (c *UInt64Counter) Add(delta uint64) uint64 { return atomic.AddUint64(&c.value, delta) }

func (c *UInt64Counter) Value() uint64 { return atomic.LoadUint64(&c.value) }
