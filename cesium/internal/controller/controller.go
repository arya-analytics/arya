// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

package controller

import (
	"github.com/cockroachdb/errors"
	"github.com/synnaxlabs/cesium/internal/core"
	"github.com/synnaxlabs/x/control"
	"github.com/synnaxlabs/x/telem"
	"sync"
)

type State = control.State[string, core.ChannelKey]

type Transfer struct {
	From *State
	To   *State
}

func (t Transfer) Occurred() bool { return t.From != nil || t.To != nil }

func (t Transfer) IsRelease() bool { return t.Occurred() && t.To == nil }

type Entity interface {
	ChannelKey() core.ChannelKey
}

// Gate controls access to an entity for a given region of time.
type Gate[E Entity] struct {
	Config
	r           *region[E]
	position    int64
	concurrency control.Concurrency
}

func (g *Gate[E]) state() *State {
	return &State{
		Subject:   g.Name,
		Resource:  g.r.entity.ChannelKey(),
		Authority: g.Authority,
	}
}

// Authorize authorizes the gates access to the entity. If another gate has precedence,
// Authorize will return false.
func (g *Gate[E]) Authorize() (e E, ok bool) {
	g.r.RLock()
	// In the case of exclusive concurrency, we only need to check if the gate is the
	// current gate.
	if g.concurrency == control.Exclusive {
		ok = g.r.curr == g
	} else {
		// In the case of shared concurrency, we need to check if the gate has equal to
		// or higher authority than the current gate.
		ok = g.Authority >= g.r.curr.Authority
	}
	g.r.RUnlock()
	if !ok {
		return e, false
	}
	return g.r.entity, ok
}

// Release releases the gate's access to the entity. If the gate is the last gate in the
// region, Release will return the entity and true. Otherwise, Release will return the
// entity and false.
func (g *Gate[E]) Release() (entity E, transfer Transfer) {
	return g.r.release(g)
}

// SetAuthority changes the gate's authority.
func (g *Gate[E]) SetAuthority(auth control.Authority) Transfer {
	return g.r.update(g, auth)
}

type region[E Entity] struct {
	sync.RWMutex
	timeRange  telem.TimeRange
	entity     E
	counter    int64
	curr       *Gate[E]
	gates      map[*Gate[E]]struct{}
	controller *Controller[E]
}

// open opens a new gate on the region with the given config.
func (r *region[E]) open(c Config, con control.Concurrency) (*Gate[E], Transfer) {
	r.Lock()
	g := &Gate[E]{
		r:           r,
		Config:      c,
		position:    r.counter,
		concurrency: con,
	}
	t := r.unprotectedOpen(g)
	r.Unlock()
	return g, t
}

// release a gate from the region.
func (r *region[E]) release(g *Gate[E]) (e E, transfer Transfer) {
	r.Lock()
	e, transfer = r.unprotectedRelease(g)
	r.Unlock()
	return
}

// update a gate's authority.
func (r *region[E]) update(g *Gate[E], auth control.Authority) Transfer {
	r.Lock()
	t := r.unprotectedUpdate(g, auth)
	r.Unlock()
	return t
}

func (r *region[E]) unprotectedUpdate(
	g *Gate[E],
	auth control.Authority,
) (t Transfer) {
	g.Authority = auth

	// Gate is in control, should it not be?
	if g == r.curr {
		for og := range r.gates {
			var (
				isGate     = og == g
				higherAuth = og.Authority > r.curr.Authority
				betterPos  = og.Authority == r.curr.Authority && og.position < r.curr.position
			)
			if !isGate && (higherAuth || betterPos) {
				r.curr = og
				t.From = g.state()
				t.To = og.state()
				return t
			}
		}
		// No transfer happened, gate remains in control.
		return t
	}

	// Gate is not in control, should it be?
	higherAuth := g.Authority > r.curr.Authority
	betterPos := g.Authority == r.curr.Authority && g.position < r.curr.position
	if higherAuth || betterPos {
		t.From = r.curr.state()
		r.curr = g
		t.To = g.state()
		return t
	}
	return
}

// unprotectedRelease releases a gate from the region without locking. If the gate is the
// last gate in the region, the region will be removed from the controller and the
// entity and true will be returned. Otherwise, the entity and false will be returned.
func (r *region[E]) unprotectedRelease(g *Gate[E]) (e E, t Transfer) {
	delete(r.gates, g)
	if len(r.gates) == 0 {
		r.controller.remove(r)
		t.From = g.state()
		return r.entity, t
	}
	if g == r.curr {
		t.From = r.curr.state()
		r.curr = nil
		for og := range r.gates {
			// Three cases here: no one is in control, provided gate has higher authority,
			// provided gate has equal authority and a higher position.
			if r.curr == nil || og.Authority > r.curr.Authority || (og.Authority == r.curr.Authority && og.position < r.curr.position) {
				r.curr = og
				t.To = og.state()
			}
		}
	}
	return r.entity, t
}

func (r *region[E]) unprotectedOpen(g *Gate[E]) (t Transfer) {
	if r.curr == nil || g.Authority > r.curr.Authority {
		if r.curr != nil {
			t.From = r.curr.state()
		}
		r.curr = g
		t.To = g.state()
	}
	r.gates[g] = struct{}{}
	r.counter++
	return
}

type Controller[E Entity] struct {
	mu          sync.Mutex
	regions     map[telem.TimeRange]*region[E]
	concurrency control.Concurrency
}

func New[E Entity](c control.Concurrency) *Controller[E] {
	return &Controller[E]{
		regions:     make(map[telem.TimeRange]*region[E]),
		concurrency: c,
	}
}

type Config struct {
	TimeRange telem.TimeRange
	Authority control.Authority
	Name      string
}

func (c *Controller[E]) OpenGate(cfg Config) (g *Gate[E], t Transfer, exists bool) {
	c.mu.Lock()
	for _, r := range c.regions {
		if r.timeRange.OverlapsWith(cfg.TimeRange) {
			g, t = r.open(cfg, c.concurrency)
			r.gates[g] = struct{}{}
			c.mu.Unlock()
			return g, t, true
		}
	}
	c.mu.Unlock()
	return nil, t, false
}

func (c *Controller[E]) Register(
	t telem.TimeRange,
	entity E,
) error {
	c.mu.Lock()
	for _, r := range c.regions {
		if r.timeRange.OverlapsWith(t) {
			c.mu.Unlock()
			return errors.Newf("entity already registered for time range %s", t)
		}
	}
	c.regions[t] = &region[E]{entity: entity, gates: make(map[*Gate[E]]struct{}), timeRange: t, controller: c}
	c.mu.Unlock()
	return nil
}

func (c *Controller[E]) RegisterAndOpenGate(
	cfg Config,
	entity E,
) (*Gate[E], Transfer) {
	c.mu.Lock()
	r := &region[E]{
		entity:     entity,
		gates:      make(map[*Gate[E]]struct{}, 1),
		timeRange:  cfg.TimeRange,
		controller: c,
	}
	g, t := r.open(cfg, c.concurrency)
	r.gates[g] = struct{}{}
	c.regions[cfg.TimeRange] = r
	c.mu.Unlock()
	return g, t
}

func (c *Controller[E]) remove(r *region[E]) {
	c.mu.Lock()
	delete(c.regions, r.timeRange)
	c.mu.Unlock()
}

func Unauthorized(name string, ch core.ChannelKey) error {
	return errors.Wrapf(control.Unauthorized, "writer %s does not have control authority over channel %s", name, ch)
}
