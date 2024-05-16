package unary_test

import (
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	"github.com/synnaxlabs/cesium/internal/core"
	"github.com/synnaxlabs/cesium/internal/unary"
	"github.com/synnaxlabs/x/telem"
	. "github.com/synnaxlabs/x/testutil"
	"math"
)

var _ = Describe("Garbage Collection", func() {
	for fsName, makeFS := range fileSystems {
		fs := makeFS()
		Context("FS: "+fsName, func() {
			var (
				rateDB    *unary.DB
				dataDB    *unary.DB
				indexDB   *unary.DB
				rateKey   core.ChannelKey = 1
				dataKey   core.ChannelKey = 2
				indexKey  core.ChannelKey = 3
				pth_rate                  = rootPath + "/garbage_test/rate"
				pth_index                 = rootPath + "/garbage_test/index"
				pth_data                  = rootPath + "/garbage_test/data"
			)
			Describe("Garbage collection without threshold", func() {
				BeforeEach(func() {
					rateDB = MustSucceed(unary.Open(unary.Config{
						FS: MustSucceed(fs.Sub(pth_rate)),
						Channel: core.Channel{
							Key:      rateKey,
							DataType: telem.Int64T,
							Rate:     1 * telem.Hz,
						},
						GCThreshold: math.SmallestNonzeroFloat32,
					}))
					indexDB = MustSucceed(unary.Open(unary.Config{
						FS: MustSucceed(fs.Sub(pth_index)),
						Channel: core.Channel{
							Key:      indexKey,
							DataType: telem.TimeStampT,
							IsIndex:  true,
							Index:    indexKey,
						},
						GCThreshold: math.SmallestNonzeroFloat32,
					}))

					dataDB = MustSucceed(unary.Open(unary.Config{
						FS: MustSucceed(fs.Sub(pth_data)),
						Channel: core.Channel{
							Key:      dataKey,
							DataType: telem.Int64T,
							Index:    indexKey,
						},
						GCThreshold: math.SmallestNonzeroFloat32,
					}))
					dataDB.SetIndex(indexDB.Index())
				})
				AfterEach(func() {
					Expect(indexDB.Close()).To(Succeed())
					Expect(dataDB.Close()).To(Succeed())
					Expect(rateDB.Close()).To(Succeed())
					Expect(fs.Remove("garbage_test")).To(Succeed())
				})

				Describe("Rate DB", func() {
					Specify("One pointer", func() {
						Expect(unary.Write(ctx, rateDB, 10*telem.SecondTS, telem.NewSeriesV[int64](100, 101, 102, 103, 104, 105, 106))).To(Succeed())
						Expect(rateDB.Delete(ctx, (10*telem.SecondTS + 1).Range(12*telem.SecondTS+1))).To(Succeed())

						Expect(MustSucceed(rateDB.FS.Stat("1.domain")).Size()).To(Equal(int64(7 * telem.Int64T.Density())))
						Expect(rateDB.GarbageCollect(ctx)).To(Succeed())
						Expect(MustSucceed(rateDB.FS.Stat("1.domain")).Size()).To(Equal(int64(5 * telem.Int64T.Density())))

						f := MustSucceed(rateDB.Read(ctx, telem.TimeRangeMax))
						Expect(f.Series).To(HaveLen(2))

						Expect(f.Series[0].TimeRange).To(Equal((10 * telem.SecondTS).Range(10*telem.SecondTS + 1)))
						Expect(f.Series[0].Data).To(Equal(telem.NewSeriesV[int64](100)))
						Expect(f.Series[1].TimeRange).To(Equal((12*telem.SecondTS + 1).Range(16*telem.SecondTS + 1)))
						Expect(f.Series[1].Data).To(Equal(telem.NewSeriesV[int64](103, 104, 105, 106)))
					})
				})
			})

			Describe("Rate DB Garbage Collection", func() {
				It("Should Garbage Collect when called", func() {
					By("Writing data to the channel")
					for i := 1; i <= 9; i++ {
						var data []int64
						for j := 0; j <= 9; j++ {
							data = append(data, int64(i*10+j))
						}
						Expect(unary.Write(ctx, rateDB, telem.TimeStamp(10*i)*telem.SecondTS, telem.NewSeriesV[int64](data...))).To(Succeed())
					}

					By("Deleting data from the channel")
					Expect(rateDB.Delete(ctx, telem.TimeRange{
						Start: 33 * telem.SecondTS,
						End:   75 * telem.SecondTS,
					})).To(Succeed())

					fi, err := rateDB.FS.Stat("1.domain")
					Expect(err).To(BeNil())
					Expect(fi.Size()).To(Equal(int64(720)))

					Expect(rateDB.GarbageCollect(ctx)).To(Succeed())

					fi, err = rateDB.FS.Stat("1.domain")
					Expect(err).To(BeNil())
					Expect(fi.Size()).To(Equal(int64(384)))

					By("Reading data from the channel")
					frame, err := rateDB.Read(ctx, telem.TimeRange{Start: 10 * telem.SecondTS, End: 100 * telem.SecondTS})
					Expect(err).To(BeNil())
					Expect(frame.Series).To(HaveLen(6))

					Expect(frame.Series[2].TimeRange.End).To(Equal(33 * telem.SecondTS))
					series0Data := telem.UnmarshalSlice[int](frame.Series[2].Data, telem.Int64T)
					Expect(series0Data).To(ContainElement(31))
					Expect(series0Data).To(ContainElement(32))
					Expect(series0Data).ToNot(ContainElement(33))

					Expect(frame.Series[3].TimeRange.Start).To(Equal(75 * telem.SecondTS))
					series1Data := telem.UnmarshalSlice[int](frame.Series[3].Data, telem.Int64T)
					Expect(series1Data).ToNot(ContainElement(74))
					Expect(series1Data).To(ContainElement(75))
				})
			})

			Describe("Simple Index DB", func() {
				It("Should garbage collect", func() {
					By("Writing data to the channel")
					Expect(unary.Write(ctx, indexDB, 10*telem.SecondTS, telem.NewSecondsTSV(10, 11, 12, 13, 14, 15, 16, 17, 18, 19))).To(Succeed())
					Expect(unary.Write(ctx, dataDB, 10*telem.SecondTS, telem.NewSeriesV[int64](0, 1, 2, 3, 4, 5, 6, 7, 8, 9))).To(Succeed())

					// Before deletion:
					// 10 11 12 13 14 15 16 17 18 19
					//  0  1  2  3  4  5  6  7  8  9

					By("Deleting channel data")
					Expect(dataDB.Delete(ctx, telem.TimeRange{
						Start: 12 * telem.SecondTS,
						End:   17 * telem.SecondTS,
					})).To(Succeed())

					// After deletion:
					// 10 11 12 13 14 15 16 17 18 19
					//  0  1                 7  8  9

					fi, err := dataDB.FS.Stat("1.domain")
					Expect(err).To(BeNil())
					Expect(fi.Size()).To(Equal(int64(80)))

					Expect(dataDB.GarbageCollect(ctx)).To(Succeed())

					fi, err = dataDB.FS.Stat("1.domain")
					Expect(err).To(BeNil())
					Expect(fi.Size()).To(Equal(int64(40)))

					frame, err := dataDB.Read(ctx, telem.TimeRange{Start: 10 * telem.SecondTS, End: 20 * telem.SecondTS})
					Expect(err).To(BeNil())
					Expect(frame.Series).To(HaveLen(2))
					Expect(frame.Series[0].TimeRange.End).To(Equal(12 * telem.SecondTS))

					series0Data := telem.UnmarshalSlice[int](frame.Series[0].Data, telem.Int64T)
					Expect(series0Data).To(ContainElement(0))
					Expect(series0Data).To(ContainElement(1))
					Expect(series0Data).ToNot(ContainElement(2))

					Expect(frame.Series[1].TimeRange.Start).To(Equal(17 * telem.SecondTS))
					series1Data := telem.UnmarshalSlice[int](frame.Series[1].Data, telem.Int64T)

					Expect(series1Data).ToNot(ContainElement(6))
					Expect(series1Data).To(ContainElement(7))
					Expect(series1Data).To(ContainElement(8))
					Expect(series1Data).To(ContainElement(9))
				})
			})

			Describe("Index DB Multiple pointers", func() {
				It("Should Garbage Collect when called", func() {
					By("Writing data to the channel")
					for i := 1; i <= 9; i++ {
						var data []int64
						var index []telem.TimeStamp

						for j := 0; j <= 9; j++ {
							data = append(data, int64(i*10+j))
							index = append(index, telem.TimeStamp(i*10+j))
						}
						Expect(unary.Write(ctx, indexDB, telem.TimeStamp(i*10)*telem.SecondTS, telem.NewSecondsTSV(index...))).To(Succeed())
						Expect(unary.Write(ctx, dataDB, telem.TimeStamp(i*10)*telem.SecondTS, telem.NewSeriesV[int64](data...))).To(Succeed())
					}

					By("Deleting data from the channel")
					Expect(dataDB.Delete(ctx, telem.TimeRange{
						Start: 33 * telem.SecondTS,
						End:   75 * telem.SecondTS,
					})).To(Succeed())

					fi, err := dataDB.FS.Stat("1.domain")
					Expect(err).To(BeNil())
					Expect(fi.Size()).To(Equal(int64(720)))

					Expect(dataDB.GarbageCollect(ctx)).To(Succeed())

					fi, err = dataDB.FS.Stat("1.domain")
					Expect(err).To(BeNil())
					Expect(fi.Size()).To(Equal(int64(384)))

					By("Reading data from the channel")
					frame, err := dataDB.Read(ctx, telem.TimeRange{Start: 10 * telem.SecondTS, End: 100 * telem.SecondTS})
					Expect(err).To(BeNil())
					Expect(frame.Series).To(HaveLen(6))

					Expect(frame.Series[2].TimeRange.End).To(Equal(33 * telem.SecondTS))
					series0Data := telem.UnmarshalSlice[int](frame.Series[2].Data, telem.Int64T)
					Expect(series0Data).To(ContainElement(31))
					Expect(series0Data).To(ContainElement(32))
					Expect(series0Data).ToNot(ContainElement(33))

					Expect(frame.Series[3].TimeRange.Start).To(Equal(75 * telem.SecondTS))
					series1Data := telem.UnmarshalSlice[int](frame.Series[3].Data, telem.Int64T)
					Expect(series1Data).ToNot(ContainElement(74))
					Expect(series1Data).To(ContainElement(75))
				})
			})
		})
	}
})
