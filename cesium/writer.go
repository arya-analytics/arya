// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

package cesium

import (
	"github.com/cockroachdb/errors"
	"github.com/synnaxlabs/x/confluence"
	"github.com/synnaxlabs/x/signal"
	"github.com/synnaxlabs/x/telem"
	"go.uber.org/zap"
)

type Writer struct {
	requests          confluence.Inlet[WriterRequest]
	responses         confluence.Outlet[WriterResponse]
	wg                signal.WaitGroup
	logger            *zap.Logger
	hasAccumulatedErr bool
}

const unexpectedSteamClosure = "[cesium] - unexpected early closure of response stream"

func wrapStreamWriter(internal StreamWriter) *Writer {
	sCtx, _ := signal.Isolated()
	req := confluence.NewStream[WriterRequest](1)
	res := confluence.NewStream[WriterResponse](1)
	internal.InFrom(req)
	internal.OutTo(res)
	internal.Flow(
		sCtx,
		confluence.CloseInletsOnExit(),
	)
	return &Writer{requests: req, responses: res, wg: sCtx}
}

func (w *Writer) Write(frame Frame) bool {
	if w.hasAccumulatedErr {
		return false
	}
	select {
	case <-w.responses.Outlet():
		w.hasAccumulatedErr = true
		return false
	case w.requests.Inlet() <- WriterRequest{Frame: frame, Command: WriterWrite}:
		return true
	}
}

func (w *Writer) Commit() (telem.TimeStamp, bool) {
	if w.hasAccumulatedErr {
		return 0, false
	}
	select {
	case <-w.responses.Outlet():
		w.hasAccumulatedErr = true
		return 0, false
	case w.requests.Inlet() <- WriterRequest{Command: WriterCommit}:
	}
	for res := range w.responses.Outlet() {
		if res.Command == WriterCommit {
			return res.End, res.Ack
		}
	}
	w.logger.DPanic(unexpectedSteamClosure)
	return 0, false
}

func (w *Writer) Error() error {
	w.requests.Inlet() <- WriterRequest{Command: WriterError}
	for res := range w.responses.Outlet() {
		if res.Command == WriterError {
			w.hasAccumulatedErr = false
			return res.Err
		}
	}
	w.logger.DPanic(unexpectedSteamClosure)
	return errors.New(unexpectedSteamClosure)
}

func (w *Writer) SetMode(mode WriterMode) bool {
	if w.hasAccumulatedErr {
		return false
	}
	select {
	case <-w.responses.Outlet():
		w.hasAccumulatedErr = true
		return false
	case w.requests.Inlet() <- WriterRequest{Command: WriterSetMode, Config: WriterConfig{Mode: mode}}:
	}
	for res := range w.responses.Outlet() {
		if res.Command == WriterSetMode {
			return res.Ack
		}
	}
	w.logger.DPanic(unexpectedSteamClosure)
	return false
}

func (w *Writer) Close() (err error) {
	w.requests.Close()
	for range w.responses.Outlet() {
	}
	return w.wg.Wait()
}
