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
	"github.com/synnaxlabs/cesium/internal/core"
	"github.com/synnaxlabs/cesium/internal/unary"
	"github.com/synnaxlabs/cesium/internal/virtual"
	"github.com/synnaxlabs/x/confluence"
	"github.com/synnaxlabs/x/errors"
	"github.com/synnaxlabs/x/telem"
	"io"
	"sync"
	"sync/atomic"
)

type (
	Channel    = core.Channel
	ChannelKey = core.ChannelKey
	Frame      = core.Frame
)

func NewFrame(keys []core.ChannelKey, series []telem.Series) Frame {
	return core.NewFrame(keys, series)
}

var (
	errDBClosed        = core.EntityClosed("cesium.db")
	ErrChannelNotFound = core.ErrChannelNotFound
)

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
	closed   *atomic.Bool
	shutdown io.Closer
}

// Write writes the frame to database at the specified start time.
func (db *DB) Write(ctx context.Context, start telem.TimeStamp, frame Frame) error {
	if db.closed.Load() {
		return errDBClosed
	}
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

// WriteArray writes a series into the specified channel at the specified start time.
func (db *DB) WriteArray(ctx context.Context, key core.ChannelKey, start telem.TimeStamp, series telem.Series) error {
	if db.closed.Load() {
		return errDBClosed
	}
	return db.Write(ctx, start, core.NewFrame([]core.ChannelKey{key}, []telem.Series{series}))
}

// Read reads from the database at the specified time range and outputs a frame.
func (db *DB) Read(_ context.Context, tr telem.TimeRange, keys ...core.ChannelKey) (frame Frame, err error) {
	if db.closed.Load() {
		return frame, errDBClosed
	}
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

// Close closes the database.
// Close is not safe to call with any other DB methods concurrently.
func (db *DB) Close() error {
	if !db.closed.CompareAndSwap(false, true) {
		return nil
	}
	db.mu.Lock()
	defer db.mu.Unlock()
	c := errors.NewCatcher(errors.WithAggregation())
	db.closeControlDigests()
	c.Exec(db.shutdown.Close)
	for _, u := range db.unaryDBs {
		c.Exec(u.Close)
	}
	return c.Error()
}
