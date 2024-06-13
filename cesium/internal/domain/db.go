// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

package domain

import (
	"context"
	"github.com/synnaxlabs/alamos"
	"github.com/synnaxlabs/cesium/internal/core"
	"github.com/synnaxlabs/x/config"
	"github.com/synnaxlabs/x/errors"
	xio "github.com/synnaxlabs/x/io"
	xfs "github.com/synnaxlabs/x/io/fs"
	"github.com/synnaxlabs/x/override"
	"github.com/synnaxlabs/x/query"
	"github.com/synnaxlabs/x/telem"
	"github.com/synnaxlabs/x/validate"
	"math"
	"sync/atomic"
)

var (
	// ErrWriteConflict is returned when a domain overlaps with an existing domain in the DB.
	ErrWriteConflict = errors.Wrap(validate.Error, "write overlaps with existing data in database")
	// ErrRangeNotFound is returned when a requested domain is not found in the DB.
	ErrRangeNotFound = errors.Wrap(query.NotFound, "time range not found")
	errDBClosed      = core.EntityClosed("domain.db")
)

func NewErrWriteConflict(tr1, tr2 telem.TimeRange) error {
	intersection := tr1.Intersection(tr2)
	return errors.Wrapf(ErrWriteConflict, "write overlaps with existing data occupying time range %v for a time span of %v", intersection, intersection.Span())
}

func NewErrRangeNotFound(tr telem.TimeRange) error {
	return errors.Wrapf(ErrRangeNotFound, "time range %s cannot be found", tr)
}

// DB provides a persistent, concurrent store for reading and writing domains of telemetry
// to and from an underlying file system.
//
// A DB provides two types for accessing data:
//
//   - Writer allows the caller to write a blob of telemetry occupying a particular time
//     domain.
//
//   - Iterator allows the caller ot iterate over the telemetry domains in a DB in time order,
//     and provides an io.Reader like interface for accessing the data.
//
// A DB is safe for concurrent use, and multiple writers and iterators can access the DB
// at once.
//
// It's important to note that a DB is heavily optimized for large (several megabytes
// to gigabytes), append only writes. While small, out of order writes are valid, the
// user will see a heavy performance hit.
//
// A DB must be closed after use to avoid leaking any underlying resources/locks.
type DB struct {
	Config
	idx    *index
	files  *fileController
	closed *atomic.Bool
}

// Config is the configuration for opening a DB.
type Config struct {
	alamos.Instrumentation
	// FS is the filesystem that the DB will use to store its data. DB will write to the
	// root of the filesystem, so this should probably be a subdirectory. DB should have
	// exclusive access, and it should be empty when the DB is first opened.
	// [REQUIRED]
	FS xfs.FS
	// FileSize is the maximum size, in bytes, for a writer to be created on a file.
	// Note while that a file's size may still exceed this value, it is not likely
	// to exceed by much with frequent commits.
	// [OPTIONAL] Default: 1GB
	FileSize telem.Size
	// GCThreshold is the minimum tombstone proportion of the Filesize to trigger a GC.
	// Must be in (0, 1].
	// Note: Setting this value to 0 will have NO EFFECT as it is the default value.
	// instead, set it to a very small number greater than 0.
	// [OPTIONAL] Default: 0.2
	GCThreshold float32
	// MaxDescriptors is the maximum number of file descriptors that the DB will use. A
	// higher value will allow more concurrent reads and writes. It's important to note
	// that the exact performance impact of changing this value is still relatively unknown.
	// [OPTIONAL] Default: 100
	MaxDescriptors int
}

var (
	_ config.Config[Config] = Config{}
	// DefaultConfig is the default configuration for a DB.
	DefaultConfig = Config{
		FileSize:       800 * telem.Megabyte,
		GCThreshold:    0.2,
		MaxDescriptors: 100,
	}
)

// Validate implements config.GateConfig.
func (c Config) Validate() error {
	v := validate.New("domain")
	validate.Positive(v, "fileSize", c.FileSize)
	validate.Positive(v, "maxDescriptors", c.MaxDescriptors)
	validate.NotNil(v, "fs", c.FS)
	validate.GreaterThanEq(v, "gcThreshold", c.GCThreshold, 0)
	validate.LessThanEq(v, "gcThreshold", c.GCThreshold, 1)
	return v.Error()
}

// Override implements config.GateConfig.
func (c Config) Override(other Config) Config {
	c.MaxDescriptors = override.Numeric(c.MaxDescriptors, other.MaxDescriptors)
	c.FileSize = override.Numeric(c.FileSize, other.FileSize)
	c.FS = override.Nil(c.FS, other.FS)
	c.Instrumentation = override.Zero(c.Instrumentation, other.Instrumentation)
	c.GCThreshold = override.Numeric(c.GCThreshold, other.GCThreshold)

	// Store 0.8 * the desired maximum file size as file size since we must leave some
	// buffer for when we stop acquiring a new writer on a file.
	c.FileSize = telem.Size(math.Round(0.8 * float64(c.FileSize)))
	return c
}

// Open opens a DB using a merged view of the provided configurations (where the next
// configuration overrides the previous).
func Open(configs ...Config) (*DB, error) {
	cfg, err := config.New(DefaultConfig, configs...)
	if err != nil {
		return nil, err
	}
	idx := &index{}
	idxPst, err := openIndexPersist(idx, cfg.FS)
	if err != nil {
		return nil, err
	}
	idx.indexPersist = idxPst
	idx.mu.pointers, err = idxPst.load()
	if err != nil {
		return nil, err
	}
	controller, err := openFileController(cfg)
	if err != nil {
		return nil, err
	}

	return &DB{Config: cfg,
		idx:    idx,
		files:  controller,
		closed: &atomic.Bool{},
	}, nil
}

// NewIterator opens a new invalidated Iterator using the given configuration.
// A seeking call is required before it can be used.
func (db *DB) NewIterator(cfg IteratorConfig) *Iterator {
	i := &Iterator{
		Instrumentation: db.Instrumentation.Child("iterator"),
		idx:             db.idx,
		readerFactory:   db.newReader,
	}
	i.SetBounds(cfg.Bounds)
	return i
}

func (db *DB) newReader(ctx context.Context, ptr pointer) (*Reader, error) {
	internal, err := db.files.acquireReader(ctx, ptr.fileKey)
	if err != nil {
		return nil, err
	}
	reader := xio.NewSectionReaderAtCloser(internal, int64(ptr.offset), int64(ptr.length))
	return &Reader{ptr: ptr, ReaderAtCloser: reader}, nil
}

func (db *DB) HasDataFor(ctx context.Context, tr telem.TimeRange) (bool, error) {
	if db.closed.Load() {
		return false, errDBClosed
	}
	i := db.NewIterator(IteratorConfig{Bounds: telem.TimeRangeMax})

	if i.SeekGE(ctx, tr.Start) && i.TimeRange().OverlapsWith(tr) {
		return true, i.Close()
	}
	if i.SeekLE(ctx, tr.End) && i.TimeRange().OverlapsWith(tr) {
		return true, i.Close()
	}

	return false, i.Close()
}

// Close closes the DB. Close should not be called concurrently with any other DB methods.
func (db *DB) Close() error {
	if !db.closed.CompareAndSwap(false, true) {
		return nil
	}

	w := errors.NewCatcher(errors.WithAggregation())
	w.Exec(db.files.close)
	w.Exec(db.idx.close)
	return w.Error()
}
