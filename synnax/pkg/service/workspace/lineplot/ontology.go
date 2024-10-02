// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

package lineplot

import (
	"context"

	"github.com/google/uuid"
	"github.com/samber/lo"
	"github.com/synnaxlabs/synnax/pkg/distribution/ontology"
	"github.com/synnaxlabs/synnax/pkg/distribution/ontology/schema"
	changex "github.com/synnaxlabs/x/change"
	"github.com/synnaxlabs/x/gorp"
	"github.com/synnaxlabs/x/iter"
	"github.com/synnaxlabs/x/observe"
)

const ontologyType ontology.Type = "lineplot"

func OntologyID(k uuid.UUID) ontology.ID {
	return ontology.ID{Type: ontologyType, Key: k.String()}
}

func OntologyIDs(ids []uuid.UUID) []ontology.ID {
	return lo.Map(ids, func(id uuid.UUID, _ int) ontology.ID {
		return OntologyID(id)
	})
}

func OntologyIDsFromLinePlots(lps []LinePlot) []ontology.ID {
	return lo.Map(lps, func(lp LinePlot, _ int) ontology.ID {
		return OntologyID(lp.Key)
	})
}

func KeysFromOntologyIds(ids []ontology.ID) (keys []uuid.UUID, err error) {
	keys = make([]uuid.UUID, len(ids))
	for i, id := range ids {
		keys[i], err = uuid.Parse(id.Key)
		if err != nil {
			return nil, err
		}
	}
	return keys, nil
}

var _schema = &ontology.Schema{
	Type: ontologyType,
	Fields: map[string]schema.Field{
		"key":  {Type: schema.String},
		"name": {Type: schema.String},
	},
}

func newResource(schematic LinePlot) schema.Resource {
	e := schema.NewResource(_schema, OntologyID(schematic.Key), schematic.Name)
	schema.Set(e, "key", schematic.Key.String())
	schema.Set(e, "name", schematic.Name)
	return e
}

var _ ontology.Service = (*Service)(nil)

type change = changex.Change[uuid.UUID, LinePlot]

// Schema implements ontology.Service.
func (s *Service) Schema() *schema.Schema { return _schema }

// RetrieveResource implements ontology.Service.
func (s *Service) RetrieveResource(ctx context.Context, key string, tx gorp.Tx) (ontology.Resource, error) {
	k := uuid.MustParse(key)
	var schematic LinePlot
	err := s.NewRetrieve().WhereKeys(k).Entry(&schematic).Exec(ctx, tx)
	return newResource(schematic), err
}

func translateChange(c change) schema.Change {
	return schema.Change{
		Variant: c.Variant,
		Key:     OntologyID(c.Key),
		Value:   newResource(c.Value),
	}
}

// OnChange implements ontology.Service.
func (s *Service) OnChange(f func(ctx context.Context, nexter iter.Nexter[schema.Change])) observe.Disconnect {
	handleChange := func(ctx context.Context, reader gorp.TxReader[uuid.UUID, LinePlot]) {
		f(ctx, iter.NexterTranslator[change, schema.Change]{Wrap: reader, Translate: translateChange})
	}
	return gorp.Observe[uuid.UUID, LinePlot](s.DB).OnChange(handleChange)
}

// OpenNexter implements ontology.Service.
func (s *Service) OpenNexter() (iter.NexterCloser[schema.Resource], error) {
	n, err := gorp.WrapReader[uuid.UUID, LinePlot](s.DB).OpenNexter()
	return iter.NexterCloserTranslator[LinePlot, schema.Resource]{
		Wrap:      n,
		Translate: newResource,
	}, err
}
