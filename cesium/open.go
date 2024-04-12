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
	"github.com/samber/lo"
	"github.com/synnaxlabs/cesium/internal/core"
	"github.com/synnaxlabs/cesium/internal/meta"
	"github.com/synnaxlabs/cesium/internal/unary"
	"github.com/synnaxlabs/cesium/internal/virtual"
	"github.com/synnaxlabs/x/errors"
	"strconv"
)

func Open(dirname string, opts ...Option) (*DB, error) {
	o := newOptions(dirname, opts...)
	if err := openFS(o); err != nil {
		return nil, err
	}

	o.L.Info("opening cesium time series engine", o.Report().ZapFields()...)

	info, err := o.fs.List("")
	if err != nil {
		return nil, err
	}
	_db := &DB{
		options:    o,
		unaryDBs:   make(map[core.ChannelKey]unary.DB, len(info)),
		virtualDBs: make(map[core.ChannelKey]virtual.DB, len(info)),
		relay:      newRelay(o),
	}
	for _, i := range info {
		key := core.ChannelKey(lo.Must(strconv.Atoi(i.Name())))
		if err != nil {
			return nil, err
		}
		if i.IsDir() {
			if err = _db.openVirtualOrUnary(Channel{Key: key}); err != nil {
				return nil, err
			}
		}
	}
	return _db, nil
}

func (db *DB) openVirtualOrUnary(ch Channel) error {
	db.mu.Lock()
	defer db.mu.Unlock()
	fs, err := db.fs.Sub(strconv.Itoa(int(ch.Key)))
	if err != nil {
		return err
	}
	ch, err = meta.ReadOrCreate(fs, ch, db.metaECD)
	if err != nil {
		return err
	}
	if ch.Virtual {
		_, isOpen := db.virtualDBs[ch.Key]
		if isOpen {
			return nil
		}
		v, err := virtual.Open(virtual.Config{Channel: ch, Instrumentation: db.Instrumentation})
		if err != nil {
			return err
		}
		db.virtualDBs[ch.Key] = *v
	} else {
		_, isOpen := db.unaryDBs[ch.Key]
		if isOpen {
			return nil
		}
		u, err := unary.Open(unary.Config{FS: fs, Channel: ch, Instrumentation: db.Instrumentation})
		if err != nil {
			return err
		}
		// In the case where we index the data using a separate index database, we
		// need to set the index on the unary database. Otherwise, we assume the database
		// is self-indexing.
		if u.Channel.Index != 0 && !u.Channel.IsIndex {
			idxDB, ok := db.unaryDBs[u.Channel.Index]
			if !ok {
				err = db.openVirtualOrUnary(Channel{Key: u.Channel.Index})
				if err != nil {
					return err
				}
				idxDB, ok = db.unaryDBs[u.Channel.Index]
				if !ok {
					return errors.Wrapf(ChannelNotFound, "index %d", u.Channel.Index)
				}
			}
			u.SetIndex((&idxDB).Index())
		}
		db.unaryDBs[ch.Key] = *u
	}
	return nil
}

func openFS(opts *options) error {
	_fs, err := opts.fs.Sub(opts.dirname)
	opts.fs = _fs
	return err
}
