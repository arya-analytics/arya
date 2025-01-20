package calculated_test

import (
	"context"
	"github.com/synnaxlabs/computron"
	"testing"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

var (
	interpreter *computron.Interpreter
	ctx         = context.Background()
)

var _ = BeforeSuite(func() {
	var err error
	interpreter, err = computron.New()
	Expect(err).ToNot(HaveOccurred())
})

func TestCalculated(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "Calculated Suite")
}