package main

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestDetect(t *testing.T) {
	require := require.New(t)

	o, err := NewOutliers("outliers", "detect")
	require.NoError(err, "new")
	defer o.Close()

	data, indices := genData()

	out, err := o.Detect(data)
	require.NoError(err, "detect")
	require.Equal(indices, out, "outliers")
}

func TestNotFound(t *testing.T) {
	require := require.New(t)

	_, err := NewOutliers("outliers", "no-such-function")
	require.Error(err, "attribute")

	_, err = NewOutliers("no_such_module", "detect")
	require.Error(err, "module")
}

func TestNil(t *testing.T) {
	require := require.New(t)

	o, err := NewOutliers("outliers", "detect")
	require.NoError(err, "attribute")
	indices, err := o.Detect(nil)
	require.NoError(err, "attribute")
	require.Equal(0, len(indices), "len")
}

func BenchmarkOutliers(b *testing.B) {
	require := require.New(b)
	o, err := NewOutliers("outliers", "detect")
	require.NoError(err, "new")
	defer o.Close()

	data, _ := genData()

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, err := o.Detect(data)
		require.NoError(err)
	}
}
