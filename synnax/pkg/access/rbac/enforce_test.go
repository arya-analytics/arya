// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

package rbac_test

import (
	"github.com/google/uuid"
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	"github.com/synnaxlabs/synnax/pkg/access"
	"github.com/synnaxlabs/synnax/pkg/access/rbac"
	"github.com/synnaxlabs/synnax/pkg/distribution/ontology"
	"github.com/synnaxlabs/synnax/pkg/user"
	"github.com/synnaxlabs/x/gorp"
	"github.com/synnaxlabs/x/kv/memkv"
	. "github.com/synnaxlabs/x/testutil"
)

var _ = Describe("enforcer", func() {
	var (
		db     *gorp.DB
		writer rbac.Writer
		svc    *rbac.Service
	)

	BeforeEach(func() {
		db = gorp.Wrap(memkv.New())
		svc = MustSucceed(rbac.NewService(rbac.Config{DB: db}))
		writer = svc.NewWriter(nil)
		Expect(writer.Create(ctx, &changePasswordPolicy)).To(Succeed())
	})

	AfterEach(func() {
		Expect(db.Close()).To(Succeed())
	})

	Describe("AllowRequest", func() {
		var (
			userObject, rbacObject = user.OntologyID(uuid.New()), rbac.OntologyID(uuid.New())
			userTypeObject         = ontology.ID{Type: "user", Key: ""}
			user1, user2, user3    = rbac.OntologyID(uuid.New()), rbac.OntologyID(uuid.New()), rbac.OntologyID(uuid.New())
		)
		BeforeEach(func() {
			policies := []rbac.Policy{
				{
					Subjects: []ontology.ID{user1},
					Objects:  []ontology.ID{userObject},
					Actions:  []access.Action{"create"},
				},
				{
					Subjects: []ontology.ID{user1, user2},
					Objects:  []ontology.ID{rbacObject},
					Actions:  []access.Action{"create", "update"},
				},
				{
					Subjects: []ontology.ID{user1, user2},
					Objects:  []ontology.ID{userTypeObject, rbacObject},
					Actions:  []access.Action{"delete", "retrieve"},
				},
				{
					Subjects: []ontology.ID{user3},
					Objects:  []ontology.ID{rbac.AllowAll},
				},
			}
			for _, p := range policies {
				Expect(writer.Create(ctx, &p)).To(Succeed())
			}
		})
		DescribeTable("Mix-matching access", func(req access.Request, allowed bool) {
			if allowed {
				Expect(svc.Enforce(ctx, req)).To(Succeed())
			} else {
				Expect(svc.Enforce(ctx, req)).To(MatchError(access.Denied))
			}
		},
			Entry("one user spread across requests", access.Request{
				Subject: user1,
				Objects: []ontology.ID{userObject, rbacObject},
				Action:  "create",
			}, true),
			Entry("one user spread across requests - fail", access.Request{
				Subject: user2,
				Objects: []ontology.ID{rbacObject, userObject},
				Action:  "update",
			}, false),
			Entry("type", access.Request{
				Subject: user2,
				Objects: []ontology.ID{userObject},
				Action:  "delete",
			}, true),
			Entry("type", access.Request{
				Subject: user2,
				Objects: []ontology.ID{userObject},
				Action:  "retrieve",
			}, true),
			Entry("allow all", access.Request{
				Subject: user3,
				Objects: []ontology.ID{userObject, userTypeObject, rbacObject},
				Action:  "inexistent action",
			}, true),
			Entry("one of objects not match", access.Request{
				Subject: user1,
				Objects: []ontology.ID{userObject, rbacObject},
				Action:  "update",
			}, false),
		)
	})

	Describe("Enforce - allow", func() {
		It("Should allow access when a valid policy exists", func() {
			Expect(svc.Enforce(ctx, access.Request{
				Subject: userID,
				Objects: []ontology.ID{userID},
				Action:  "changePassword",
			})).To(Succeed())
		})
	})

	Describe("Enforce - deny", func() {
		It("Should deny when a policy can't be found", func() {
			Expect(svc.Enforce(ctx, access.Request{
				Subject: user.OntologyID(uuid.New()),
				Objects: []ontology.ID{userID},
				Action:  "changePassword",
			})).To(Equal(access.Denied))
		})
		It("Should deny when no policy applies to the request", func() {
			Expect(svc.Enforce(ctx, access.Request{
				Subject: userID,
				Objects: []ontology.ID{userID},
				Action:  "retrieve",
			})).To(Equal(access.Denied))
		})
		It("Should deny when the policy is removed", func() {
			Expect(writer.Delete(ctx, changePasswordPolicy.Key)).To(Succeed())
			Expect(svc.Enforce(ctx, access.Request{
				Subject: userID,
				Objects: []ontology.ID{userID},
				Action:  "changePassword",
			})).To(Equal(access.Denied))
		})
		It("Should deny in the case of mix-matching", func() {
			var (
				userID1, userID2 = user.OntologyID(uuid.New()), user.OntologyID(uuid.New())
				user1Change2     = rbac.Policy{
					Subjects: []ontology.ID{userID1},
					Objects:  []ontology.ID{userID2},
					Actions:  []access.Action{"changePassword"},
				}
				user2Change1 = rbac.Policy{
					Subjects: []ontology.ID{userID2},
					Objects:  []ontology.ID{userID1},
					Actions:  []access.Action{"changePassword", "erasePassword"},
				}
			)
			Expect(writer.Create(ctx, &user1Change2)).To(Succeed())
			Expect(writer.Create(ctx, &user2Change1)).To(Succeed())

			Expect(svc.Enforce(ctx, access.Request{
				Subject: userID1,
				Objects: []ontology.ID{userID1},
				Action:  "changePassword",
			})).To(Equal(access.Denied))

			Expect(svc.Enforce(ctx, access.Request{
				Subject: userID2,
				Objects: []ontology.ID{userID2},
				Action:  "changePassword",
			})).To(Equal(access.Denied))

			Expect(svc.Enforce(ctx, access.Request{
				Subject: userID1,
				Objects: []ontology.ID{userID2},
				Action:  "erasePassword",
			})).To(Equal(access.Denied))

			Expect(svc.Enforce(ctx, access.Request{
				Subject: userID2,
				Objects: []ontology.ID{userID1},
				Action:  "erasePassword",
			})).To(Succeed())
		})
	})
})
