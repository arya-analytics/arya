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
	"github.com/synnaxlabs/x/errors"
	"github.com/synnaxlabs/x/gorp"
	"github.com/synnaxlabs/x/set"
	"github.com/synnaxlabs/x/types"
	"github.com/synnaxlabs/x/validate"
)

type leaseProxy struct {
	ServiceConfig
	createRouter    proxy.BatchFactory[Channel]
	keyRouter       proxy.BatchFactory[Key]
	leasedCounter   *counter
	freeCounter     *counter
	externalCounter *counter
	group           group.Group
	external        *set.Integer[LocalKey]
}

const leasedCounterSuffix = ".distribution.channel.leasedCounter"
const freeCounterSuffix = ".distribution.channel.counter.free"
const externalCounterSuffix = ".distribution.channel.externalCounter"

func newLeaseProxy(
	cfg ServiceConfig,
	group group.Group,
) (*leaseProxy, error) {
	leasedCounterKey := []byte(cfg.HostResolver.HostKey().String() + leasedCounterSuffix)
	c, err := openCounter(context.TODO(), cfg.ClusterDB, leasedCounterKey)
	if err != nil {
		return nil, err
	}
	externalCounterKey := []byte(cfg.HostResolver.HostKey().String() + externalCounterSuffix)
	extCtr, err := openCounter(context.TODO(), cfg.ClusterDB, externalCounterKey)
	if err != nil {
		return nil, err
	}
	p := &leaseProxy{
		ServiceConfig:   cfg,
		createRouter:    proxy.BatchFactory[Channel]{Host: cfg.HostResolver.HostKey()},
		keyRouter:       proxy.BatchFactory[Key]{Host: cfg.HostResolver.HostKey()},
		leasedCounter:   c,
		group:           group,
		externalCounter: extCtr,
		external:        &set.Integer[LocalKey]{},
	}
	if cfg.HostResolver.HostKey() == core.Bootstrapper {
		freeCounterKey := []byte(cfg.HostResolver.HostKey().String() + freeCounterSuffix)
		c, err := openCounter(context.TODO(), cfg.ClusterDB, freeCounterKey)
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
	batch := lp.createRouter.Batch(channels)
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
			err := lp.createFreeVirtual(ctx, tx, &batch.Free, retrieveIfNameExists)
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
	return lp.maybeSetResources(ctx, tx, oChannels)
}

func (lp *leaseProxy) createFreeVirtual(
	ctx context.Context,
	tx gorp.Tx,
	channels *[]Channel,
	retrieveIfNameExists bool,
) error {
	if lp.freeCounter == nil {
		panic("[leaseProxy] - tried to assign virtual keys on non-bootstrapper")
	}
	toCreate, err := lp.maybeRetrieveExisting(ctx, tx, channels, lp.freeCounter, retrieveIfNameExists)
	if err != nil {
		return err
	}
	if err := gorp.NewCreate[Key, Channel]().Entries(&toCreate).Exec(ctx, tx); err != nil {
		return err
	}
	return lp.maybeSetResources(ctx, tx, toCreate)
}

func (lp *leaseProxy) maybeRetrieveExisting(
	ctx context.Context,
	tx gorp.Tx,
	channels *[]Channel,
	counter *counter,
	retrieveIfNameExists bool,
) (toCreate []Channel, err error) {
	// This is the value we would increment by if retrieveIfNameExists is false or
	// if we don't find any names that already exist.
	incCounterBy := LocalKey(len(*channels))
	if retrieveIfNameExists {
		names := Names(*channels)
		if err = gorp.NewRetrieve[Key, Channel]().Where(func(c *Channel) bool {
			v := lo.IndexOf(names, c.Name)
			exists := v != -1
			if exists {
				// If it exists, replace it with the existing channel and decrement the
				// number of channels we need to create.
				(*channels)[v] = *c
				if incCounterBy != 0 {
					incCounterBy--
				}
			}
			return exists
		}).Exec(ctx, tx); err != nil {
			return
		}
	}
	nextCounterValue, err := counter.add(incCounterBy)
	if err != nil {
		return
	}

	toCreate = make([]Channel, 0, incCounterBy)
	for i, ch := range *channels {
		if ch.LocalKey == 0 {
			ch.LocalKey = nextCounterValue - incCounterBy + LocalKey(len(toCreate)) + 1
			toCreate = append(toCreate, ch)
		} else if ch.IsIndex {
			ch.LocalIndex = ch.LocalKey
		}
		(*channels)[i] = ch
	}

	return toCreate, nil
}

func (lp *leaseProxy) createGateway(
	ctx context.Context,
	tx gorp.Tx,
	channels *[]Channel,
	retrieveIfNameExists bool,
) error {
	toCreate, err := lp.maybeRetrieveExisting(ctx, tx, channels, lp.leasedCounter, retrieveIfNameExists)
	if err != nil {
		return err
	}
	storageChannels := toStorage(toCreate)
	if err := lp.TSChannel.CreateChannel(ctx, storageChannels...); err != nil {
		return err
	}
	if err := gorp.NewCreate[Key, Channel]().Entries(&toCreate).Exec(ctx, tx); err != nil {
		return err
	}

	externalCreatedKeys := make(Keys, 0, len(toCreate))
	for _, ch := range toCreate {
		if !ch.Internal {
			externalCreatedKeys = append(externalCreatedKeys, ch.Key())
		}
	}
	newExternalChannels := len(externalCreatedKeys)
	totalExternalChannels := LocalKey(newExternalChannels) + lp.externalCounter.value()
	if newExternalChannels != 0 {
		if err = lp.IntOverflowCheck(ctx, types.Uint20(totalExternalChannels)); err != nil {
			return err
		}
	}
	lp.external.Insert(externalCreatedKeys.Local()...)
	_, err = lp.externalCounter.add(LocalKey(newExternalChannels))
	if err != nil {
		return err
	}
	return nil
}

func (lp *leaseProxy) maybeSetResources(
	ctx context.Context,
	txn gorp.Tx,
	channels []Channel,
) error {
	if lp.Ontology == nil || lp.Group == nil {
		return nil
	}
	externalIds := lo.FilterMap(channels, func(ch Channel, _ int) (ontology.ID, bool) {
		return OntologyID(ch.Key()), !ch.Internal
	})
	w := lp.Ontology.NewWriter(txn)
	if err := w.DefineManyResources(ctx, externalIds); err != nil {
		return err
	}
	return w.DefineFromOneToManyRelationships(
		ctx,
		group.OntologyID(lp.group.Key),
		ontology.ParentOf,
		externalIds,
	)
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

func (lp *leaseProxy) deleteByName(ctx context.Context, tx gorp.Tx, names []string, allowInternal bool) error {
	var res []Channel
	if err := gorp.NewRetrieve[Key, Channel]().Entries(&res).Where(func(c *Channel) bool {
		return lo.Contains(names, c.Name)
	}).Exec(ctx, tx); err != nil {
		return err
	}
	keys := KeysFromChannels(res)
	return lp.delete(ctx, tx, keys, allowInternal)
}

func (lp *leaseProxy) delete(ctx context.Context, tx gorp.Tx, keys Keys, allowInternal bool) error {
	// Block channel deletion on Windows due to a bug in Cesium
	
	if !allowInternal {
		var internalChannels []Channel
		err := gorp.
			NewRetrieve[Key, Channel]().
			WhereKeys(keys...).
			Where(func(c *Channel) bool { return c.Internal }).
			Entries(&internalChannels).
			Exec(ctx, tx)
		if err != nil {
			return err
		}
		var names = make([]string, 0, len(internalChannels))
		if len(internalChannels) > 0 {
			for _, ch := range internalChannels {
				names = append(names, ch.Name)
			}
			return errors.Newf("can't delete internal channel(s): %v", names)
		}
	}

	batch := lp.keyRouter.Batch(keys)
	for nodeKey, entries := range batch.Peers {
		err := lp.deleteRemote(ctx, nodeKey, entries)
		if err != nil {
			return err
		}
	}
	if len(batch.Free) > 0 {
		err := lp.deleteFreeVirtual(ctx, tx, batch.Free)
		if err != nil {
			return err
		}
	}
	if err := lp.deleteGateway(ctx, tx, batch.Gateway); err != nil {
		return err
	}
	return lp.maybeDeleteResources(ctx, tx, keys)
}

func (lp *leaseProxy) deleteFreeVirtual(ctx context.Context, tx gorp.Tx, channels Keys) error {
	return gorp.NewDelete[Key, Channel]().WhereKeys(channels...).Exec(ctx, tx)
}

func (lp *leaseProxy) deleteGateway(ctx context.Context, tx gorp.Tx, keys Keys) error {
	deletedChannels := make([]Channel, 0, len(keys))
	if err := gorp.NewRetrieve[Key, Channel]().WhereKeys(keys...).Entries(&deletedChannels).Exec(ctx, tx); err != nil {
		return err
	}
	numExternalDeleted := lo.CountBy(deletedChannels, func(ch Channel) bool { return !ch.Internal })
	if _, err := lp.externalCounter.sub(LocalKey(numExternalDeleted)); err != nil {
		return err
	}
	if err := gorp.NewDelete[Key, Channel]().WhereKeys(keys...).Exec(ctx, tx); err != nil {
		return err
	}
	lp.external.Remove(keys.Local()...)
	if err := lp.TSChannel.DeleteChannels(keys.Storage()); err != nil {
		return err
	}
	return lp.maybeDeleteResources(ctx, tx, keys)
}

func (lp *leaseProxy) maybeDeleteResources(
	ctx context.Context,
	tx gorp.Tx,
	keys Keys,
) error {
	if lp.Ontology == nil {
		return nil
	}
	ids := lo.Map(keys, func(k Key, _ int) ontology.ID { return OntologyID(k) })
	w := lp.Ontology.NewWriter(tx)
	return w.DeleteManyResources(ctx, ids)
}

func (lp *leaseProxy) deleteRemote(ctx context.Context, target core.NodeKey, keys Keys) error {
	addr, err := lp.HostResolver.Resolve(target)
	if err != nil {
		return err
	}
	_, err = lp.Transport.DeleteClient().Send(ctx, addr, DeleteRequest{Keys: keys})
	return err
}

func (lp *leaseProxy) rename(
	ctx context.Context,
	tx gorp.Tx,
	keys Keys,
	names []string,
	allowInternal bool,
) error {
	if len(keys) != len(names) {
		return errors.Wrap(validate.Error, "keys and names must be the same length")
	}
	batch := lp.keyRouter.Batch(keys)
	for nodeKey, entries := range batch.Peers {
		err := lp.renameRemote(ctx, nodeKey, entries, names)
		if err != nil {
			return err
		}
	}
	if len(batch.Free) > 0 {
		err := lp.renameFreeVirtual(ctx, tx, batch.Free, names, allowInternal)
		if err != nil {
			return err
		}
	}
	return lp.renameGateway(ctx, tx, batch.Gateway, names, allowInternal)
}

func (lp *leaseProxy) renameRemote(ctx context.Context, target core.NodeKey, keys Keys, names []string) error {
	addr, err := lp.HostResolver.Resolve(target)
	if err != nil {
		return err
	}
	_, err = lp.Transport.RenameClient().Send(ctx, addr, RenameRequest{Keys: keys, Names: names})
	return err
}

func channelNameUpdater(allowInternal bool, keys Keys, names []string) func(Channel) (Channel, error) {
	return func(c Channel) (Channel, error) {
		if c.Internal && !allowInternal {
			return c, errors.Wrapf(validate.Error, "cannot rename internal channel %v", c)
		}
		c.Name = names[lo.IndexOf(keys, c.Key())]
		return c, nil
	}
}

func (lp *leaseProxy) renameFreeVirtual(ctx context.Context, tx gorp.Tx, channels Keys, names []string, allowInternal bool) error {
	return gorp.NewUpdate[Key, Channel]().
		WhereKeys(channels...).
		ChangeErr(channelNameUpdater(allowInternal, channels, names)).
		Exec(ctx, tx)
}

func (lp *leaseProxy) renameGateway(ctx context.Context, tx gorp.Tx, keys Keys, names []string, allowInternal bool) error {
	if err := gorp.NewUpdate[Key, Channel]().
		WhereKeys(keys...).
		ChangeErr(channelNameUpdater(allowInternal, keys, names)).
		Exec(ctx, tx); err != nil {
		return err
	}
	return lp.TSChannel.RenameChannels(ctx, keys.Storage(), names)
}
