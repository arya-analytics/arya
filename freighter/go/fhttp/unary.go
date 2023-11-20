// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

package fhttp

import (
	"bytes"
	"context"
	"crypto/tls"
	"net/http"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/samber/lo"

	"github.com/gofiber/fiber/v2/utils"
	"github.com/synnaxlabs/freighter"
	"github.com/synnaxlabs/freighter/ferrors"
	"github.com/synnaxlabs/x/address"
	"github.com/synnaxlabs/x/httputil"
)

type unaryServer[RQ, RS freighter.Payload] struct {
	freighter.Reporter
	freighter.MiddlewareCollector
	requestParser func(c *fiber.Ctx, ecd httputil.EncoderDecoder) (RQ, error)
	path          string
	handle        func(ctx context.Context, rq RQ) (RS, error)
}

func (s *unaryServer[RQ, RS]) BindHandler(handle func(ctx context.Context, rq RQ) (RS, error)) {
	s.handle = handle
}

func (s *unaryServer[RQ, RS]) fiberHandler(c *fiber.Ctx) error {
	c.Accepts(httputil.SupportedContentTypes()...)
	ecd, err := httputil.DetermineEncoderDecoder(c.Get(fiber.HeaderContentType))
	if err != nil {
		return err
	}
	c.Set(fiber.HeaderContentType, ecd.ContentType())
	var res RS
	oMD, err := s.MiddlewareCollector.Exec(
		parseRequestCtx(c, address.Address(c.Path())),
		freighter.FinalizerFunc(func(ctx freighter.Context) (freighter.Context, error) {
			req, err := s.requestParser(c, ecd)
			oCtx := freighter.Context{Protocol: ctx.Protocol, Params: make(freighter.Params)}
			if err != nil {
				return oCtx, err
			}
			res, err = s.handle(ctx, req)
			return oCtx, err
		}),
	)
	setResponseCtx(c, oMD)
	fErr := ferrors.Encode(err)
	if fErr.Type == ferrors.TypeNil {
		return encodeAndWrite(c, ecd, res)
	}
	c.Status(fiber.StatusBadRequest)
	return encodeAndWrite(c, ecd, fErr)
}

type unaryClient[RQ, RS freighter.Payload] struct {
	freighter.Reporter
	freighter.MiddlewareCollector
	ecd httputil.EncoderDecoder
}

func (u *unaryClient[RQ, RS]) Send(
	ctx context.Context,
	target address.Address,
	req RQ,
) (res RS, err error) {
	_, err = u.MiddlewareCollector.Exec(
		freighter.Context{
			Context:  ctx,
			Protocol: unaryReporter.Protocol,
			Target:   target,
		},
		freighter.FinalizerFunc(func(iMD freighter.Context) (oMD freighter.Context, err error) {
			b, err := u.ecd.Encode(nil, req)
			if err != nil {
				return oMD, err
			}
			httpReq, err := http.NewRequestWithContext(
				ctx,
				"POST",
				"http://"+target.String(),
				bytes.NewReader(b),
			)
			if err != nil {
				return oMD, err
			}
			setRequestCtx(httpReq, iMD)
			httpReq.Header.Set(fiber.HeaderContentType, u.ecd.ContentType())

			httpRes, err := (&http.Client{}).Do(httpReq)
			oMD = parseResponseCtx(httpRes, target)
			if err != nil {
				return oMD, err
			}

			if httpRes.StatusCode < 200 || httpRes.StatusCode >= 300 {
				var pld ferrors.Payload
				if err := u.ecd.DecodeStream(nil, httpRes.Body, &pld); err != nil {
					return oMD, err
				}
				return oMD, ferrors.Decode(pld)
			}
			return oMD, u.ecd.DecodeStream(nil, httpRes.Body, &res)
		}),
	)
	return res, err
}

func encodeAndWrite(c *fiber.Ctx, ecd httputil.EncoderDecoder, v interface{}) error {
	b, err := ecd.Encode(nil, v)
	if err != nil {
		return err
	}
	_, err = c.Write(b)
	return err
}

func parseRequestCtx(c *fiber.Ctx, target address.Address) freighter.Context {
	md := freighter.Context{
		Context:  c.Context(),
		Protocol: unaryReporter.Protocol,
		Target:   target,
		Sec:      parseSecurityInfo(c),
		Role:     freighter.Server,
		Variant:  freighter.Unary,
	}
	headers := c.GetReqHeaders()
	md.Params = make(freighter.Params, len(headers))
	for k, v := range c.GetReqHeaders() {
		md.Params[k] = v
	}
	for k, v := range parseQueryString(c) {
		if isFreighterQueryStringParam(k) {
			md.Params[strings.TrimPrefix(k, freighterCtxPrefix)] = v
		}
	}
	return md
}

func parseSecurityInfo(c *fiber.Ctx) (info freighter.SecurityInfo) {
	if c.Context().IsTLS() {
		info.TLS.Used = true
		info.TLS.ConnectionState = c.Context().Conn().(*tls.Conn).ConnectionState()
	}
	return info
}

func setRequestCtx(c *http.Request, ctx freighter.Context) {
	for k, v := range ctx.Params {
		if vStr, ok := v.(string); ok {
			c.Header.Set(freighterCtxPrefix+k, vStr)
		}
	}
}

func setResponseCtx(c *fiber.Ctx, md freighter.Context) {
	for k, v := range md.Params {
		if vStr, ok := v.(string); ok {
			c.Set(freighterCtxPrefix+k, vStr)
		}
	}
}

func parseResponseCtx(c *http.Response, target address.Address) freighter.Context {
	md := freighter.Context{
		Role:     freighter.Client,
		Variant:  freighter.Unary,
		Protocol: unaryReporter.Protocol,
		Target:   target,
		Params: lo.Ternary(
			len(c.Header) > 0,
			make(freighter.Params, len(c.Header)),
			nil,
		),
	}
	for k, v := range c.Header {
		md.Params[k] = v[0]
	}
	return md
}

func parseQueryString(c *fiber.Ctx) map[string]string {
	data := make(map[string]string)
	c.Context().QueryArgs().VisitAll(func(key, val []byte) {
		k := utils.UnsafeString(key)
		v := utils.UnsafeString(val)
		data[k] = v
	})
	return data
}

const freighterCtxPrefix = "freighterctx"

func isFreighterQueryStringParam(k string) bool {
	// check if the key has the md prefix
	return strings.HasPrefix(k, freighterCtxPrefix)
}
