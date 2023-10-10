// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

package channel

import (
	"context"
	"github.com/samber/lo"
	"github.com/synnaxlabs/synnax/pkg/distribution/core"
	"github.com/synnaxlabs/synnax/pkg/distribution/ontology"
	"github.com/synnaxlabs/synnax/pkg/distribution/ontology/group"
	"github.com/synnaxlabs/synnax/pkg/distribution/proxy"
	"github.com/synnaxlabs/x/gorp"
)

type leaseProxy struct {
	ServiceConfig
	router        proxy.BatchFactory[Channel]
	leasedCounter *keyCounter
	freeCounter   *keyCounter
	group         group.Group
}

func newLeaseProxy(cfg ServiceConfig, g group.Group) (*leaseProxy, error) {
	c, err := openCounter(cfg.HostResolver.HostKey(), cfg.ClusterDB, ".distribution.channel.counter.leased")
	if err != nil {
		return nil, err
	}
	p := &leaseProxy{
		ServiceConfig: cfg,
		router:        proxy.BatchFactory[Channel]{Host: cfg.HostResolver.HostKey()},
		leasedCounter: c,
		group:         g,
	}
	if cfg.HostResolver.HostKey() == core.Bootstrapper {
		c, err := openCounter(cfg.HostResolver.HostKey(), cfg.ClusterDB, ".distribution.channel.counter.free")
		if err != nil {
			return nil, err
		}
		p.freeCounter = c
	}
	p.Transport.CreateServer().BindHandler(p.handle)
	return p, nil
}

func (lp *leaseProxy) handle(ctx context.Context, msg CreateMessage) (CreateMessage, error) {
	txn := lp.ClusterDB.OpenTx()
	err := lp.create(ctx, txn, &msg.Channels, msg.RetrieveIfNameExists)
	if err != nil {
		return CreateMessage{}, err
	}
	return CreateMessage{Channels: msg.Channels}, txn.Commit(ctx)
}

func (lp *leaseProxy) create(ctx context.Context, tx gorp.Tx, _channels *[]Channel, retrieveIfNameExists bool) error {
	channels := *_channels
	for i, ch := range channels {
		if ch.LocalKey != 0 {
			channels[i].LocalKey = 0
		}
		if ch.Leaseholder == 0 {
			channels[i].Leaseholder = lp.HostResolver.HostKey()
		}
	}
	batch := lp.router.Batch(channels)
	oChannels := make([]Channel, 0, len(channels))
	for nodeKey, entries := range batch.Peers {
		remoteChannels, err := lp.createRemote(ctx, nodeKey, entries, retrieveIfNameExists)
		if err != nil {
			return err
		}
		oChannels = append(oChannels, remoteChannels...)
	}
	if len(batch.Free) > 0 {
		if !lp.HostResolver.HostKey().IsBootstrapper() {
			remoteChannels, err := lp.createRemote(ctx, core.Bootstrapper, batch.Free, retrieveIfNameExists)
			if err != nil {
				return err
			}
			oChannels = append(oChannels, remoteChannels...)
		} else {
			err := lp.createFreeVirtual(ctx, tx, &batch.Free)
			if err != nil {
				return err
			}
			oChannels = append(oChannels, batch.Free...)
		}
	}
	err := lp.createGateway(ctx, tx, &batch.Gateway, retrieveIfNameExists)
	if err != nil {
		return err
	}
	oChannels = append(oChannels, batch.Gateway...)
	*_channels = oChannels
	return nil
}

func (lp *leaseProxy) createFreeVirtual(ctx context.Context, tx gorp.Tx, channels *[]Channel) error {
	if err := lp.assignVirtualKeys(channels); err != nil {
		return err
	}
	if err := gorp.NewCreate[Key, Channel]().Entries(channels).Exec(ctx, tx); err != nil {
		return err
	}
	return lp.maybeSetResources(ctx, tx, *channels)
}

func (lp *leaseProxy) createGateway(ctx context.Context, tx gorp.Tx, channels *[]Channel, retrieveIfNameExists bool) error {
	incCounterBy := uint16(len(*channels))
	if retrieveIfNameExists {
		names := NamesFromChannels(*channels)
		if err := gorp.NewRetrieve[Key, Channel]().Where(func(c *Channel) bool {
			v := lo.IndexOf(names, c.Name)
			exists := v != -1
			if exists {
				(*channels)[v] = *c
				if incCounterBy != 0 {
					incCounterBy--
				}
			}
			return exists
		}).Exec(ctx, tx); err != nil {
			return err
		}
	}

	if incCounterBy == 0 {
		return nil
	}
	v, err := lp.leasedCounter.Add(incCounterBy)
	if err != nil {
		return err
	}
	toCreate := make([]Channel, 0, incCounterBy)
	for i, ch := range *channels {
		if ch.LocalKey == 0 {
			ch.LocalKey = v - incCounterBy + uint16(i) + 1
			toCreate = append(toCreate, ch)
		} else if ch.IsIndex {
			ch.LocalIndex = ch.LocalKey
		}
		(*channels)[i] = ch
	}
	storageChannels := toStorage(toCreate)
	if err := lp.TSChannel.CreateChannel(ctx, storageChannels...); err != nil {
		return err
	}
	if err := gorp.NewCreate[Key, Channel]().Entries(&toCreate).Exec(ctx, tx); err != nil {
		return err
	}
	return lp.maybeSetResources(ctx, tx, toCreate)
}

func (lp *leaseProxy) assignVirtualKeys(channels *[]Channel) error {
	if lp.freeCounter == nil {
		panic("[leaseProxy] - tried to assign virtual keys on non-bootstrapper")
	}
	v, err := lp.freeCounter.Add(uint16(len(*channels)))
	if err != nil {
		return err
	}
	for i, ch := range *channels {
		ch.LocalKey = v - uint16(i)
		(*channels)[i] = ch
	}
	return nil
}

func (lp *leaseProxy) maybeSetResources(
	ctx context.Context,
	txn gorp.Tx,
	channels []Channel,
) error {
	if lp.Ontology != nil {
		w := lp.Ontology.NewWriter(txn)
		for _, ch := range channels {
			rtk := OntologyID(ch.Key())
			if err := w.DefineResource(ctx, rtk); err != nil {
				return err
			}
			if err := w.DefineRelationship(
				ctx,
				core.NodeOntologyID(ch.Leaseholder),
				ontology.ParentOf,
				rtk,
			); err != nil {
				return err
			}
			if err := w.DefineRelationship(
				ctx, group.OntologyID(lp.group.Key),
				ontology.ParentOf,
				rtk,
			); err != nil {
				return err
			}
		}
	}
	return nil
}

func (lp *leaseProxy) createRemote(
	ctx context.Context,
	target core.NodeKey,
	channels []Channel,
	retrieveIfNameExists bool,
) ([]Channel, error) {
	addr, err := lp.HostResolver.Resolve(target)
	if err != nil {
		return nil, err
	}
	cm := CreateMessage{Channels: channels, RetrieveIfNameExists: retrieveIfNameExists}
	res, err := lp.Transport.CreateClient().Send(ctx, addr, cm)
	if err != nil {
		return nil, err
	}
	return res.Channels, nil
}
