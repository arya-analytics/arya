package iter_test

import (
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	"github.com/synnaxlabs/x/iter"
)

var _ = Describe("Iter", func() {
	Describe("Endlessly", func() {
		It("Should allow the caller to iterate over a collection of values indefinitely", func() {
			iterations := 10
			n := 5
			values := make([]int, n)
			i := iter.Endlessly(values)
			for j := 0; j < iterations; j++ {
				for k := 0; k < n; k++ {
					v, ok := i.Next(nil)
					Expect(ok).To(BeTrue())
					Expect(v).To(Equal(values[k]))
				}
			}
		})
	})
	Describe("All", func() {
		It("Should allow the caller to iterate over a collection of values once", func() {
			n := 5
			values := make([]int, n)
			i := iter.All(values)
			for j := 0; j < n; j++ {
				v, ok := i.Next(nil)
				Expect(ok).To(BeTrue())
				Expect(v).To(Equal(values[j]))
			}
			v, ok := i.Next(nil)
			Expect(ok).To(BeFalse())
			Expect(v).To(Equal(0))
		})
	})
	Describe("ToSlice", func() {
		It("Should exhaust the iterator and return a slice of values", func() {
			n := 5
			values := make([]int, n)
			i := iter.All(values)
			slice := iter.ToSlice(ctx, i)
			Expect(slice).To(Equal(values))
		})
	})
})
