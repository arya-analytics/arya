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
)

var _ = Describe("Index Persist", Ordered, func() {
	for fsName, makeFS := range fileSystems {
		Context("FS: "+fsName, func() {
			var (
				db      *domain.DB
				fs      xfs.FS
				cleanUp func() error
			)
			BeforeEach(func() {
				fs, cleanUp = makeFS()
				db = MustSucceed(domain.Open(domain.Config{FS: fs, FileSize: 5 * telem.ByteSize, GCThreshold: 0}))
			})
			AfterEach(func() {
				Expect(db.Close()).To(Succeed())
				Expect(cleanUp()).To(Succeed())
			})

			Describe("Happy path", func() {
				It("Should persist the index", func() {
					By("Writing some data")
					Expect(domain.Write(ctx, db, (10 * telem.SecondTS).Range(15*telem.SecondTS+1), []byte{10, 11, 12, 13, 14, 15})).To(Succeed())
					Expect(domain.Write(ctx, db, (20 * telem.SecondTS).Range(23*telem.SecondTS+1), []byte{20, 21, 22, 23})).To(Succeed())
					Expect(domain.Write(ctx, db, (26 * telem.SecondTS).Range(30*telem.SecondTS+1), []byte{26, 27, 30})).To(Succeed())
					Expect(domain.Write(ctx, db, (40 * telem.SecondTS).Range(42*telem.SecondTS+1), []byte{40, 41, 42})).To(Succeed())

					By("Re-opening the database")
					Expect(db.Close()).To(Succeed())
					db = MustSucceed(domain.Open(domain.Config{FS: fs, FileSize: 5 * telem.ByteSize, GCThreshold: 0}))

					By("Asserting that the data is still there")
					i := db.NewIterator(domain.IterRange(telem.TimeRangeMax))
					Expect(i.SeekFirst(ctx)).To(BeTrue())
					r := MustSucceed(i.NewReader(ctx))
					var buf = make([]byte, 6)

					_, err := r.ReadAt(buf, 0)
					Expect(err).ToNot(HaveOccurred())
					Expect(buf).To(Equal([]byte{10, 11, 12, 13, 14, 15}))
					Expect(r.Close()).To(Succeed())

					Expect(i.Next()).To(BeTrue())
					r = MustSucceed(i.NewReader(ctx))
					buf = make([]byte, 4)
					_, err = r.ReadAt(buf, 0)
					Expect(buf).To(Equal([]byte{20, 21, 22, 23}))
					Expect(r.Close()).To(Succeed())

					Expect(i.Next()).To(BeTrue())
					r = MustSucceed(i.NewReader(ctx))
					buf = make([]byte, 3)
					_, err = r.ReadAt(buf, 0)
					Expect(buf).To(Equal([]byte{26, 27, 30}))
					Expect(r.Close()).To(Succeed())

					Expect(i.Next()).To(BeTrue())
					r = MustSucceed(i.NewReader(ctx))
					_, err = r.ReadAt(buf, 0)
					Expect(buf).To(Equal([]byte{40, 41, 42}))
					Expect(r.Close()).To(Succeed())

					Expect(i.Next()).To(BeFalse())
					Expect(i.Close()).To(Succeed())
				})

				It("Should persist an empty index", func() {
					Expect(db.Close()).To(Succeed())
					db = MustSucceed(domain.Open(domain.Config{FS: fs}))
					i := db.NewIterator(domain.IterRange(telem.TimeRangeMax))
					Expect(i.SeekFirst(ctx)).To(BeFalse())
				})

				It("Should persist tombstones", func() {
					By("Writing some data")
					Expect(domain.Write(ctx, db, (10 * telem.SecondTS).Range(15*telem.SecondTS+1), []byte{10, 11, 12, 13, 14, 15})).To(Succeed())
					Expect(domain.Write(ctx, db, (20 * telem.SecondTS).Range(23*telem.SecondTS+1), []byte{20, 21, 22, 23})).To(Succeed())
					Expect(domain.Write(ctx, db, (26 * telem.SecondTS).Range(30*telem.SecondTS+1), []byte{26, 27, 30})).To(Succeed())
					Expect(domain.Write(ctx, db, (40 * telem.SecondTS).Range(42*telem.SecondTS+1), []byte{40, 41, 42})).To(Succeed())

					By("Deleting some data")
					Expect(db.Delete(ctx, 2, 2, (12 * telem.SecondTS).Range(22*telem.SecondTS))).To(Succeed())
					Expect(db.Delete(ctx, 1, 0, (23 * telem.SecondTS).Range(30*telem.SecondTS+1))).To(Succeed())

					By("Re-opening the database")
					Expect(db.Close()).To(Succeed())
					db = MustSucceed(domain.Open(domain.Config{FS: fs, FileSize: 5 * telem.ByteSize, GCThreshold: 0}))

					By("Garbage collecting")
					Expect(db.GarbageCollect(ctx)).To(Succeed())

					By("Asserting that the data is correct")
					i := db.NewIterator(domain.IterRange(telem.TimeRangeMax))
					Expect(i.SeekFirst(ctx)).To(BeTrue())
					r := MustSucceed(i.NewReader(ctx))
					var buf = make([]byte, 2)

					_, err := r.ReadAt(buf, 0)
					Expect(err).ToNot(HaveOccurred())
					Expect(buf).To(Equal([]byte{10, 11}))
					Expect(r.Close()).To(Succeed())

					Expect(i.Next()).To(BeTrue())
					r = MustSucceed(i.NewReader(ctx))
					buf = make([]byte, 1)
					_, err = r.ReadAt(buf, 0)
					Expect(buf).To(Equal([]byte{22}))
					Expect(r.Close()).To(Succeed())

					Expect(i.Next()).To(BeTrue())
					r = MustSucceed(i.NewReader(ctx))
					buf = make([]byte, 3)
					_, err = r.ReadAt(buf, 0)
					Expect(buf).To(Equal([]byte{40, 41, 42}))
					Expect(r.Close()).To(Succeed())

					Expect(i.Next()).To(BeFalse())
					Expect(i.Close()).To(Succeed())
				})
			})
		})
	}
})
