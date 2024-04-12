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
	"github.com/synnaxlabs/synnax/pkg/distribution/channel"
	"go/types"

	"github.com/google/uuid"
	"github.com/synnaxlabs/synnax/pkg/ranger"
	"github.com/synnaxlabs/x/gorp"
)

type Range = ranger.Range

type RangeService struct {
	dbProvider
	internal *ranger.Service
}

func NewRangeService(p Provider) *RangeService {
	return &RangeService{
		dbProvider: p.db,
		internal:   p.Config.Ranger,
	}
}

type RangeCreateRequest struct {
	Ranges []Range `json:"ranges" msgpack:"ranges"`
}

type RangeCreateResponse struct {
	Ranges []Range `json:"ranges" msgpack:"ranges"`
}

func (s *RangeService) Create(ctx context.Context, req RangeCreateRequest) (res RangeCreateResponse, _ error) {
	return res, s.WithTx(ctx, func(tx gorp.Tx) error {
		err := s.internal.NewWriter(tx).CreateMany(ctx, &req.Ranges)
		res = RangeCreateResponse{Ranges: req.Ranges}
		return err
	})
}

type RangeRetrieveRequest struct {
	Keys  []uuid.UUID `json:"keys" msgpack:"keys"`
	Names []string    `json:"names" msgpack:"names"`
	Term  string      `json:"term" msgpack:"term"`
}

type RangeRetrieveResponse struct {
	Ranges []Range `json:"ranges" msgpack:"ranges"`
}

func (s *RangeService) Retrieve(ctx context.Context, req RangeRetrieveRequest) (res RangeRetrieveResponse, _ error) {
	var (
		resRanges []ranger.Range
		q         = s.internal.NewRetrieve().Entries(&resRanges)
		hasNames  = len(req.Names) > 0
		hasKeys   = len(req.Keys) > 0
		hasSearch = req.Term != ""
	)
	if hasNames {
		q = q.WhereNames(req.Names...)
	}
	if hasKeys {
		q = q.WhereKeys(req.Keys...)
	}
	if hasSearch {
		q = q.Search(req.Term)
	}
	err := q.Exec(ctx, nil)
	return RangeRetrieveResponse{Ranges: resRanges}, err
}

type RangeRenameRequest struct {
	Key  uuid.UUID `json:"key" msgpack:"key"`
	Name string    `json:"name" msgpack:"name"`
}

func (s *RangeService) Rename(ctx context.Context, req RangeRenameRequest) (res types.Nil, _ error) {
	return res, s.WithTx(ctx, func(tx gorp.Tx) error {
		return s.internal.NewWriter(tx).Rename(ctx, req.Key, req.Name)
	})
}

type RangeDeleteRequest struct {
	Keys []uuid.UUID `json:"keys" msgpack:"keys"`
}

func (s *RangeService) Delete(ctx context.Context, req RangeDeleteRequest) (res types.Nil, _ error) {
	return res, s.WithTx(ctx, func(tx gorp.Tx) error {
		for _, key := range req.Keys {
			if err := s.internal.NewWriter(tx).Delete(ctx, key); err != nil {
				return err
			}
		}
		return nil
	})
}

type RangeKVGetRequest struct {
	Range uuid.UUID `json:"range" msgpack:"range"`
	Keys  []string  `json:"keys" msgpack:"keys"`
}

type RangeKVGetResponse struct {
	Pairs map[string]string `json:"pairs" msgpack:"pairs"`
}

func (s *RangeService) KVGet(ctx context.Context, req RangeKVGetRequest) (res RangeKVGetResponse, _ error) {
	var r ranger.Range
	if err := s.internal.NewRetrieve().Entry(&r).
		WhereKeys(req.Range).
		Exec(ctx, nil); err != nil {
		return res, err
	}
	pairs := make(map[string]string, len(req.Keys))
	for _, key := range req.Keys {
		value, err := r.Get(ctx, []byte(key))
		if err != nil {
			return res, err
		}
		pairs[key] = string(value)
	}
	return RangeKVGetResponse{Pairs: pairs}, nil
}

type RangeKVSetRequest struct {
	Range uuid.UUID         `json:"range" msgpack:"range"`
	Pairs map[string]string `json:"pairs" msgpack:"pairs"`
}

func (s *RangeService) KVSet(ctx context.Context, req RangeKVSetRequest) (res types.Nil, _ error) {
	return res, s.WithTx(ctx, func(tx gorp.Tx) error {
		var rng ranger.Range
		if err := s.internal.NewRetrieve().Entry(&rng).
			WhereKeys(req.Range).
			Exec(ctx, tx); err != nil {
			return err
		}
		rng = rng.UseTx(tx)
		for k, v := range req.Pairs {
			if err := rng.Set(ctx, []byte(k), []byte(v)); err != nil {
				return err
			}
		}
		return nil
	})
}

type RangeKVDeleteRequest struct {
	Range uuid.UUID `json:"range" msgpack:"range"`
	Keys  []string  `json:"keys" msgpack:"keys"`
}

func (s *RangeService) KVDelete(ctx context.Context, req RangeKVDeleteRequest) (res types.Nil, _ error) {
	return res, s.WithTx(ctx, func(tx gorp.Tx) error {
		var rng ranger.Range
		if err := s.internal.NewRetrieve().Entry(&rng).
			WhereKeys(req.Range).
			Exec(ctx, tx); err != nil {
			return err
		}
		rng = rng.UseTx(tx)
		for _, key := range req.Keys {
			if err := rng.Delete(ctx, []byte(key)); err != nil {
				return err
			}
		}
		return nil
	})
}

type RangeAliasSetRequest struct {
	Range   uuid.UUID              `json:"range" msgpack:"range"`
	Aliases map[channel.Key]string `json:"aliases" msgpack:"aliases"`
}

func (s *RangeService) AliasSet(ctx context.Context, req RangeAliasSetRequest) (res types.Nil, _ error) {
	return res, s.WithTx(ctx, func(tx gorp.Tx) error {
		var rng ranger.Range
		if err := s.internal.NewRetrieve().Entry(&rng).
			WhereKeys(req.Range).
			Exec(ctx, tx); err != nil {
			return err
		}
		rng = rng.UseTx(tx)
		for k, v := range req.Aliases {
			if err := rng.SetAlias(ctx, k, v); err != nil {
				return err
			}
		}
		return nil
	})
}

type RangeAliasResolveRequest struct {
	Range   uuid.UUID `json:"range" msgpack:"range"`
	Aliases []string  `json:"aliases" msgpack:"aliases"`
}

type RangeAliasResolveResponse struct {
	Aliases map[string]channel.Key `json:"aliases" msgpack:"aliases"`
}

func (s *RangeService) AliasResolve(ctx context.Context, req RangeAliasResolveRequest) (res RangeAliasResolveResponse, _ error) {
	var r ranger.Range
	if err := s.internal.NewRetrieve().Entry(&r).
		WhereKeys(req.Range).
		Exec(ctx, nil); err != nil {
		return res, err
	}
	aliases := make(map[string]channel.Key, len(req.Aliases))
	for _, alias := range req.Aliases {
		ch, err := r.ResolveAlias(ctx, alias)
		if err != nil {
			return res, err
		}
		if ch != 0 {
			aliases[alias] = ch
		}
	}
	return RangeAliasResolveResponse{Aliases: aliases}, nil
}

type RangeAliasDeleteRequest struct {
	Range    uuid.UUID     `json:"range" msgpack:"range"`
	Channels []channel.Key `json:"channels" msgpack:"channels"`
}

func (s *RangeService) AliasDelete(ctx context.Context, req RangeAliasDeleteRequest) (res types.Nil, _ error) {
	return res, s.WithTx(ctx, func(tx gorp.Tx) error {
		var rng ranger.Range
		if err := s.internal.NewRetrieve().Entry(&rng).
			WhereKeys(req.Range).
			Exec(ctx, tx); err != nil {
			return err
		}
		rng = rng.UseTx(tx)
		for _, alias := range req.Channels {
			if err := rng.DeleteAlias(ctx, alias); err != nil {
				return err
			}
		}
		return nil
	})
}

type RangeAliasListRequest struct {
	Range uuid.UUID `json:"range" msgpack:"range"`
}

type RangeAliasListResponse struct {
	Aliases map[channel.Key]string `json:"aliases" msgpack:"aliases"`
}

func (s *RangeService) AliasList(ctx context.Context, req RangeAliasListRequest) (res RangeAliasListResponse, _ error) {
	var r ranger.Range
	if err := s.internal.NewRetrieve().Entry(&r).
		WhereKeys(req.Range).
		Exec(ctx, nil); err != nil {
		return res, err
	}
	aliases, err := r.ListAliases(ctx)
	return RangeAliasListResponse{Aliases: aliases}, err
}

type RangeSetActiveRequest struct {
	Range uuid.UUID `json:"range" msgpack:"range"`
}

func (s *RangeService) SetActive(ctx context.Context, req RangeSetActiveRequest) (res types.Nil, _ error) {
	return res, s.WithTx(ctx, func(tx gorp.Tx) error {
		return s.internal.SetActiveRange(ctx, req.Range, tx)
	})
}

type RangeRetrieveActiveResponse struct {
	Range ranger.Range `json:"range" msgpack:"range"`
}

func (s *RangeService) RetrieveActive(ctx context.Context, _ types.Nil) (res RangeRetrieveActiveResponse, _ error) {
	rng, err := s.internal.RetrieveActiveRange(ctx, nil)
	res.Range = rng
	return res, err
}

func (s *RangeService) ClearActive(ctx context.Context, _ types.Nil) (res types.Nil, _ error) {
	s.internal.ClearActiveRange(ctx)
	return res, nil
}
