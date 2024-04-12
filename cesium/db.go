// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

package cesium

import (
	"context"
	"github.com/synnaxlabs/cesium/internal/virtual"
	"github.com/synnaxlabs/x/confluence"
	errors2 "github.com/synnaxlabs/x/errors"
	"sync"

	"github.com/synnaxlabs/cesium/internal/core"
	"github.com/synnaxlabs/cesium/internal/index"
	"github.com/synnaxlabs/cesium/internal/unary"
	"github.com/synnaxlabs/x/errors"
	"github.com/synnaxlabs/x/query"
	"github.com/synnaxlabs/x/telem"
)

var (
	// ChannelNotFound is returned when a channel or a range of data cannot be found in the DB.
	ChannelNotFound  = errors.Wrap(query.NotFound, "[cesium] - channel not found")
	ErrDiscontinuous = index.ErrDiscontinuous
)

type (
	Channel    = core.Channel
	ChannelKey = core.ChannelKey
	Frame      = core.Frame
)

func NewFrame(keys []core.ChannelKey, series []telem.Series) Frame {
	return core.NewFrame(keys, series)
}

type DB struct {
	*options
	relay      *relay
	mu         sync.RWMutex
	unaryDBs   map[ChannelKey]unary.DB
	virtualDBs map[ChannelKey]virtual.DB
	digests    struct {
		key    ChannelKey
		inlet  confluence.Inlet[WriterRequest]
		outlet confluence.Outlet[WriterResponse]
	}
}

// Write implements DB.
func (db *DB) Write(ctx context.Context, start telem.TimeStamp, frame Frame) error {
	_, span := db.T.Debug(ctx, "write")
	defer span.End()
	w, err := db.OpenWriter(ctx, WriterConfig{Start: start, Channels: frame.Keys})
	if err != nil {
		return err
	}
	w.Write(frame)
	w.Commit()
	return w.Close()
}

// WriteArray implements DB.
func (db *DB) WriteArray(ctx context.Context, key core.ChannelKey, start telem.TimeStamp, series telem.Series) error {
	return db.Write(ctx, start, core.NewFrame([]core.ChannelKey{key}, []telem.Series{series}))
}

// Read implements DB.
func (db *DB) Read(ctx context.Context, tr telem.TimeRange, keys ...core.ChannelKey) (frame Frame, err error) {
	iter, err := db.OpenIterator(IteratorConfig{Channels: keys, Bounds: tr})
	if err != nil {
		return
	}
	defer func() { err = iter.Close() }()
	if !iter.SeekFirst() {
		return
	}
	for iter.Next(telem.TimeSpanMax) {
		frame = frame.AppendFrame(iter.Value())
	}
	return
}

// Close implements DB.
func (db *DB) Close() error {
	c := errors2.NewCatcher(errors2.WithAggregation())
	db.closeControlDigests()
	for _, u := range db.unaryDBs {
		c.Exec(u.Close)
	}
	c.Exec(db.relay.close)
	return nil
}
