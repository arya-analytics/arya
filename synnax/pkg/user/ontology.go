// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

package user

import (
	"context"
	"github.com/google/uuid"
	"github.com/synnaxlabs/synnax/pkg/distribution/ontology"
	"github.com/synnaxlabs/synnax/pkg/distribution/ontology/schema"
	changex "github.com/synnaxlabs/x/change"
	"github.com/synnaxlabs/x/gorp"
	"github.com/synnaxlabs/x/iter"
	"github.com/synnaxlabs/x/observe"
)

const ontologyType ontology.Type = "user"

func OntologyID(key uuid.UUID) ontology.ID {
	return ontology.ID{Type: ontologyType, Key: key.String()}
}

func FromOntologyID(id ontology.ID) (uuid.UUID, error) {
	return uuid.Parse(id.Key)
}

var _schema = &ontology.Schema{
	Type: ontologyType,
	Fields: map[string]schema.Field{
		"key":      {Type: schema.String},
		"username": {Type: schema.String},
	},
}

var _ ontology.Service = (*Service)(nil)

// Schema implements ontology.Service.
func (s *Service) Schema() *schema.Schema { return _schema }

// RetrieveResource implements ontology.Service.
func (s *Service) RetrieveResource(ctx context.Context, key string) (schema.Resource, error) {
	uuidKey, err := uuid.Parse(key)
	if err != nil {
		return schema.Resource{}, err
	}
	u, err := s.Retrieve(ctx, uuidKey)
	return newResource(u), err
}

type change = changex.Change[uuid.UUID, User]

// OnChange implements ontology.Service.
func (s *Service) OnChange(f func(context.Context, iter.Nexter[schema.Change])) observe.Disconnect {
	var (
		translate = func(ch change) schema.Change {
			return schema.Change{
				Variant: ch.Variant,
				Key:     OntologyID(ch.Key),
				Value:   newResource(ch.Value),
			}
		}
		onChange = func(ctx context.Context, reader gorp.TxReader[uuid.UUID, User]) {
			f(ctx, iter.NexterTranslator[change, schema.Change]{
				Wrap:      reader,
				Translate: translate,
			})
		}
	)
	return gorp.Observe[uuid.UUID, User](s.DB).OnChange(onChange)
}

// OpenNexter implements ontology.Service.
func (s *Service) OpenNexter() (iter.NexterCloser[schema.Resource], error) {
	n, err := gorp.WrapReader[uuid.UUID, User](s.DB).OpenNexter()
	return newNextCloser(n), err
}

func newNextCloser(i iter.NexterCloser[User]) iter.NexterCloser[schema.Resource] {
	return iter.NexterCloserTranslator[User, schema.Resource]{
		Wrap:      i,
		Translate: newResource,
	}
}

func newResource(u User) schema.Resource {
	e := schema.NewResource(_schema, OntologyID(u.Key), u.Username)
	schema.Set(e, "key", u.Key.String())
	schema.Set(e, "username", u.Username)
	return e
}
