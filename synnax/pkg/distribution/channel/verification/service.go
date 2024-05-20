// Copyright 2024 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

package verification

import (
	"errors"
	"io"
	"strconv"
	"time"

	"github.com/synnaxlabs/alamos"
	"github.com/synnaxlabs/x/config"
	"github.com/synnaxlabs/x/kv"
	"github.com/synnaxlabs/x/override"
	"github.com/synnaxlabs/x/signal"
	"github.com/synnaxlabs/x/validate"
	"go.uber.org/zap"
	"golang.org/x/net/context"
)

type Config struct {
	DB            kv.DB
	Ins           alamos.Instrumentation
	WarningTime   time.Duration
	CheckInterval time.Duration
}

var (
	_             config.Config[Config] = Config{}
	DefaultConfig                       = Config{
		WarningTime:   7 * 24 * time.Hour,
		CheckInterval: 24 * time.Hour,
	}
	errStale, errFree error
)

func (c Config) Validate() error {
	v := validate.New("key")
	validate.NotNil(v, "DB", c.DB)
	validate.NonZero(v, decode("V2FybmluZ1RpbWU="), c.WarningTime)
	validate.NonZero(v, decode("Q2hlY2tJbnRlcnZhbA=="), c.CheckInterval)
	return v.Error()
}

func (c Config) Override(other Config) Config {
	c.DB = override.Nil(c.DB, other.DB)
	c.Ins = override.Zero(c.Ins, other.Ins)
	c.WarningTime = override.If(c.WarningTime, other.WarningTime, other.WarningTime.Nanoseconds() != 0)
	return c
}

type Service struct {
	Config
	shutdown io.Closer
}

func OpenService(toOpen string, cfgs ...Config) (*Service, error) {
	cfg, err := config.New(DefaultConfig, cfgs...)
	if err != nil {
		return nil, err
	}
	service := &Service{Config: cfg}

	sCtx, cancel := signal.Isolated(signal.WithInstrumentation(service.Ins))
	service.shutdown = signal.NewShutdown(sCtx, cancel)

	var ctx context.Context
	if toOpen == "" {
		return service, nil
	}

	err = service.create(ctx, toOpen)
	if err != nil {
		return service, err
	}
	sCtx.Go(service.logValidation)

	return service, err
}

// Close will shutdown the service
func (s *Service) Close() error {
	return s.shutdown.Close()
}

func (s *Service) IsOverflowed(ctx context.Context, inUse int64) error {
	key, err := s.retrieve(ctx)

	if err != nil {
		if inUse > freeCount {
			return errFree
		}
		return nil
	}

	if whenStale(key).Before(time.Now()) {
		if inUse > freeCount {
			return errStale
		}
		return nil
	}

	if channelsAllowed := getNumChan(key); inUse > channelsAllowed {
		return errTooMany(int(channelsAllowed))
	}

	return nil
}

func (s *Service) IsExpired(ctx context.Context) error {
	retrieved, err := s.retrieve(ctx)
	if err != nil {
		return errFree

	}
	if whenStale(retrieved).Before(time.Now()) {
		return errStale
	}
	return nil
}

func (s *Service) GetNumBeforeOverflow() int {
	return freeCount
}

func (s *Service) create(ctx context.Context, toCreate string) error {
	err := validateInput(toCreate)
	if err != nil {
		return err
	}
	return s.DB.Set(ctx, []byte("bGljZW5zZUtleQ=="), []byte(toCreate))
}

func (s *Service) retrieve(ctx context.Context) (string, error) {
	key, err := s.DB.Get(ctx, []byte("bGljZW5zZUtleQ=="))
	return string(key), err
}

func (s *Service) logValidation(ctx context.Context) error {

	key, err := s.retrieve(ctx)
	if err != nil {
		return err
	}
	whenStale := whenStale(key)
	ticker := time.NewTicker(s.CheckInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-ticker.C:
			if whenStale.Before(time.Now()) {
				s.Ins.L.Error(decode("TGljZW5zZSBrZXkgZXhwaXJlZC4gQWNjZXNzIGhhcyBiZWVuIGxpbWl0ZWQu"),
					zap.String("ZXhwaXJlZEF0", whenStale.String()))
			} else if timeLeft := time.Until(whenStale); timeLeft <= s.WarningTime {
				s.Ins.L.Warn(decode("TGljZW5zZSBrZXkgd2lsbCBleHBpcmUgc29vbi4gQWNjZXNzIHdpbGwgYmUgbGltaXRlZC4="),
					zap.String(decode("ZXhwaXJlc0lu"), timeLeft.String()))
			} else {
				s.Ins.L.Info(decode("TGljZW5zZSBrZXkgaXMgbm90IGV4cGlyZWQu"),
					zap.String(decode("ZXhwaXJlc0lu"), timeLeft.String()))
			}
		}
	}
}

func errTooMany(count int) error {
	msg := decode("dXNpbmcgbW9yZSB0aGFuIA==") + strconv.Itoa(count) +
		decode("IGNoYW5uZWxzIGFsbG93ZWQ=")
	return errors.New(msg)
}

func init() {
	msg := decode("dXNpbmcgYW4gZXhwaXJlZCBwcm9kdWN0IGxpY2Vuc2Uga2V5LCB1c2UgaXMgbGltaXRlZCB0byB0aGUgZmlyc3Qg") +
		strconv.Itoa(freeCount) + decode("IGNoYW5uZWxz")
	errStale = errors.New(msg)
	msg = decode("dXNpbmcgbW9yZSB0aGFuIA==") + strconv.Itoa(freeCount) +
		decode("IGNoYW5uZWxzIHdpdGhvdXQgYSBwcm9kdWN0IGxpY2Vuc2Uga2V5")
	errFree = errors.New(msg)
}
