// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

package api

import (
	"context"

	roacherrors "github.com/cockroachdb/errors"
	"github.com/synnaxlabs/synnax/pkg/api/errors"
	"github.com/synnaxlabs/synnax/pkg/auth"
	"github.com/synnaxlabs/synnax/pkg/auth/password"
	"github.com/synnaxlabs/synnax/pkg/user"
	"github.com/synnaxlabs/x/gorp"
)

// AuthService is the core authentication service for the delta API.
type AuthService struct {
	validationProvider
	dbProvider
	authProvider
	userProvider
}

func NewAuthServer(p Provider) *AuthService {
	return &AuthService{
		validationProvider: p.Validation,
		dbProvider:         p.db,
		authProvider:       p.auth,
		userProvider:       p.user,
	}
}

// Login attempts to authenticate a user with the provided credentials. If successful,
// returns a response containing a valid JWT along with the user's details.
func (s *AuthService) Login(ctx context.Context, cred auth.InsecureCredentials) (tr TokenResponse, _ errors.Typed) {
	if err := s.Validate(&cred); err.Occurred() {
		return tr, err
	}
	if err := s.authenticator.Authenticate(ctx, cred); err != nil {
		if roacherrors.Is(err, auth.InvalidCredentials) {
			return tr, errors.Auth(roacherrors.New("Invalid authentication credentials"))
		}
		return tr, errors.Unexpected(err)
	}
	u, err := s.user.RetrieveByUsername(ctx, cred.Username)
	if err != nil {
		return tr, errors.Unexpected(err)
	}
	return s.tokenResponse(u)
}

// RegistrationRequest is an API request to register a new user.
type RegistrationRequest struct {
	auth.InsecureCredentials
}

// Register registers new user with the provided credentials. If successful, returns a
// response containing a valid JWT along with the user's details.
func (s *AuthService) Register(ctx context.Context, req RegistrationRequest) (tr TokenResponse, _ errors.Typed) {
	if err := s.Validate(req); err.Occurred() {
		return tr, err
	}
	return tr, s.WithTx(ctx, func(txn gorp.Tx) errors.Typed {
		if err := s.authenticator.NewWriter(txn).Register(ctx, req.InsecureCredentials); err != nil {
			return errors.General(err)
		}
		u := &user.User{Username: req.Username}
		if err := s.user.NewWriter(txn).Create(ctx, u); err != nil {
			return errors.General(err)
		}
		var tErr errors.Typed
		tr, tErr = s.tokenResponse(*u)
		return tErr
	})
}

// ChangePasswordRequest is an API request to change the password for a user.
type ChangePasswordRequest struct {
	auth.InsecureCredentials
	NewPassword password.Raw `json:"new_password" msgpack:"new_password" validate:"required"`
}

// ChangePassword changes the password for the user with the provided credentials.
func (s *AuthService) ChangePassword(ctx context.Context, cpr ChangePasswordRequest) errors.Typed {
	if err := s.Validate(cpr); err.Occurred() {
		return err
	}
	return s.WithTx(ctx, func(txn gorp.Tx) errors.Typed {
		return errors.MaybeGeneral(s.authenticator.NewWriter(txn).
			UpdatePassword(ctx, cpr.InsecureCredentials, cpr.NewPassword))
	})
}

// ChangeUsernameRequest is an API request to change the username for a user.
type ChangeUsernameRequest struct {
	auth.InsecureCredentials `json:"" msgpack:""`
	NewUsername              string `json:"new_username" msgpack:"new_username" validate:"required"`
}

// ChangeUsername changes the username for the user with the provided credentials.
func (s *AuthService) ChangeUsername(ctx context.Context, cur ChangeUsernameRequest) errors.Typed {
	if err := s.Validate(&cur); err.Occurred() {
		return err
	}
	return s.WithTx(ctx, func(txn gorp.Tx) errors.Typed {
		u, err := s.user.RetrieveByUsername(ctx, cur.InsecureCredentials.Username)
		if err != nil {
			return errors.MaybeQuery(err)
		}
		if err := s.authenticator.NewWriter(txn).UpdateUsername(
			ctx,
			cur.InsecureCredentials,
			cur.NewUsername,
		); err != nil {
			return errors.Unexpected(err)
		}
		u.Username = cur.NewUsername
		return errors.MaybeUnexpected(s.user.NewWriter(txn).Update(ctx, u))
	})
}

// TokenResponse is a response containing a valid JWT along with details about the user
// the token is associated with.
type TokenResponse struct {
	// User is the user the token is associated with.
	User user.User `json:"user"`
	// Token is the JWT.
	Token string `json:"token"`
}

func (s *AuthService) tokenResponse(u user.User) (TokenResponse, errors.Typed) {
	tk, err := s.token.New(u.Key)
	return TokenResponse{User: u, Token: tk}, errors.MaybeUnexpected(err)
}
