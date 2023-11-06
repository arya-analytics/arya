// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

package channel_test

import (
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	"github.com/synnaxlabs/aspen"
	"github.com/synnaxlabs/synnax/pkg/distribution/channel"
	"github.com/synnaxlabs/synnax/pkg/distribution/core"
	"github.com/synnaxlabs/synnax/pkg/distribution/core/mock"
	"github.com/synnaxlabs/x/query"
	"github.com/synnaxlabs/x/telem"
)

var _ = Describe("TypedWriter", Ordered, func() {
	var (
		services map[core.NodeKey]channel.Service
		builder  *mock.CoreBuilder
	)
	BeforeAll(func() { builder, services = provisionServices() })
	AfterAll(func() {
		Expect(builder.Close()).To(Succeed())
		Expect(builder.Cleanup()).To(Succeed())
	})
	Context("Single channel", func() {
		var ch channel.Channel
		JustBeforeEach(func() {
			var err error
			ch.Rate = 5 * telem.Hz
			ch.Name = "SG01"
			ch.DataType = telem.Float64T
			err = services[1].Create(ctx, &ch)
			Expect(err).ToNot(HaveOccurred())
		})
		Context("Node is local", func() {
			BeforeEach(func() { ch.Leaseholder = 1 })
			It("Should create the channel without error", func() {
				Expect(ch.Key().Leaseholder()).To(Equal(aspen.NodeKey(1)))
				Expect(ch.Key().LocalKey()).To(Equal(uint16(1)))
			})
			It("Should not create the channel if it already exists by name", func() {
				Expect(services[1].CreateIfNameDoesntExist(ctx, &ch)).To(Succeed())
				Expect(ch.LocalKey).To(Equal(uint16(2)))
			})
			It("Should create the channel in the cesium gorpDB", func() {
				channels, err := builder.Cores[1].Storage.TS.RetrieveChannels(ctx, ch.Key().StorageKey())
				Expect(err).ToNot(HaveOccurred())
				Expect(channels).To(HaveLen(1))
				cesiumCH := channels[0]
				Expect(cesiumCH.Key).To(Equal(ch.Key().StorageKey()))
				Expect(cesiumCH.DataType).To(Equal(telem.Float64T))
				Expect(cesiumCH.Rate).To(Equal(5 * telem.Hz))
			})
		})
		Context("Node is remote", func() {
			BeforeEach(func() { ch.Leaseholder = 2 })
			It("Should create the channel without error", func() {
				Expect(ch.Key().Leaseholder()).To(Equal(aspen.NodeKey(2)))
				Expect(ch.Key().LocalKey()).To(Equal(uint16(1)))
			})
			It("Should create the channel in the cesium gorpDB", func() {
				channels, err := builder.Cores[2].Storage.TS.RetrieveChannels(ctx, ch.Key().StorageKey())
				Expect(err).ToNot(HaveOccurred())
				Expect(channels).To(HaveLen(1))
				cesiumCH := channels[0]
				Expect(cesiumCH.DataType).To(Equal(telem.Float64T))
				Expect(cesiumCH.Rate).To(Equal(5 * telem.Hz))
			})
			It("Should not create the channel on another nodes cesium", func() {
				channels, err := builder.Cores[1].Storage.TS.RetrieveChannels(ctx, ch.Key().StorageKey())
				Expect(err).To(MatchError(query.NotFound))
				Expect(channels).To(HaveLen(0))
			})
			It("Should assign a sequential key to the channels on each node",
				func() {
					ch2 := &channel.Channel{
						Rate:        5 * telem.Hz,
						Name:        "SG01",
						DataType:    telem.Float64T,
						Leaseholder: 1,
					}
					err := services[1].NewWriter(nil).Create(ctx, ch2)
					Expect(err).To(BeNil())
					Expect(ch2.Key().Leaseholder()).To(Equal(aspen.NodeKey(1)))
					Expect(ch2.Key().LocalKey()).To(Equal(uint16(4)))
				})
		})
		Context("Free", func() {
			BeforeEach(func() {
				ch.Leaseholder = core.Free
				ch.Virtual = true
			})
			It("Should create the channel without error", func() {
				Expect(ch.Key().Leaseholder()).To(Equal(aspen.Free))
				Expect(ch.Key().LocalKey()).To(Equal(uint16(1)))
				channels, err := builder.Cores[1].Storage.TS.RetrieveChannels(ctx, ch.Key().StorageKey())
				Expect(err).To(MatchError(query.NotFound))
				Expect(channels).To(HaveLen(0))
			})
		})
	})
	Context("Creating if name doesn't exist", func() {
		var ch channel.Channel
		BeforeEach(func() {
			ch.Rate = 5 * telem.Hz
			ch.Name = "SG0001"
			ch.DataType = telem.Float64T
			ch.Leaseholder = 1
		})
		It("Should create the channel without error", func() {
			Expect(services[1].CreateIfNameDoesntExist(ctx, &ch)).To(Succeed())
			Expect(ch.Key().Leaseholder()).To(Equal(aspen.NodeKey(1)))
			Expect(ch.Key().LocalKey()).To(Not(Equal(uint16(0))))
		})
		It("Should not create the channel if it already exists by name", func() {
			Expect(services[1].CreateIfNameDoesntExist(ctx, &ch)).To(Succeed())
			k := ch.Key()
			ch.Leaseholder = 0
			ch.LocalKey = 0
			Expect(services[1].CreateIfNameDoesntExist(ctx, &ch)).To(Succeed())
			Expect(ch.Key()).To(Equal(k))
			Expect(ch.Key().Leaseholder()).To(Equal(aspen.NodeKey(1)))
		})
		It("Should not create a free channel if it already exists by name", func() {
			ch.Name = "SG0002"
			ch.Virtual = true
			ch.Leaseholder = core.Free
			Expect(services[1].CreateIfNameDoesntExist(ctx, &ch)).To(Succeed())
			Expect(ch.Key().Leaseholder()).To(Equal(aspen.Free))
			k := ch.Key()
			ch.LocalKey = 0
			ch.Leaseholder = 0
			Expect(services[1].CreateIfNameDoesntExist(ctx, &ch)).To(Succeed())
			Expect(ch.Key()).To(Equal(k))
			Expect(ch.Key().Leaseholder()).To(Equal(aspen.Free))
		})
	})
})
