// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

package api_test

import (
	"context"
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	"github.com/synnaxlabs/synnax/pkg/api"
	"github.com/synnaxlabs/synnax/pkg/api/mock"
	"github.com/synnaxlabs/synnax/pkg/distribution/channel"
	"github.com/synnaxlabs/x/telem"
)

var _ = Describe("ChannelReader", Ordered, func() {
	var (
		builder *mock.Builder
		prov    api.Provider
		svc     *api.ChannelService
	)
	BeforeAll(func() {
		builder = mock.Open()
		prov = builder.New(ctx)
		svc = api.NewChannelService(prov)
		res, err := svc.Create(context.TODO(), api.ChannelCreateRequest{
			Channels: []api.Channel{{
				Name:        "test",
				Leaseholder: 1,
				DataType:    telem.Float64T,
				Rate:        25 * telem.Hz,
			}},
		})
		Expect(err).To(BeNil())
		Expect(res.Channels).To(HaveLen(1))
	})
	AfterAll(func() {
		Expect(builder.Close()).To(Succeed())
		Expect(builder.Cleanup()).To(Succeed())
	})
	Describe("Create", func() {
		DescribeTable("Validation Errors", func(
			ch api.Channel,
			field string,
			message string,
		) {
			_, err := svc.Create(context.TODO(), api.ChannelCreateRequest{
				Channels: []api.Channel{ch},
			})
			Expect(err).To(HaveOccurred())
			//Expect(err.Err).To(HaveOccurred())
			//flds, ok := err.Err.(errors.Fields)
			//Expect(ok).To(BeTrue())
			//Expect(flds[0].Field).To(Equal(field))
			//Expect(flds[0].Message).To(Equal(message))
			//Expect(len(res.Channels)).To(Equal(0))
		},
			Entry("No Data Variant", api.Channel{
				Name:        "test",
				Leaseholder: 1,
				Rate:        25 * telem.Hz,
			}, "channels[0].data_type", "required"),
		)
	})
	Describe("RetrieveP", func() {
		It("Should retrieve all created channels", func() {
			res, err := svc.Retrieve(context.TODO(), api.ChannelRetrieveRequest{})
			Expect(err).To(BeNil())
			Expect(len(res.Channels)).To(BeNumerically(">", 0))
		})
		It("Should retrieve a Channel by its key", func() {
			res, err := svc.Retrieve(context.TODO(), api.ChannelRetrieveRequest{
				Keys: channel.Keys{channel.NewKey(1, 1)},
			})
			Expect(err).To(BeNil())
			Expect(res.Channels).To(HaveLen(1))
		})
		It("Should retrieve channels by their node Name", func() {
			res, err := svc.Retrieve(context.TODO(), api.ChannelRetrieveRequest{
				NodeKey: 1,
			})
			Expect(err).To(BeNil())
			Expect(res.Channels).To(HaveLen(1))
		})
		It("Should retrieve channels by their name", func() {
			res, err := svc.Retrieve(context.TODO(), api.ChannelRetrieveRequest{
				Names: []string{"test"},
			})
			Expect(err).To(BeNil())
			Expect(res.Channels).To(HaveLen(1))
			for _, ch := range res.Channels {
				Expect(ch.Name).To(Equal("test"))
			}
		})
	})
})
