package unary

import (
	"context"
	"github.com/cockroachdb/errors"
	"github.com/google/uuid"
	"github.com/synnaxlabs/cesium/internal/domain"
	"github.com/synnaxlabs/x/control"
	"github.com/synnaxlabs/x/telem"
)

func (db *DB) Delete(ctx context.Context, tr telem.TimeRange) error {
	return db.wrapError(db.delete(ctx, tr))
}

// delete deletes a timerange tr from the unary database by adding all the unwanted
// underlying pointers to tombstone.
//
// The start of the timerange is either in the found pointer, or before, i.e.:
//
// Case 1 (* denotes tr.Start):   *   |---------data---------|
// In this case, that entire pointer will be deleted, and tr.Start will be set to the
// start of that pointer. The startOffset passed to domain will be 0.
//
// Case 2 (* denotes tr.Start):   |----------data-----*----|
// In this case, only data after tr.Start from that pointer will be deleted, the
// startOffset passed to domain will be calculated via db.index().Distance().
//
// Case 3 (edge case): |-----data-----|     *
// This case only happens when the deletion start is after ALL known domains, therefore
// we delete nothing.
//
// The same goes for the end pointer, but in the opposite direction (pointer will be
// before or contains tr.End):
//
// Case 1 (* denotes tr.End):   |---------data---------|    *
// In this case, that entire pointer will be deleted, and tr.End will be set to the
// end of that pointer. The endOffset passed to domain will 0.
//
// Case 2 (* denotes tr.End):   |----------data-----*----|
// In this case, only data before tr.End from that pointer will be deleted, the
// endOffset passed to domain will be calculated via db.index().Distance().
//
// Case 3 (edge case): |----data-----|   *
// This case only happens when the deletion end is before (or equal) all known domains,
// therefore we delete nothing.
func (db *DB) delete(ctx context.Context, tr telem.TimeRange) error {
	if !tr.Valid() {
		return errors.Newf("delete start %d cannot be after delete end %d", tr.Start, tr.End)
	}

	var (
		startOffset int64 = 0
		endOffset   int64 = 0
		density           = db.Channel.DataType.Density()
	)

	g, _, err := db.Controller.OpenAbsoluteGateIfUncontrolled(
		tr,
		control.Subject{Key: "delete_writer_" + uuid.New().String()},
		func() (controlledWriter, error) {
			return controlledWriter{Writer: nil, channelKey: db.Channel.Key}, nil
		})
	if err != nil {
		return err
	}

	_, ok := g.Authorize()
	defer g.Release()

	i := db.Domain.NewIterator(domain.IteratorConfig{Bounds: tr})
	if ok = i.SeekFirst(ctx); !ok {
		// No domains after start: delete nothing.
		return i.Close()
	}

	if i.TimeRange().Start.AfterEq(tr.Start) {
		startOffset = 0
		tr.Start = i.TimeRange().Start
	} else {
		approxDist, err := db.index().Distance(ctx, telem.TimeRange{
			Start: i.TimeRange().Start,
			End:   tr.Start,
		}, false)
		if err != nil {
			return errors.CombineErrors(err, i.Close())
		}
		startOffset = approxDist.Upper
	}

	if ok = i.SeekLast(ctx); !ok {
		// No domains before end: delete nothing.
		return i.Close()
	}

	if i.TimeRange().End.BeforeEq(tr.End) {
		tr.End = i.TimeRange().End
		endOffset = 0
	} else {
		approxDist, err := db.index().Distance(ctx, telem.TimeRange{
			Start: tr.End,
			End:   i.TimeRange().End,
		}, false)
		if err != nil {
			return errors.CombineErrors(err, i.Close())
		}

		// Add one to account for the fact that endOffset starts at the first index OUT
		// of the domain.
		endOffset = approxDist.Lower + 1
	}

	err = db.Domain.Delete(
		ctx,
		int64(density.Size(startOffset)),
		int64(density.Size(endOffset)),
		tr,
	)

	return errors.CombineErrors(err, i.Close())
}

func (db *DB) GarbageCollect(ctx context.Context) error {
	return db.wrapError(db.Domain.GarbageCollect(ctx))
}
