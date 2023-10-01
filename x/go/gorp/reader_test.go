// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

package gorp_test

import (
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	"github.com/synnaxlabs/x/binary"
	"github.com/synnaxlabs/x/gorp"
	kvx "github.com/synnaxlabs/x/kv"
	"github.com/synnaxlabs/x/kv/memkv"
	. "github.com/synnaxlabs/x/testutil"
)

var _ = Describe("Reader", Ordered, func() {
	var (
		db   kvx.DB
		ecdc binary.EncoderDecoder
		tx   kvx.Tx
	)
	BeforeAll(func() {
		db = memkv.New()
		ecdc = &binary.GobEncoderDecoder{}
	})
	AfterAll(func() { Expect(db.Close()).To(Succeed()) })
	Describe("Iterator", func() {
		BeforeEach(func() {
			tx = db.OpenTx()
			val := MustSucceed(ecdc.Encode(nil, map[string]string{"key1": "value1", "key2": "value2"}))
			Expect(tx.Set(ctx, []byte("key1"), val)).To(Succeed())
			Expect(tx.Set(ctx, []byte("key2"), val)).To(Succeed())
		})
		AfterEach(func() { Expect(tx.Close()).To(Succeed()) })
		It("Should decode values before returning them to the caller", func() {
			base := MustSucceed(db.OpenIterator(kvx.IterPrefix([]byte("key"))))
			iter := gorp.WrapIterator[map[string]string](base, ecdc)
			for iter.First(); iter.Valid(); iter.Next() {
				Expect(iter.Value(ctx)).To(Equal(map[string]string{"key1": "value1", "key2": "value2"}))
			}
			Expect(iter.Error()).To(BeNil())
			Expect(iter.Close()).To(Succeed())
		})
	})
	Describe("TxReader", func() {
		It("Should wrap a kv.TXReader and correctly decode transaction operations", func() {
			base := db.OpenTx()
			Expect(base.Set(ctx, []byte("key1"), MustSucceed(ecdc.Encode(nil, "value1")))).To(Succeed())
		})
	})
})
