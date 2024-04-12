// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

package api

import (
	"context"
	"github.com/google/uuid"
	"github.com/synnaxlabs/synnax/pkg/distribution/ontology"
	"github.com/synnaxlabs/synnax/pkg/distribution/ontology/group"
	"github.com/synnaxlabs/synnax/pkg/distribution/ontology/search"
	"github.com/synnaxlabs/x/gorp"
	"go/types"
)

type OntologyService struct {
	dbProvider
	OntologyProvider
	group *group.Service
}

func NewOntologyService(p Provider) *OntologyService {
	return &OntologyService{
		OntologyProvider: p.ontology,
		dbProvider:       p.db,
		group:            p.Group,
	}
}

type OntologyRetrieveRequest struct {
	IDs              []ontology.ID `json:"ids" msgpack:"ids" validate:"required"`
	Children         bool          `json:"children" msgpack:"children"`
	Parents          bool          `json:"parents" msgpack:"parents"`
	IncludeSchema    bool          `json:"include_schema" msgpack:"include_schema" default:"true"`
	IncludeFieldData bool          `json:"include_field_data" msgpack:"include_field_data" default:"true"`
	Term             string        `json:"term" msgpack:"term"`
	Limit            int           `json:"limit" msgpack:"limit"`
	Offset           int           `json:"offset" msgpack:"offset"`
}

type OntologyRetrieveResponse struct {
	Resources []ontology.Resource `json:"resources" msgpack:"resources"`
}

func (o *OntologyService) Retrieve(
	ctx context.Context,
	req OntologyRetrieveRequest,
) (res OntologyRetrieveResponse, err error) {
	res.Resources = []ontology.Resource{}
	if req.Term != "" {
		var _err error
		res.Resources, _err = o.Ontology.Search(ctx, search.Request{
			Term: req.Term,
		})
		return res, _err
	}
	q := o.Ontology.NewRetrieve().
		WhereIDs(req.IDs...).
		IncludeSchema(req.IncludeSchema).
		IncludeFieldData(req.IncludeFieldData)

	if req.Children {
		q = q.TraverseTo(ontology.Children)
	} else if req.Parents {
		q = q.TraverseTo(ontology.Parents)
	} else if req.Limit > 0 {
		q = q.Limit(req.Limit)
	} else if req.Offset > 0 {
		q = q.Offset(req.Offset)
	}
	q = q.IncludeSchema(req.IncludeSchema).IncludeFieldData(req.IncludeFieldData)

	return res, q.Entries(&res.Resources).Exec(ctx, nil)
}

type OntologyCreateGroupRequest struct {
	Name   string      `json:"name" msgpack:"name" validate:"required"`
	Parent ontology.ID `json:"parent" msgpack:"parent"`
}

type OntologyCreateGroupResponse struct {
	Group group.Group `json:"group" msgpack:"group"`
}

func (o *OntologyService) CreateGroup(
	ctx context.Context,
	req OntologyCreateGroupRequest,
) (res OntologyCreateGroupResponse, err error) {
	return res, o.WithTx(ctx, func(tx gorp.Tx) error {
		w := o.group.NewWriter(tx)
		g, err_ := w.Create(ctx, req.Name, req.Parent)
		res.Group = g
		return err_
	})
}

type OntologyDeleteGroupRequest struct {
	Keys []uuid.UUID `json:"keys" msgpack:"keys" validate:"required"`
}

func (o *OntologyService) DeleteGroup(
	ctx context.Context,
	req OntologyDeleteGroupRequest,
) (res types.Nil, err error) {
	return res, o.WithTx(ctx, func(tx gorp.Tx) error {
		w := o.group.NewWriter(tx)
		return w.Delete(ctx, req.Keys...)
	})
}

type OntologyRenameGroupRequest struct {
	Key  uuid.UUID `json:"key" msgpack:"key" validate:"required"`
	Name string    `json:"name" msgpack:"name" validate:"required"`
}

func (o *OntologyService) RenameGroup(
	ctx context.Context,
	req OntologyRenameGroupRequest,
) (res types.Nil, err error) {
	return res, o.WithTx(ctx, func(tx gorp.Tx) error {
		w := o.group.NewWriter(tx)
		return w.Rename(ctx, req.Key, req.Name)
	})
}

type OntologyAddChildrenRequest struct {
	ID       ontology.ID   `json:"id" msgpack:"id" validate:"required"`
	Children []ontology.ID `json:"children" msgpack:"children" validate:"required"`
}

func (o *OntologyService) AddChildren(
	ctx context.Context,
	req OntologyAddChildrenRequest,
) (res types.Nil, err error) {
	return res, o.WithTx(ctx, func(tx gorp.Tx) error {
		w := o.Ontology.NewWriter(tx)
		for _, child := range req.Children {
			if err := w.DefineRelationship(ctx, req.ID, ontology.ParentOf, child); err != nil {
				return err
			}
		}
		return nil
	})
}

type OntologyRemoveChildrenRequest struct {
	ID       ontology.ID   `json:"id" msgpack:"id" validate:"required"`
	Children []ontology.ID `json:"children" msgpack:"children" validate:"required"`
}

func (o *OntologyService) RemoveChildren(
	ctx context.Context,
	req OntologyRemoveChildrenRequest,
) (res types.Nil, err error) {
	return res, o.WithTx(ctx, func(tx gorp.Tx) error {
		w := o.Ontology.NewWriter(tx)
		for _, child := range req.Children {
			if err := w.DeleteRelationship(ctx, req.ID, ontology.ParentOf, child); err != nil {
				return err
			}
		}
		return nil
	})
}

type OntologyMoveChildrenRequest struct {
	From     ontology.ID   `json:"from" msgpack:"from" validate:"required"`
	To       ontology.ID   `json:"to" msgpack:"to" validate:"required"`
	Children []ontology.ID `json:"children" msgpack:"children" validate:"required"`
}

func (o *OntologyService) MoveChildren(
	ctx context.Context,
	req OntologyMoveChildrenRequest,
) (res types.Nil, err error) {
	return res, o.WithTx(ctx, func(tx gorp.Tx) error {
		w := o.Ontology.NewWriter(tx)
		for _, child := range req.Children {
			if err := w.DeleteRelationship(ctx, req.From, ontology.ParentOf, child); err != nil {
				return err
			}
			if err := w.DefineRelationship(ctx, req.To, ontology.ParentOf, child); err != nil {
				return err
			}
		}
		return nil
	})
}
