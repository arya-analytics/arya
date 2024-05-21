// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

package meta_test

import (
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	"github.com/synnaxlabs/cesium"
	. "github.com/synnaxlabs/cesium/internal/testutil"
	"github.com/synnaxlabs/x/binary"
	xfs "github.com/synnaxlabs/x/io/fs"
	"github.com/synnaxlabs/x/telem"
	. "github.com/synnaxlabs/x/testutil"
	"os"
	"strconv"
)

var _ = Describe("Meta", Ordered, func() {
	for fsName, makeFS := range fileSystems {
		fs, cleanup := makeFS()
		AfterAll(func() {
			Expect(cleanup()).To(Succeed())
		})
		Context("FS: "+fsName, Ordered, func() {
			Specify("Corrupted meta.json", func() {
				s := MustSucceed(fs.Sub("sub1"))
				db := MustSucceed(cesium.Open("", cesium.WithFS(s)))
				key := GenerateChannelKey()

				Expect(db.CreateChannel(ctx, cesium.Channel{Key: key, Rate: 1 * telem.Hz, DataType: telem.Int64T})).To(Succeed())
				Expect(db.Close()).To(Succeed())

				f, err := s.Open(strconv.Itoa(int(key))+"/meta.json", os.O_WRONLY)
				Expect(err).ToNot(HaveOccurred())
				_, err = f.Write([]byte("heheheha"))
				Expect(err).ToNot(HaveOccurred())
				Expect(f.Close()).To(Succeed())

				db, err = cesium.Open("", cesium.WithFS(s))
				Expect(err).To(MatchError(ContainSubstring("error decoding meta file")))
			})

			Describe("Impossible meta configurations", func() {
				var (
					s           xfs.FS
					db          *cesium.DB
					jsonEncoder = &binary.JSONEncoderDecoder{}
					key         = GenerateChannelKey()
				)
				BeforeEach(func() {
					s = MustSucceed(fs.Sub("meta-test"))
					db = MustSucceed(cesium.Open("", cesium.WithFS(s)))
					key = GenerateChannelKey()
				})

				AfterEach(func() {
					Expect(fs.Remove("meta-test")).To(Succeed())
				})

				DescribeTable("meta configs", func(badCh cesium.Channel, badField string) {
					Expect(db.CreateChannel(ctx, cesium.Channel{Key: key, Rate: 1 * telem.Hz, DataType: telem.Int64T})).To(Succeed())
					Expect(db.Close()).To(Succeed())

					f := MustSucceed(s.Open(strconv.Itoa(int(key))+"/meta.json", os.O_WRONLY))
					encoded := MustSucceed(jsonEncoder.Encode(ctx, badCh))

					_, err := f.WriteAt(encoded, 0)
					Expect(err).ToNot(HaveOccurred())
					Expect(f.Close()).To(Succeed())

					db, err = cesium.Open("", cesium.WithFS(s))
					Expect(err).To(HaveOccurred())
					Expect(err).To(MatchError(ContainSubstring(badField)))
				},
					Entry("datatype not set", cesium.Channel{Key: key, Rate: 1 * telem.Hz}, "dataType"),
					Entry("virtual with rate", cesium.Channel{Key: key, Virtual: true, Rate: 1 * telem.Hz, DataType: telem.Int64T}, "virtual channel cannot have a rate"),
					Entry("virtual indexed", cesium.Channel{Key: key, Virtual: true, Index: key + 100, DataType: telem.Int64T}, "virtual channel cannot be indexed"),
					Entry("index not type timestamp", cesium.Channel{Key: key, IsIndex: true, DataType: telem.Float32T}, "index channel must be of type timestamp"),
				)
			})
		})
	}
})
