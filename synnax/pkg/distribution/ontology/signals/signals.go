// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

package signals

import (
	"bytes"
	"context"
	"github.com/synnaxlabs/synnax/pkg/distribution/channel"
	"github.com/synnaxlabs/synnax/pkg/distribution/ontology"
	"github.com/synnaxlabs/synnax/pkg/distribution/ontology/schema"
	"github.com/synnaxlabs/synnax/pkg/distribution/signals"
	"github.com/synnaxlabs/x/change"
	"github.com/synnaxlabs/x/gorp"
	xio "github.com/synnaxlabs/x/io"
	"github.com/synnaxlabs/x/iter"
	"github.com/synnaxlabs/x/observe"
	"github.com/synnaxlabs/x/telem"
	"io"
)

func Propagate(
	ctx context.Context,
	prov *signals.Provider,
	otg *ontology.Ontology,
) (io.Closer, error) {
	resourceObserver := observe.Translator[iter.Nexter[schema.Change], []change.Change[[]byte, struct{}]]{
		Observable: otg.ResourceObserver,
		Translate: func(nexter iter.Nexter[schema.Change]) []change.Change[[]byte, struct{}] {
			return iter.MapToSlice(ctx, nexter, func(ch schema.Change) change.Change[[]byte, struct{}] {
				return change.Change[[]byte, struct{}]{
					Key:     EncodeID(ch.Key),
					Variant: ch.Variant,
				}
			})
		},
	}
	resourceObserverCloser, err := prov.SubscribeToObservable(ctx, signals.ObservableConfig{
		Name:       "ontology_resource",
		Observable: resourceObserver,
		Set:        channel.Channel{Name: "sy_ontology_resource_set", DataType: telem.StringT},
		Delete:     channel.Channel{Name: "sy_ontology_resource_delete", DataType: telem.StringT},
	})
	if err != nil {
		return nil, err
	}
	relationshipObserver := observe.Translator[gorp.TxReader[[]byte, ontology.Relationship], []change.Change[[]byte, struct{}]]{
		Observable: otg.RelationshipObserver,
		Translate: func(nexter gorp.TxReader[[]byte, ontology.Relationship]) []change.Change[[]byte, struct{}] {
			return iter.MapToSlice(ctx, nexter, func(ch change.Change[[]byte, ontology.Relationship]) change.Change[[]byte, struct{}] {
				return change.Change[[]byte, struct{}]{
					Key:     append(ch.Key, '\n'),
					Variant: ch.Variant,
				}
			})
		},
	}
	relationshipObserverCloser, err := prov.SubscribeToObservable(ctx, signals.ObservableConfig{
		Name:       "ontology_relationship",
		Observable: relationshipObserver,
		Set:        channel.Channel{Name: "sy_ontology_relationship_set", DataType: telem.StringT},
		Delete:     channel.Channel{Name: "sy_ontology_relationship_delete", DataType: telem.StringT},
	})
	return xio.MultiCloser{resourceObserverCloser, relationshipObserverCloser}, nil
}

func EncodeID(id ontology.ID) []byte { return []byte(id.String() + "\n") }

func EncodeIDs(ids []ontology.ID) []byte {
	var buf []byte
	for _, id := range ids {
		buf = append(buf, EncodeID(id)...)
	}
	return buf
}

func DecodeRelationships(ser []byte) ([]ontology.Relationship, error) {
	// ser.Data is a byte slice containing the encoded relationships, we need to decode them
	// by looking for the newline separator.
	var (
		relationships []ontology.Relationship
		buf           bytes.Buffer
	)
	for _, b := range ser {
		if b == '\n' {
			relationship, err := ontology.ParseRelationship(buf.Bytes())
			if err != nil {
				return nil, err
			}
			relationships = append(relationships, relationship)
			buf.Reset()
			continue
		} else {

		}
		buf.WriteByte(b)
	}
	return relationships, nil
}

func DecodeIDs(ser []byte) ([]ontology.ID, error) {
	// ser.Data is a byte slice containing the encoded IDs, we need to decode them
	// by looking for the newline separator.
	var (
		ids []ontology.ID
		buf bytes.Buffer
	)
	for _, b := range ser {
		if b == '\n' {
			id, err := schema.ParseID(buf.String())
			if err != nil {
				return nil, err
			}
			ids = append(ids, id)
			buf.Reset()
			continue
		}
		buf.WriteByte(b)
	}
	return ids, nil
}
