// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

package deleter

import (
	"github.com/synnaxlabs/synnax/pkg/distribution/core"
	"github.com/synnaxlabs/synnax/pkg/storage/ts"
	"github.com/synnaxlabs/x/config"
	"github.com/synnaxlabs/x/gorp"
	"github.com/synnaxlabs/x/override"
	"github.com/synnaxlabs/x/validate"
)

type Service interface {
	Deletable
}

type Deletable interface {
	Deleter
	NewDeleter(tx gorp.Tx) Deleter
}

type service struct {
	*gorp.DB
	Deleter
	proxy *leaseProxy
}

var _ Service = (*service)(nil)

type ServiceConfig struct {
	HostResolver core.HostResolver
	TSChannel    *ts.DB
	Transport    Transport
}

var _ config.Config[ServiceConfig] = ServiceConfig{}

func (c ServiceConfig) Validate() error {
	v := validate.New("distribution.framer.deleter")
	validate.NotNil(v, "HostProvider", c.HostResolver)
	validate.NotNil(v, "TSChannel", c.TSChannel)
	validate.NotNil(v, "Transport", c.Transport)
	return v.Error()
}

func (c ServiceConfig) Override(other ServiceConfig) ServiceConfig {
	c.HostResolver = override.Nil(c.HostResolver, other.HostResolver)
	c.TSChannel = override.Nil(c.TSChannel, other.TSChannel)
	c.Transport = override.Nil(c.Transport, other.Transport)
	return c
}

var DefaultConfig = ServiceConfig{}

func New(configs ...ServiceConfig) (Service, error) {
	cfg, err := config.New(DefaultConfig, configs...)
	if err != nil {
		return nil, err
	}
	proxy, err := newLeaseProxy(cfg)
	if err != nil {
		return nil, err
	}
	s := &service{
		proxy: proxy,
	}
	s.Deleter = s.NewDeleter(nil)
	return s, nil
}

func (s *service) NewDeleter(tx gorp.Tx) Deleter {
	return deleter{proxy: s.proxy, tx: s.DB.OverrideTx(tx)}
}
