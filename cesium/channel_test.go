// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

package cesium_test

import (
	"github.com/cockroachdb/errors"
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	"github.com/synnaxlabs/cesium"
	"github.com/synnaxlabs/cesium/internal/core"
	"github.com/synnaxlabs/x/control"
	"github.com/synnaxlabs/x/telem"
	. "github.com/synnaxlabs/x/testutil"
	"github.com/synnaxlabs/x/validate"
	"os"
)

var _ = Describe("Channel", func() {
	for fsName, makeFS := range fileSystems {
		fs := makeFS()
		Context("FS: "+fsName, Ordered, func() {
			var db *cesium.DB
			BeforeAll(func() { db = openDBOnFS(fs) })
			AfterAll(func() {
				Expect(db.Close()).To(Succeed())
				Expect(fs.Remove(rootPath)).To(Succeed())
			})
			Describe("Create", func() {
				Describe("Happy Path", func() {
					It("Should assign an auto-incremented key if a key is not present", func() {
						ch := cesium.Channel{Key: 1, Rate: 10 * telem.Hz, DataType: telem.Float64T}
						Expect(db.CreateChannel(ctx, ch)).To(Succeed())
						Expect(ch.Key).To(Equal(core.ChannelKey(1)))
					})
				})
				DescribeTable("Validation", func(expected error, channels ...cesium.Channel) {
					Expect(db.CreateChannel(ctx, channels...)).To(HaveOccurredAs(expected))
				},
					Entry("ChannelKey has no datatype",
						errors.Wrap(validate.Error, "[cesium] - data type must be set"),
						cesium.Channel{Key: 10, Rate: 10 * telem.Hz},
					),
					Entry("ChannelKey key already exists",
						errors.Wrap(validate.Error, "[cesium] - channel 11 already exists"),
						cesium.Channel{Key: 11, DataType: telem.Float32T, Rate: 10 * telem.Hz},
						cesium.Channel{Key: 11, Rate: 10 * telem.Hz, DataType: telem.Float64T},
					),
					Entry("ChannelKey IsIndex - Non Int64 Series Variant",
						errors.Wrap(validate.Error, "[cesium] - index channel must be of type timestamp"),
						cesium.Channel{Key: 12, IsIndex: true, DataType: telem.Float32T},
					),
					Entry("ChannelKey IsIndex - LocalIndex non-zero",
						errors.Wrap(validate.Error, "[cesium] - index channel cannot be indexed by another channel"),
						cesium.Channel{Key: 45, IsIndex: true, DataType: telem.TimeStampT},
						cesium.Channel{Key: 46, IsIndex: true, Index: 45, DataType: telem.TimeStampT},
					),
					Entry("ChannelKey has index - LocalIndex does not exist",
						errors.Wrapf(validate.Error, "[cesium] - index %s does not exist", "40000"),
						cesium.Channel{Key: 47, Index: 40000, DataType: telem.Float64T},
					),
					Entry("ChannelKey has no index - fixed rate not provided",
						errors.Wrap(validate.Error, "[cesium] - rate must be positive"),
						cesium.Channel{Key: 48, DataType: telem.Float32T},
					),
					Entry("ChannelKey has index - provided index key is not an indexed channel",
						errors.Wrap(validate.Error, "[cesium] - channel 60 is not an index"),
						cesium.Channel{Key: 60, DataType: telem.Float32T, Rate: 1 * telem.Hz},
						cesium.Channel{Key: 61, Index: 60, DataType: telem.Float32T},
					),
				)
			})

			Describe("Rekey", func() {
				var (
					unaryKey   cesium.ChannelKey = 70
					virtualKey cesium.ChannelKey = 71
					indexKey   cesium.ChannelKey = 72
					dataKey    cesium.ChannelKey = 73
					data2Key   cesium.ChannelKey = 74
					errorKey1  cesium.ChannelKey = 75
					errorKey2  cesium.ChannelKey = 76
					errorKey3  cesium.ChannelKey = 77

					channels = []cesium.Channel{
						{Key: unaryKey, DataType: telem.Int64T, Rate: 1 * telem.Hz},
						{Key: virtualKey, Virtual: true, DataType: telem.Int64T},
						{Key: indexKey, DataType: telem.TimeStampT, IsIndex: true},
						{Key: dataKey, DataType: telem.Int64T, Index: indexKey},
						{Key: data2Key, DataType: telem.Int64T, Index: indexKey},
						{Key: errorKey1, DataType: telem.Int64T, Rate: 1 * telem.Hz},
						{Key: errorKey2, Virtual: true, DataType: telem.Int64T},
					}
				)
				BeforeAll(func() {
					Expect(db.CreateChannel(ctx, channels...)).To(Succeed())
				})
				It("Should rekey a unary channel into another", func() {
					By("Writing some data into the channel")
					Expect(db.WriteArray(ctx, unaryKey, 0, telem.NewSeriesV[int64](2, 3, 5, 7, 11))).To(Succeed())
					Expect(db.WriteArray(ctx, unaryKey, 5*telem.SecondTS, telem.NewSeriesV[int64](13, 17, 19, 23, 29))).To(Succeed())

					By("Renaming the channel")
					Expect(db.RenameChannel(unaryKey, unaryKey*10)).To(Succeed())

					By("Asserting the old channel no longer exists")
					_, err := db.RetrieveChannel(ctx, unaryKey)
					Expect(err).To(MatchError(core.ChannelNotFound))
					Expect(MustSucceed(fs.Exists(channelKeyToPath(unaryKey)))).To(BeFalse())

					By("Asserting the channel can be found at the new key")
					ch := MustSucceed(db.RetrieveChannel(ctx, unaryKey*10))
					Expect(ch.Key).To(Equal(unaryKey * 10))

					By("Asserting that reads and writes on the channel still work")
					Expect(db.WriteArray(ctx, unaryKey*10, 10*telem.SecondTS, telem.NewSeriesV[int64](31, 37, 41, 43, 47))).To(Succeed())
					f := MustSucceed(db.Read(ctx, telem.TimeRangeMax, unaryKey*10))
					Expect(f.Series[0].Data).To(Equal(telem.NewSeriesV[int64](2, 3, 5, 7, 11).Data))
					Expect(f.Series[1].Data).To(Equal(telem.NewSeriesV[int64](13, 17, 19, 23, 29).Data))
					Expect(f.Series[2].Data).To(Equal(telem.NewSeriesV[int64](31, 37, 41, 43, 47).Data))
				})

				It("Should rekey a virtual channel into another", func() {
					By("Renaming the channel")
					Expect(db.RenameChannel(virtualKey, virtualKey*10)).To(Succeed())

					By("Asserting the old channel no longer exists")
					_, err := db.RetrieveChannel(ctx, virtualKey)
					Expect(err).To(MatchError(core.ChannelNotFound))
					Expect(MustSucceed(fs.Exists(channelKeyToPath(virtualKey)))).To(BeFalse())

					By("Asserting the channel and data can be found at the new key")
					ch := MustSucceed(db.RetrieveChannel(ctx, virtualKey*10))
					Expect(ch.Key).To(Equal(virtualKey * 10))
				})

				It("Should rekey an index channel", func() {
					By("Writing some data into the channel")
					Expect(db.Write(ctx, 2*telem.SecondTS, cesium.NewFrame(
						[]core.ChannelKey{indexKey, dataKey, data2Key},
						[]telem.Series{telem.NewSecondsTSV(2, 3, 5, 7, 11), telem.NewSeriesV[int64](2, 3, 5, 7, 11), telem.NewSeriesV[int64](20, 30, 50, 70, 110)},
					))).To(Succeed())

					By("Renaming the channel")
					Expect(db.RenameChannel(indexKey, indexKey*10)).To(Succeed())

					By("Asserting the old channel no longer exists")
					_, err := db.RetrieveChannel(ctx, indexKey)
					Expect(err).To(MatchError(core.ChannelNotFound))
					Expect(MustSucceed(fs.Exists(channelKeyToPath(indexKey)))).To(BeFalse())

					By("Asserting the channel can be found at the new key")
					ch := MustSucceed(db.RetrieveChannel(ctx, indexKey*10))
					Expect(ch.Key).To(Equal(indexKey * 10))

					By("Asserting that reads and writes on the channel still work")
					Expect(db.Write(ctx, 13*telem.SecondTS, cesium.NewFrame(
						[]core.ChannelKey{indexKey * 10, dataKey, data2Key},
						[]telem.Series{telem.NewSecondsTSV(13, 17, 19, 23, 29), telem.NewSeriesV[int64](13, 17, 19, 23, 29), telem.NewSeriesV[int64](130, 170, 190, 230, 290)},
					))).To(Succeed())
					f := MustSucceed(db.Read(ctx, telem.TimeRangeMax, indexKey*10, dataKey, data2Key))
					Expect(f.Series[0].Data).To(Equal(telem.NewSecondsTSV(2, 3, 5, 7, 11).Data))
					Expect(f.Series[1].Data).To(Equal(telem.NewSecondsTSV(13, 17, 19, 23, 29).Data))

					Expect(f.Series[2].Data).To(Equal(telem.NewSeriesV[int64](2, 3, 5, 7, 11).Data))
					Expect(f.Series[3].Data).To(Equal(telem.NewSeriesV[int64](13, 17, 19, 23, 29).Data))

					Expect(f.Series[4].Data).To(Equal(telem.NewSeriesV[int64](20, 30, 50, 70, 110).Data))
					Expect(f.Series[5].Data).To(Equal(telem.NewSeriesV[int64](130, 170, 190, 230, 290).Data))
				})

				Describe("Rekey of channel with a writer", func() {
					Specify("Unary", func() {
						By("Opening a writer")
						w := MustSucceed(db.OpenWriter(ctx, cesium.WriterConfig{Start: 0, Channels: []cesium.ChannelKey{errorKey1}, ControlSubject: control.Subject{Key: "rekey writer"}}))

						By("Trying to rekey")
						Expect(db.RenameChannel(errorKey1, errorKey1*10)).To(MatchError(ContainSubstring("1 unclosed writers/iterators")))

						By("Closing writer")
						Expect(w.Close()).To(Succeed())

						By("Asserting that rekey is successful now")
						Expect(db.RenameChannel(errorKey1, errorKey1*10)).To(Succeed())

						By("Asserting the old channel no longer exists")
						_, err := db.RetrieveChannel(ctx, errorKey1)
						Expect(err).To(MatchError(core.ChannelNotFound))
						Expect(MustSucceed(fs.Exists(channelKeyToPath(errorKey1)))).To(BeFalse())

						By("Asserting the channel can be found at the new key")
						ch := MustSucceed(db.RetrieveChannel(ctx, errorKey1*10))
						Expect(ch.Key).To(Equal(errorKey1 * 10))

						By("Asserting that reads and writes on the channel still work")
						Expect(db.WriteArray(ctx, errorKey1*10, 10*telem.SecondTS, telem.NewSeriesV[int64](31, 37, 41, 43, 47))).To(Succeed())
						f := MustSucceed(db.Read(ctx, telem.TimeRangeMax, errorKey1*10))
						Expect(f.Series[0].Data).To(Equal(telem.NewSeriesV[int64](31, 37, 41, 43, 47).Data))
					})
					Specify("Virtual", func() {
						By("Opening a writer")
						w := MustSucceed(db.OpenWriter(ctx, cesium.WriterConfig{Start: 0, Channels: []cesium.ChannelKey{errorKey2}, ControlSubject: control.Subject{Key: "rekey writer"}}))

						By("Trying to rekey")
						Expect(db.RenameChannel(errorKey2, errorKey2*10)).To(MatchError(ContainSubstring("1 unclosed writers")))

						By("Closing writer")
						Expect(w.Close()).To(Succeed())

						By("Asserting that rekey is successful now")
						Expect(db.RenameChannel(errorKey2, errorKey2*10)).To(Succeed())

						By("Asserting the old channel no longer exists")
						_, err := db.RetrieveChannel(ctx, errorKey2)
						Expect(err).To(MatchError(core.ChannelNotFound))
						Expect(MustSucceed(fs.Exists(channelKeyToPath(errorKey2)))).To(BeFalse())

						By("Asserting the channel can be found at the new key")
						ch := MustSucceed(db.RetrieveChannel(ctx, errorKey2*10))
						Expect(ch.Key).To(Equal(errorKey2 * 10))
					})
				})

				It("Should do nothing for a channel that does not exist", func() {
					By("Trying to rekey")
					Expect(db.RenameChannel(errorKey3, errorKey3*10)).To(Succeed())
				})
			})
			Describe("Opening db on existing folder", func() {
				It("Should not panic when opening a db in a directory with already existing files", func() {
					s := MustSucceed(fs.Sub("sub"))
					MustSucceed(s.Sub("1234notnumeric"))
					f := MustSucceed(s.Open("123.txt", os.O_CREATE))
					Expect(f.Close()).To(Succeed())

					db, err := cesium.Open("", cesium.WithFS(s))
					Expect(err).ToNot(HaveOccurred())
					Expect(db.Close()).To(Succeed())
				})

				It("Should error when numeric folders do not have meta.json file", func() {
					s := MustSucceed(fs.Sub("sub"))
					_, err := s.Sub("1")
					Expect(err).ToNot(HaveOccurred())

					_, err = cesium.Open("", cesium.WithFS(s))
					Expect(err).To(HaveOccurredAs(validate.Error))
				})

				It("Should not error when db gets created with proper numeric folders", func() {
					s := MustSucceed(fs.Sub("sub0"))
					db := MustSucceed(cesium.Open("", cesium.WithFS(s)))
					key := GenerateChannelKey()

					Expect(db.CreateChannel(ctx, cesium.Channel{Key: key, Rate: 1 * telem.Hz, DataType: telem.Int64T})).To(Succeed())
					Expect(db.Close()).To(Succeed())

					db = MustSucceed(cesium.Open("", cesium.WithFS(s)))
					ch, err := db.RetrieveChannel(ctx, key)
					Expect(err).ToNot(HaveOccurred())

					Expect(ch.Key).To(Equal(key))
					Expect(ch.Rate).To(Equal(1 * telem.Hz))

					Expect(db.Write(ctx, 1*telem.SecondTS, cesium.NewFrame(
						[]cesium.ChannelKey{key},
						[]telem.Series{telem.NewSeriesV[int64](1, 2, 3, 4, 5)},
					))).To(Succeed())

					f := MustSucceed(db.Read(ctx, telem.TimeRangeMax, key))
					Expect(f.Series[0].Data).To(Equal(telem.NewSeriesV[int64](1, 2, 3, 4, 5).Data))
				})

				It("Should not error when db is opened on existing directory", func() {
					s := MustSucceed(fs.Sub("sub3"))
					db := MustSucceed(cesium.Open("", cesium.WithFS(s)))
					indexKey := GenerateChannelKey()
					key := GenerateChannelKey()

					By("Opening two channels")
					Expect(db.CreateChannel(ctx, cesium.Channel{Key: indexKey, IsIndex: true, DataType: telem.TimeStampT})).To(Succeed())
					Expect(db.CreateChannel(ctx, cesium.Channel{Key: key, Index: indexKey, DataType: telem.Int64T})).To(Succeed())
					Expect(db.Write(ctx, 1*telem.SecondTS, cesium.NewFrame(
						[]cesium.ChannelKey{indexKey, key},
						[]telem.Series{telem.NewSecondsTSV(1, 2, 3, 4, 5), telem.NewSeriesV[int64](1, 2, 3, 4, 5)},
					))).To(Succeed())

					By("Closing the db")
					Expect(db.Close()).To(Succeed())

					By("Reopening the db on the file system with existing data")
					db = MustSucceed(cesium.Open("", cesium.WithFS(s)))
					ch := MustSucceed(db.RetrieveChannel(ctx, key))
					Expect(ch).ToNot(BeNil())
					Expect(ch.Key).To(Equal(key))
					Expect(ch.Index).To(Equal(indexKey))
					Expect(ch.DataType).To(Equal(telem.Int64T))

					ch = MustSucceed(db.RetrieveChannel(ctx, indexKey))
					Expect(ch).ToNot(BeNil())
					Expect(ch.Key).To(Equal(indexKey))
					Expect(ch.IsIndex).To(BeTrue())
					Expect(ch.DataType).To(Equal(telem.TimeStampT))

					By("Asserting that writes to the db still occurs normally")
					Expect(db.Write(ctx, 11*telem.SecondTS, cesium.NewFrame(
						[]cesium.ChannelKey{key, indexKey},
						[]telem.Series{telem.NewSeriesV[int64](11, 12, 13, 14, 15), telem.NewSecondsTSV(11, 12, 13, 14, 15)},
					))).To(Succeed())

					f := MustSucceed(db.Read(ctx, telem.TimeRangeMax, key))
					Expect(f.Series[0].TimeRange).To(Equal((1 * telem.SecondTS).Range(5*telem.SecondTS + 1)))
					Expect(f.Series[0].Data).To(Equal(telem.NewSeriesV[int64](1, 2, 3, 4, 5).Data))

					Expect(f.Series[1].TimeRange).To(Equal((11 * telem.SecondTS).Range(15*telem.SecondTS + 1)))
					Expect(f.Series[1].Data).To(Equal(telem.NewSeriesV[int64](11, 12, 13, 14, 15).Data))
				})
			})
		})
	}
})
