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
	"context"
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	"github.com/synnaxlabs/cesium"
	. "github.com/synnaxlabs/x/testutil"
	"testing"
)

var ctx = context.Background()

func openMemDB() *cesium.DB {
	return MustSucceed(cesium.Open(
		"./testdata",
		cesium.MemBacked(),
	))
}

func TestCesium(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "Cesium Suite")
}
