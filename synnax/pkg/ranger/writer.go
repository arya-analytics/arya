// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

package ranger

import (
	"context"
	"github.com/google/uuid"
	"github.com/synnaxlabs/synnax/pkg/distribution/ontology"
	"github.com/synnaxlabs/synnax/pkg/distribution/ontology/group"
	"github.com/synnaxlabs/x/gorp"
	"github.com/synnaxlabs/x/validate"
)

type Writer struct {
	tx    gorp.Tx
	otg   ontology.Writer
	group group.Group
}

func (w Writer) Create(
	ctx context.Context,
	r *Range,
) (err error) {
	if r.Key == uuid.Nil {
		r.Key = uuid.New()
	}
	if err = w.validate(*r); err != nil {
		return
	}
	if err = gorp.NewCreate[uuid.UUID, Range]().Entry(r).Exec(ctx, w.tx); err != nil {
		return
	}
	otgID := OntologyID(r.Key)
	if err = w.otg.DefineResource(ctx, otgID); err != nil {
		return
	}
	return w.otg.DefineRelationship(ctx, w.group.OntologyID(), ontology.ParentOf, otgID)
}

func (w Writer) CreateMany(
	ctx context.Context,
	rs *[]Range,
) (err error) {
	for i, r := range *rs {
		if err = w.Create(ctx, &r); err != nil {
			return
		}
		(*rs)[i] = r
	}
	return err
}

func (w Writer) Delete(ctx context.Context, key uuid.UUID) error {
	if err := gorp.NewDelete[uuid.UUID, Range]().WhereKeys(key).Exec(ctx, w.tx); err != nil {
		return err
	}
	return w.otg.DeleteResource(ctx, OntologyID(key))
}

func (w Writer) validate(r Range) error {
	v := validate.New("ranger.Range")
	validate.NotNil(v, "Name", r.Key)
	validate.NotNil(v, "Name", r.Name)
	validate.NonZero(v, "TimeRange.Start", r.TimeRange.Start)
	validate.NonZero(v, "TimeRange.end", r.TimeRange.End)
	return v.Error()
}
