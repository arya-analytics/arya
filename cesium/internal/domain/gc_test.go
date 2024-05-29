// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

package domain_test

import (
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	"github.com/synnaxlabs/cesium/internal/domain"
	xfs "github.com/synnaxlabs/x/io/fs"
	"github.com/synnaxlabs/x/telem"
	. "github.com/synnaxlabs/x/testutil"
	"math"
)

var _ = Describe("Garbage Collection", Ordered, func() {
	for fsName, makeFS := range fileSystems {
		Context("FS: "+fsName, func() {
			var (
				db      *domain.DB
				fs      xfs.FS
				cleanUp func() error
			)
			BeforeEach(func() {
				fs, cleanUp = makeFS()
			})
			AfterEach(func() {
				Expect(db.Close()).To(Succeed())
				Expect(cleanUp()).To(Succeed())
			})

			Context("One file", func() {
				It("Should garbage collect one tombstone", func() {
					db = MustSucceed(domain.Open(domain.Config{FS: fs, FileSize: 1 * telem.Megabyte, GCThreshold: math.SmallestNonzeroFloat32}))
					Expect(domain.Write(ctx, db, (10 * telem.SecondTS).Range(19*telem.SecondTS+1), []byte{10, 11, 12, 13, 14, 15, 16, 17, 18, 19})).To(Succeed())
					Expect(db.Delete(ctx, 3, 3, telem.TimeRange{Start: 12*telem.SecondTS + 1, End: 16*telem.SecondTS + 1})).To(Succeed())

					By("Garbage collecting and asserting the file got smaller")
					Expect(MustSucceed(db.FS.Stat("1.domain")).Size()).To(Equal(int64(10)))
					Expect(db.GarbageCollect(ctx)).To(Succeed())
					Expect(MustSucceed(db.FS.Stat("1.domain")).Size()).To(Equal(int64(6)))

					By("Asserting that we can still write to the file")
					Expect(domain.Write(ctx, db, (20 * telem.SecondTS).Range(28*telem.SecondTS+1), []byte{20, 21, 22, 23, 24, 25, 26, 27, 28})).To(Succeed())

					By("Asserting that the data is correct", func() {
						i := db.NewIterator(domain.IterRange(telem.TimeRangeMax))
						Expect(i.SeekFirst(ctx)).To(BeTrue())
						Expect(i.TimeRange()).To(Equal((10 * telem.SecondTS).Range(12*telem.SecondTS + 1)))
						r := MustSucceed(i.NewReader(ctx))
						var buf = make([]byte, 3)
						MustSucceed(r.ReadAt(buf, 0))
						Expect(buf).To(Equal([]byte{10, 11, 12}))
						Expect(r.Close()).To(Succeed())

						Expect(i.Next()).To(BeTrue())
						Expect(i.TimeRange()).To(Equal((16*telem.SecondTS + 1).Range(19*telem.SecondTS + 1)))
						r = MustSucceed(i.NewReader(ctx))
						buf = make([]byte, 3)
						MustSucceed(r.ReadAt(buf, 0))
						Expect(buf).To(Equal([]byte{17, 18, 19}))
						Expect(r.Close()).To(Succeed())

						Expect(i.Next()).To(BeTrue())
						Expect(i.TimeRange()).To(Equal((20 * telem.SecondTS).Range(28*telem.SecondTS + 1)))
						r = MustSucceed(i.NewReader(ctx))
						buf = make([]byte, 9)
						MustSucceed(r.ReadAt(buf, 0))
						Expect(buf).To(Equal([]byte{20, 21, 22, 23, 24, 25, 26, 27, 28}))
						Expect(r.Close()).To(Succeed())

						Expect(i.Next()).To(BeFalse())
						Expect(i.Close()).To(Succeed())
					})
				})
				It("Should garbage collect multiple tombstones", func() {
					db = MustSucceed(domain.Open(domain.Config{FS: fs, FileSize: 1 * telem.Megabyte, GCThreshold: math.SmallestNonzeroFloat32}))
					Expect(domain.Write(ctx, db, (10 * telem.SecondTS).Range(19*telem.SecondTS+1), []byte{10, 11, 12, 13, 14, 15, 16, 17, 18, 19})).To(Succeed())
					Expect(domain.Write(ctx, db, (20 * telem.SecondTS).Range(23*telem.SecondTS+1), []byte{20, 21, 22, 23})).To(Succeed())
					Expect(domain.Write(ctx, db, (30 * telem.SecondTS).Range(36*telem.SecondTS+1), []byte{30, 31, 32, 33, 34, 35, 36})).To(Succeed())
					Expect(db.Delete(ctx, 3, 3, telem.TimeRange{Start: 12*telem.SecondTS + 1, End: 33*telem.SecondTS + 1})).To(Succeed())

					By("Garbage collecting and asserting the file got smaller")
					Expect(MustSucceed(db.FS.Stat("1.domain")).Size()).To(Equal(int64(21)))
					Expect(db.GarbageCollect(ctx)).To(Succeed())
					Expect(MustSucceed(db.FS.Stat("1.domain")).Size()).To(Equal(int64(6)))

					By("Asserting that we can still write to the file")
					Expect(domain.Write(ctx, db, (50 * telem.SecondTS).Range(52*telem.SecondTS+1), []byte{50, 51, 52})).To(Succeed())
					Expect(MustSucceed(db.FS.Stat("1.domain")).Size()).To(Equal(int64(9)))

					By("Asserting that we can still delete data")
					Expect(db.Delete(ctx, 2, 2, (11 * telem.SecondTS).Range(35*telem.SecondTS))).To(Succeed())

					By("Asserting that the data did not change", func() {
						i := db.NewIterator(domain.IterRange(telem.TimeRangeMax))
						Expect(i.SeekFirst(ctx)).To(BeTrue())
						Expect(i.TimeRange()).To(Equal((10 * telem.SecondTS).Range(11 * telem.SecondTS)))
						r := MustSucceed(i.NewReader(ctx))
						var buf = make([]byte, 1)
						MustSucceed(r.ReadAt(buf, 0))
						Expect(buf).To(Equal([]byte{10}))
						Expect(r.Close()).To(Succeed())

						Expect(i.Next()).To(BeTrue())
						Expect(i.TimeRange()).To(Equal((35 * telem.SecondTS).Range(36*telem.SecondTS + 1)))
						r = MustSucceed(i.NewReader(ctx))
						buf = make([]byte, 2)
						MustSucceed(r.ReadAt(buf, 0))
						Expect(buf).To(Equal([]byte{35, 36}))
						Expect(r.Close()).To(Succeed())

						Expect(i.Next()).To(BeTrue())
						Expect(i.TimeRange()).To(Equal((50 * telem.SecondTS).Range(52*telem.SecondTS + 1)))
						r = MustSucceed(i.NewReader(ctx))
						buf = make([]byte, 3)
						MustSucceed(r.ReadAt(buf, 0))
						Expect(buf).To(Equal([]byte{50, 51, 52}))
						Expect(r.Close()).To(Succeed())

						Expect(i.Next()).To(BeFalse())
						Expect(i.Close()).To(Succeed())
					})
				})

				It("Should garbage collect multiple tombstones based on the threshold", func() {
					db = MustSucceed(domain.Open(domain.Config{FS: fs, FileSize: 1 * telem.Megabyte, GCThreshold: float32(16*telem.ByteSize) / float32(telem.Megabyte)}))
					Expect(domain.Write(ctx, db, (10 * telem.SecondTS).Range(19*telem.SecondTS+1), []byte{10, 11, 12, 13, 14, 15, 16, 17, 18, 19})).To(Succeed())
					Expect(domain.Write(ctx, db, (20 * telem.SecondTS).Range(23*telem.SecondTS+1), []byte{20, 21, 22, 23})).To(Succeed())
					Expect(domain.Write(ctx, db, (30 * telem.SecondTS).Range(36*telem.SecondTS+1), []byte{30, 31, 32, 33, 34, 35, 36})).To(Succeed())
					Expect(db.Delete(ctx, 3, 3, telem.TimeRange{Start: 12*telem.SecondTS + 1, End: 33*telem.SecondTS + 1})).To(Succeed())

					By("Garbage collecting and asserting the file did not get smaller as the threshold is not reached.")
					Expect(MustSucceed(db.FS.Stat("1.domain")).Size()).To(Equal(int64(21)))
					Expect(db.GarbageCollect(ctx)).To(Succeed())
					Expect(MustSucceed(db.FS.Stat("1.domain")).Size()).To(Equal(int64(21)))

					By("Deleting more data to reach the threshold")
					Expect(db.Delete(ctx, 1, 0, telem.TimeRange{Start: 10*telem.SecondTS + 1, End: 12*telem.SecondTS + 1})).To(Succeed())
					Expect(db.GarbageCollect(ctx)).To(Succeed())
					Expect(MustSucceed(db.FS.Stat("1.domain")).Size()).To(Equal(int64(4)))

					By("Asserting that the data did not change", func() {
						i := db.NewIterator(domain.IterRange(telem.TimeRangeMax))
						Expect(i.SeekFirst(ctx)).To(BeTrue())
						Expect(i.TimeRange()).To(Equal((10 * telem.SecondTS).Range(10*telem.SecondTS + 1)))
						r := MustSucceed(i.NewReader(ctx))
						var buf = make([]byte, 1)
						MustSucceed(r.ReadAt(buf, 0))
						Expect(buf).To(Equal([]byte{10}))
						Expect(r.Close()).To(Succeed())

						Expect(i.Next()).To(BeTrue())
						Expect(i.TimeRange()).To(Equal((33*telem.SecondTS + 1).Range(36*telem.SecondTS + 1)))
						r = MustSucceed(i.NewReader(ctx))
						buf = make([]byte, 3)
						MustSucceed(r.ReadAt(buf, 0))
						Expect(buf).To(Equal([]byte{34, 35, 36}))
						Expect(r.Close()).To(Succeed())

						Expect(i.Next()).To(BeFalse())
						Expect(i.Close()).To(Succeed())
					})
				})
			})
			Context("Multiple files", func() {
				It("Should garbage collect multiple tombstones", func() {
					db = MustSucceed(domain.Open(domain.Config{FS: fs, MaxDescriptors: 4, FileSize: 2 * telem.ByteSize, GCThreshold: math.SmallestNonzeroFloat32}))
					Expect(domain.Write(ctx, db, (10 * telem.SecondTS).Range(19*telem.SecondTS+1), []byte{10, 11, 12, 13, 14, 15, 16, 17, 18, 19})).To(Succeed())
					Expect(domain.Write(ctx, db, (20 * telem.SecondTS).Range(23*telem.SecondTS+1), []byte{20, 21, 22, 23})).To(Succeed())
					Expect(domain.Write(ctx, db, (30 * telem.SecondTS).Range(36*telem.SecondTS+1), []byte{30, 31, 32, 33, 34, 35, 36})).To(Succeed())
					Expect(db.Delete(ctx, 3, 3, telem.TimeRange{Start: 12*telem.SecondTS + 1, End: 33*telem.SecondTS + 1})).To(Succeed())

					By("Garbage collecting and asserting the file got smaller")
					Expect(MustSucceed(db.FS.Stat("1.domain")).Size()).To(Equal(int64(10)))
					Expect(MustSucceed(db.FS.Stat("2.domain")).Size()).To(Equal(int64(4)))
					Expect(MustSucceed(db.FS.Stat("3.domain")).Size()).To(Equal(int64(7)))

					Expect(db.GarbageCollect(ctx)).To(Succeed())
					Expect(MustSucceed(db.FS.Stat("1.domain")).Size()).To(Equal(int64(3)))
					Expect(MustSucceed(db.FS.Stat("2.domain")).Size()).To(Equal(int64(0)))
					Expect(MustSucceed(db.FS.Stat("3.domain")).Size()).To(Equal(int64(3)))

					Expect(domain.Write(ctx, db, (100 * telem.SecondTS).Range(105*telem.SecondTS+1), []byte{100, 101, 102, 103, 104, 105})).To(Succeed())
					Expect(domain.Write(ctx, db, (110 * telem.SecondTS).Range(115*telem.SecondTS+1), []byte{110, 111, 112, 113, 114, 115})).To(Succeed())

					By("Asserting that the data did not change", func() {
						i := db.NewIterator(domain.IterRange(telem.TimeRangeMax))
						Expect(i.SeekFirst(ctx)).To(BeTrue())
						Expect(i.TimeRange()).To(Equal((10 * telem.SecondTS).Range(12*telem.SecondTS + 1)))
						r := MustSucceed(i.NewReader(ctx))
						var buf = make([]byte, 3)
						MustSucceed(r.ReadAt(buf, 0))
						Expect(buf).To(Equal([]byte{10, 11, 12}))
						Expect(r.Close()).To(Succeed())

						Expect(i.Next()).To(BeTrue())
						Expect(i.TimeRange()).To(Equal((33*telem.SecondTS + 1).Range(36*telem.SecondTS + 1)))
						r = MustSucceed(i.NewReader(ctx))
						buf = make([]byte, 3)
						MustSucceed(r.ReadAt(buf, 0))
						Expect(buf).To(Equal([]byte{34, 35, 36}))
						Expect(r.Close()).To(Succeed())

						Expect(i.Next()).To(BeTrue())
						Expect(i.TimeRange()).To(Equal((100 * telem.SecondTS).Range(105*telem.SecondTS + 1)))
						r = MustSucceed(i.NewReader(ctx))
						buf = make([]byte, 6)
						MustSucceed(r.ReadAt(buf, 0))
						Expect(buf).To(Equal([]byte{100, 101, 102, 103, 104, 105}))
						Expect(r.Close()).To(Succeed())

						Expect(i.Next()).To(BeTrue())
						Expect(i.TimeRange()).To(Equal((110 * telem.SecondTS).Range(115*telem.SecondTS + 1)))
						r = MustSucceed(i.NewReader(ctx))
						buf = make([]byte, 6)
						MustSucceed(r.ReadAt(buf, 0))
						Expect(buf).To(Equal([]byte{110, 111, 112, 113, 114, 115}))
						Expect(r.Close()).To(Succeed())

						Expect(i.Next()).To(BeFalse())
						Expect(i.Close()).To(Succeed())
					})
				})

				It("Should garbage collect multiple tombstones across many files", func() {
					db = MustSucceed(domain.Open(domain.Config{FS: fs, FileSize: 5 * telem.ByteSize, GCThreshold: math.SmallestNonzeroFloat32}))
					Expect(domain.Write(ctx, db, (10 * telem.SecondTS).Range(19*telem.SecondTS+1), []byte{10, 11, 12, 13})).To(Succeed())             // file 1
					Expect(domain.Write(ctx, db, (20 * telem.SecondTS).Range(25*telem.SecondTS+1), []byte{20, 21, 22, 23, 24, 25})).To(Succeed())     // file 1
					Expect(domain.Write(ctx, db, (30 * telem.SecondTS).Range(36*telem.SecondTS+1), []byte{30, 31, 32, 33, 34, 35, 36})).To(Succeed()) // file 2
					Expect(domain.Write(ctx, db, (40 * telem.SecondTS).Range(43*telem.SecondTS+1), []byte{40, 41, 43})).To(Succeed())                 // file 3
					Expect(db.Delete(ctx, 3, 2, telem.TimeRange{Start: 23 * telem.SecondTS, End: 41 * telem.SecondTS})).To(Succeed())

					By("Garbage collecting and asserting the file got smaller")
					Expect(MustSucceed(db.FS.Stat("1.domain")).Size()).To(Equal(int64(10)))
					Expect(MustSucceed(db.FS.Stat("2.domain")).Size()).To(Equal(int64(7)))
					Expect(MustSucceed(db.FS.Stat("3.domain")).Size()).To(Equal(int64(3)))

					Expect(db.GarbageCollect(ctx)).To(Succeed())
					Expect(MustSucceed(db.FS.Stat("1.domain")).Size()).To(Equal(int64(7)))
					Expect(MustSucceed(db.FS.Stat("2.domain")).Size()).To(Equal(int64(0)))
					Expect(MustSucceed(db.FS.Stat("3.domain")).Size()).To(Equal(int64(2)))

					By("Asserting that the data did not change", func() {
						i := db.NewIterator(domain.IterRange(telem.TimeRangeMax))
						Expect(i.SeekFirst(ctx)).To(BeTrue())
						Expect(i.Next()).To(BeTrue())
						Expect(i.TimeRange()).To(Equal((20 * telem.SecondTS).Range(23 * telem.SecondTS)))
						r := MustSucceed(i.NewReader(ctx))
						var buf = make([]byte, 3)
						MustSucceed(r.ReadAt(buf, 0))
						Expect(buf).To(Equal([]byte{20, 21, 22}))
						Expect(r.Close()).To(Succeed())

						Expect(i.Next()).To(BeTrue())
						Expect(i.TimeRange()).To(Equal((41 * telem.SecondTS).Range(43*telem.SecondTS + 1)))
						r = MustSucceed(i.NewReader(ctx))
						buf = make([]byte, 2)
						MustSucceed(r.ReadAt(buf, 0))
						Expect(buf).To(Equal([]byte{41, 43}))
						Expect(r.Close()).To(Succeed())

						Expect(i.Next()).To(BeFalse())
						Expect(i.Close()).To(Succeed())
					})
				})

				It("Should garbage collect tombstones based on the threshold", func() {
					db = MustSucceed(domain.Open(domain.Config{FS: fs, FileSize: 5 * telem.ByteSize, GCThreshold: 0.4}))
					Expect(domain.Write(ctx, db, (10 * telem.SecondTS).Range(19*telem.SecondTS+1), []byte{10, 11, 12, 13})).To(Succeed())             // file 1
					Expect(domain.Write(ctx, db, (20 * telem.SecondTS).Range(25*telem.SecondTS+1), []byte{20, 21, 22, 23, 24, 25})).To(Succeed())     // file 1
					Expect(domain.Write(ctx, db, (30 * telem.SecondTS).Range(36*telem.SecondTS+1), []byte{30, 31, 32, 33, 34, 35, 36})).To(Succeed()) // file 2
					Expect(domain.Write(ctx, db, (40 * telem.SecondTS).Range(43*telem.SecondTS+1), []byte{40, 41, 43})).To(Succeed())                 // file 3
					Expect(db.Delete(ctx, 3, 2, telem.TimeRange{Start: 23 * telem.SecondTS, End: 41 * telem.SecondTS})).To(Succeed())

					By("Garbage collecting and asserting the file got smaller")
					Expect(MustSucceed(db.FS.Stat("1.domain")).Size()).To(Equal(int64(10)))
					Expect(MustSucceed(db.FS.Stat("2.domain")).Size()).To(Equal(int64(7)))
					Expect(MustSucceed(db.FS.Stat("3.domain")).Size()).To(Equal(int64(3)))

					Expect(db.GarbageCollect(ctx)).To(Succeed())
					// file 1 should be collected (3 > 2)
					Expect(MustSucceed(db.FS.Stat("1.domain")).Size()).To(Equal(int64(7)))
					// file 2 should be collected (7 > 2)
					Expect(MustSucceed(db.FS.Stat("2.domain")).Size()).To(Equal(int64(0)))
					// file 3 should not be garbage collected (1 < 2)
					Expect(MustSucceed(db.FS.Stat("3.domain")).Size()).To(Equal(int64(3)))

					By("Asserting that the data did not change", func() {
						i := db.NewIterator(domain.IterRange(telem.TimeRangeMax))
						Expect(i.SeekFirst(ctx)).To(BeTrue())
						Expect(i.Next()).To(BeTrue())
						Expect(i.TimeRange()).To(Equal((20 * telem.SecondTS).Range(23 * telem.SecondTS)))
						r := MustSucceed(i.NewReader(ctx))
						var buf = make([]byte, 3)
						MustSucceed(r.ReadAt(buf, 0))
						Expect(buf).To(Equal([]byte{20, 21, 22}))
						Expect(r.Close()).To(Succeed())

						Expect(i.Next()).To(BeTrue())
						Expect(i.TimeRange()).To(Equal((41 * telem.SecondTS).Range(43*telem.SecondTS + 1)))
						r = MustSucceed(i.NewReader(ctx))
						buf = make([]byte, 2)
						MustSucceed(r.ReadAt(buf, 0))
						Expect(buf).To(Equal([]byte{41, 43}))
						Expect(r.Close()).To(Succeed())

						Expect(i.Next()).To(BeFalse())
						Expect(i.Close()).To(Succeed())
					})
				})
			})
			Context("Tombstone persist", func() {
				It("Should preserve the tombstones after database closure", func() {
					db = MustSucceed(domain.Open(domain.Config{FS: fs, FileSize: 5 * telem.ByteSize, GCThreshold: 0.4}))
					Expect(domain.Write(ctx, db, (10 * telem.SecondTS).Range(19*telem.SecondTS+1), []byte{10, 11, 12, 13})).To(Succeed())             // file 1
					Expect(domain.Write(ctx, db, (20 * telem.SecondTS).Range(25*telem.SecondTS+1), []byte{20, 21, 22, 23, 24, 25})).To(Succeed())     // file 1
					Expect(domain.Write(ctx, db, (30 * telem.SecondTS).Range(36*telem.SecondTS+1), []byte{30, 31, 32, 33, 34, 35, 36})).To(Succeed()) // file 2
					Expect(domain.Write(ctx, db, (40 * telem.SecondTS).Range(46*telem.SecondTS+1), []byte{40, 41, 43, 44, 45, 46})).To(Succeed())     // file 3
					Expect(db.Delete(ctx, 3, 5, telem.TimeRange{Start: 23 * telem.SecondTS, End: 41 * telem.SecondTS})).To(Succeed())

					By("Reopening the DB")
					Expect(db.Close()).To(Succeed())
					db = MustSucceed(domain.Open(domain.Config{FS: fs, FileSize: 5 * telem.ByteSize, GCThreshold: 0.4}))

					By("Garbage collecting and asserting the file got smaller")
					Expect(MustSucceed(db.FS.Stat("1.domain")).Size()).To(Equal(int64(10)))
					Expect(MustSucceed(db.FS.Stat("2.domain")).Size()).To(Equal(int64(7)))
					Expect(MustSucceed(db.FS.Stat("3.domain")).Size()).To(Equal(int64(6)))

					Expect(db.GarbageCollect(ctx)).To(Succeed())
					// file 1 should be collected (3 > 2)
					Expect(MustSucceed(db.FS.Stat("1.domain")).Size()).To(Equal(int64(7)))
					// file 2 should be collected (7 > 2)
					Expect(MustSucceed(db.FS.Stat("2.domain")).Size()).To(Equal(int64(0)))
					// file 3 should not be garbage collected (1 < 2)
					Expect(MustSucceed(db.FS.Stat("3.domain")).Size()).To(Equal(int64(6)))

					By("Asserting that new data would still be written")
					Expect(domain.Write(ctx, db, (30 * telem.SecondTS).Range(35*telem.SecondTS+1), []byte{30, 31, 32, 33, 34, 35})).To(Succeed())
					// It's difficult to test that the new data actually went to a
					// specific freed file – as they could go to any one of file 1, 2, 4
					// since they are all below the file size limit.

					By("Asserting that the data did not change", func() {
						i := db.NewIterator(domain.IterRange(telem.TimeRangeMax))
						Expect(i.SeekFirst(ctx)).To(BeTrue())
						Expect(i.Next()).To(BeTrue())
						Expect(i.TimeRange()).To(Equal((20 * telem.SecondTS).Range(23 * telem.SecondTS)))
						r := MustSucceed(i.NewReader(ctx))
						var buf = make([]byte, 3)
						MustSucceed(r.ReadAt(buf, 0))
						Expect(buf).To(Equal([]byte{20, 21, 22}))
						Expect(r.Close()).To(Succeed())

						Expect(i.Next()).To(BeTrue())
						Expect(i.TimeRange()).To(Equal((30 * telem.SecondTS).Range(35*telem.SecondTS + 1)))
						r = MustSucceed(i.NewReader(ctx))
						buf = make([]byte, 6)
						MustSucceed(r.ReadAt(buf, 0))
						Expect(buf).To(Equal([]byte{30, 31, 32, 33, 34, 35}))
						Expect(r.Close()).To(Succeed())

						Expect(i.Next()).To(BeTrue())
						Expect(i.TimeRange()).To(Equal((41 * telem.SecondTS).Range(46*telem.SecondTS + 1)))
						r = MustSucceed(i.NewReader(ctx))
						buf = make([]byte, 5)
						MustSucceed(r.ReadAt(buf, 0))
						Expect(buf).To(Equal([]byte{41, 43, 44, 45, 46}))
						Expect(r.Close()).To(Succeed())

						Expect(i.Next()).To(BeFalse())
						Expect(i.Close()).To(Succeed())
					})
				})
			})
		})
	}
})
