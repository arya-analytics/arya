package mock

import (
	"crypto/rand"
	"crypto/rsa"
	"time"

	"github.com/synnaxlabs/synnax/pkg/access"
	"github.com/synnaxlabs/synnax/pkg/api"
	"github.com/synnaxlabs/synnax/pkg/auth"
	"github.com/synnaxlabs/synnax/pkg/auth/token"
	"github.com/synnaxlabs/synnax/pkg/distribution"
	"github.com/synnaxlabs/synnax/pkg/distribution/mock"
	"github.com/synnaxlabs/synnax/pkg/user"
	"go.uber.org/zap"
)

type Builder struct {
	mock.Builder
}

func (b *Builder) New() api.Provider { return api.NewProvider(b.NewConfig()) }

func (b *Builder) NewConfig() api.Config {
	dist := b.Builder.New()
	key, err := rsa.GenerateKey(rand.Reader, 1024)
	if err != nil {
		panic(err)
	}
	return api.Config{
		Logger:        zap.NewNop(),
		Channel:       dist.Channel,
		Segment:       dist.Segment,
		Ontology:      dist.Ontology,
		Storage:       dist.Storage,
		User:          &user.Service{DB: dist.Storage.Gorpify(), Ontology: dist.Ontology},
		Token:         &token.Service{Secret: key, Expiration: 10000 * time.Hour},
		Authenticator: &auth.KV{DB: dist.Storage.Gorpify()},
		Enforcer:      access.AllowAll{},
	}

}

func New(cfg ...distribution.Config) *Builder {
	builder := &Builder{}
	builder.Builder = *mock.NewBuilder(cfg...)
	return builder
}
