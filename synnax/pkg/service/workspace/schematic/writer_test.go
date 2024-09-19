// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

package schematic_test

import (
	"github.com/google/uuid"
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	"github.com/samber/lo"
	"github.com/synnaxlabs/synnax/pkg/distribution/ontology"
	"github.com/synnaxlabs/synnax/pkg/service/workspace/schematic"
	"github.com/synnaxlabs/x/gorp"
	. "github.com/synnaxlabs/x/testutil"
	"github.com/synnaxlabs/x/validate"
)

var _ = Describe("Writer", func() {
	Describe("Create", func() {
		It("Should create a Schematic", func() {
			schematic := schematic.Schematic{
				Name: "test",
				Data: "data",
			}
			Expect(svc.NewWriter(tx).Create(ctx, ws.Key, &schematic)).To(Succeed())
			Expect(schematic.Key).ToNot(Equal(uuid.Nil))
		})
	})
	Describe("Update", func() {
		It("Should rename a Schematic", func() {
			p := schematic.Schematic{Name: "test", Data: "data"}
			Expect(svc.NewWriter(tx).Create(ctx, ws.Key, &p)).To(Succeed())
			Expect(svc.NewWriter(tx).Rename(ctx, p.Key, "test2")).To(Succeed())
			var res schematic.Schematic
			Expect(gorp.NewRetrieve[uuid.UUID, schematic.Schematic]().WhereKeys(p.Key).Entry(&res).Exec(ctx, tx)).To(Succeed())
			Expect(res.Name).To(Equal("test2"))
		})
	})
	Describe("SetData", func() {
		It("Should set the data of a Schematic", func() {
			p := schematic.Schematic{Name: "test", Data: "data"}
			Expect(svc.NewWriter(tx).Create(ctx, ws.Key, &p)).To(Succeed())
			Expect(svc.NewWriter(tx).SetData(ctx, p.Key, "data2")).To(Succeed())
			var res schematic.Schematic
			Expect(gorp.NewRetrieve[uuid.UUID, schematic.Schematic]().WhereKeys(p.Key).Entry(&res).Exec(ctx, tx)).To(Succeed())
			Expect(res.Data).To(Equal("data2"))
		})
	})

	Describe("Copy", func() {
		It("Should copy a Schematic with a new name under the same workspace", func() {
			p := schematic.Schematic{Name: "test", Data: "data"}
			Expect(svc.NewWriter(tx).Create(ctx, ws.Key, &p)).To(Succeed())
			var cpy schematic.Schematic
			Expect(svc.NewWriter(tx).Copy(ctx, p.Key, "test2", false, &cpy)).To(Succeed())
			Expect(cpy.Key).ToNot(Equal(p.Key))
			Expect(cpy.Name).To(Equal("test2"))
			var res []ontology.Resource
			Expect(otg.NewRetrieve().WhereIDs(ws.OntologyID()).TraverseTo(ontology.Children).Entries(&res).Exec(ctx, tx)).To(Succeed())
			keys := lo.Map(res, func(r ontology.Resource, _ int) string { return r.ID.Key })
			Expect(keys).To(ContainElement(cpy.Key.String()))
		})
		It("Should copy a Schematic into a snapshot that cannot be modified", func() {
			p := schematic.Schematic{Name: "test", Data: "data"}
			Expect(svc.NewWriter(tx).Create(ctx, ws.Key, &p)).To(Succeed())
			var cpy schematic.Schematic
			Expect(svc.NewWriter(tx).Copy(ctx, p.Key, "test2", true, &cpy)).To(Succeed())
			Expect(svc.NewWriter(tx).SetData(ctx, cpy.Key, "data2")).To(HaveOccurredAs(validate.Error))
		})
	})
})
