package cdc_test

import (
	"github.com/google/uuid"
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	"github.com/synnaxlabs/synnax/pkg/distribution/cdc"
	"github.com/synnaxlabs/synnax/pkg/distribution/channel"
	"github.com/synnaxlabs/synnax/pkg/distribution/framer"
	"github.com/synnaxlabs/x/change"
	"github.com/synnaxlabs/x/confluence"
	"github.com/synnaxlabs/x/observe"
	"github.com/synnaxlabs/x/signal"
	"github.com/synnaxlabs/x/telem"
	. "github.com/synnaxlabs/x/testutil"
	"io"
)

var _ = Describe("Observable", Ordered, Serial, func() {
	var (
		obs           observe.Observer[[]change.Change[[]byte, struct{}]]
		cfg           cdc.ObservableConfig
		closer        io.Closer
		streamer      framer.Streamer
		requests      confluence.Inlet[framer.StreamerRequest]
		responses     confluence.Outlet[framer.StreamerResponse]
		closeStreamer io.Closer
	)
	BeforeEach(func() {
		obs = observe.New[[]change.Change[[]byte, struct{}]]()
		cfg = cdc.ObservableConfig{
			Set:        channel.Channel{Name: "observable_set", DataType: telem.UUIDT},
			Delete:     channel.Channel{Name: "observable_delete", DataType: telem.UUIDT},
			Observable: obs,
		}
		closer = MustSucceed(dist.CDC.SubscribeToObservable(ctx, cfg))
		Expect(dist.Channel.NewRetrieve().
			WhereNames("observable_set").
			Entry(&cfg.Set).
			Exec(ctx, nil),
		).To(Succeed())
		Expect(dist.Channel.NewRetrieve().
			WhereNames("observable_delete").
			Entry(&cfg.Delete).
			Exec(ctx, nil),
		).To(Succeed())
		streamer = MustSucceed(dist.Framer.NewStreamer(ctx, framer.StreamerConfig{
			Keys:  channel.Keys{cfg.Set.Key(), cfg.Delete.Key()},
			Start: telem.Now(),
		}))
		requests, responses = confluence.Attach(streamer, 2)
		sCtx, cancel := signal.Isolated()
		closeStreamer = signal.NewShutdown(sCtx, cancel)
		streamer.Flow(sCtx, confluence.CloseInletsOnExit())
	})
	AfterEach(func() {
		requests.Close()
		confluence.Drain(responses)
		Expect(closeStreamer.Close()).To(Succeed())
		Expect(closer.Close()).To(Succeed())
	})
	It("Should correctly propagate a change", func() {
		uid := uuid.New()
		obs.Notify(ctx, []change.Change[[]byte, struct{}]{{
			Variant: change.Set,
			Key:     uid[:],
		}})
		streamRes := <-responses.Outlet()
		Expect(streamRes.Frame.Keys).To(ConsistOf(cfg.Set.Key()))
		Expect(streamRes.Frame.Series[0].Data).To(HaveLen(int(telem.Bit128)))
		Expect(streamRes.Frame.Series[0].Data).To(Equal(uid[:]))
	})
	It("Should not send an empty frame if an empty list of changes is provided", func() {
		obs.Notify(ctx, []change.Change[[]byte, struct{}]{})
		Expect(responses.Outlet()).ToNot(Receive())
	})
})
