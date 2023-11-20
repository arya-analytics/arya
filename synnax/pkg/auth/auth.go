// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

package auth

import (
	"context"
	"github.com/synnaxlabs/synnax/pkg/auth/base"
	"github.com/synnaxlabs/synnax/pkg/auth/password"
	"github.com/synnaxlabs/x/gorp"
)

var (
	// InvalidCredentials is returned when the credentials for a particular entity
	// are invalid.
	InvalidCredentials = password.Invalid
	// Error is the base error for all authentication related errors.
	Error = base.AuthError
)

// Authenticator validates the identity of a particular entity (i.e. they are who they
// say they are).
type Authenticator interface {
	// Authenticate validates the identity of the entity with the given credentials.
	// If the credentials are invalid, an InvalidCredentials error is returned.
	Authenticate(ctx context.Context, creds InsecureCredentials) error
	// NewWriter opens a new Writer using the provided write context.
	NewWriter(tx gorp.Tx) Writer
}

// Writer registers new sets of credentials within an authentication service.
type Writer interface {
	// Register registers the given credentials in the authenticator.
	Register(ctx context.Context, creds InsecureCredentials) error
	// UpdateUsername updates the username of the given credentials.
	// If the Authenticator uses the Node's local storage, they can use the provided
	// tx to perform the update.
	UpdateUsername(ctx context.Context, creds InsecureCredentials, newUser string) error
	// UpdatePassword updates the password of the given credentials.
	// If the Authenticator uses the Node's local storage, they can use the provided
	// tx to perform the update.
	UpdatePassword(ctx context.Context, creds InsecureCredentials, newPass password.Raw) error
}
