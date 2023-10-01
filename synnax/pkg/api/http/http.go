// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

package http

import (
	"go/types"

	"github.com/synnaxlabs/freighter/fhttp"
	"github.com/synnaxlabs/synnax/pkg/api"
	"github.com/synnaxlabs/synnax/pkg/auth"
)

func New(router *fhttp.Router) (t api.Transport) {
	t.AuthLogin = fhttp.UnaryServer[auth.InsecureCredentials, api.TokenResponse](router, "/api/v1/auth/login")
	t.AuthRegistration = fhttp.UnaryServer[api.RegistrationRequest, api.TokenResponse](router, "/api/v1/auth/register")
	t.AuthChangePassword = fhttp.UnaryServer[api.ChangePasswordRequest, types.Nil](router, "/api/v1/auth/protected/change-password")
	t.AuthChangeUsername = fhttp.UnaryServer[api.ChangeUsernameRequest, types.Nil](router, "/api/v1/auth/protected/change-username")
	t.ChannelCreate = fhttp.UnaryServer[api.ChannelCreateRequest, api.ChannelCreateResponse](router, "/api/v1/channel/create")
	t.ChannelRetrieve = fhttp.UnaryServer[api.ChannelRetrieveRequest, api.ChannelRetrieveResponse](router, "/api/v1/channel/retrieve")
	t.ConnectivityCheck = fhttp.UnaryServer[types.Nil, api.ConnectivityCheckResponse](router, "/api/v1/connectivity/check")
	t.FrameWriter = fhttp.StreamServer[api.FrameWriterRequest, api.FrameWriterResponse](router, "/api/v1/frame/write")
	t.FrameIterator = fhttp.StreamServer[api.FrameIteratorRequest, api.FrameIteratorResponse](router, "/api/v1/frame/iterate")
	t.FrameStreamer = fhttp.StreamServer[api.FrameStreamerRequest, api.FrameStreamerResponse](router, "/api/v1/frame/stream")
	t.OntologyRetrieve = fhttp.UnaryServer[api.OntologyRetrieveRequest, api.OntologyRetrieveResponse](router, "/api/v1/ontology/retrieve")
	t.OntologyGroupCreate = fhttp.UnaryServer[api.OntologyCreateGroupRequest, api.OntologyCreateGroupResponse](router, "/api/v1/ontology/create-group")
	t.OntologyGroupDelete = fhttp.UnaryServer[api.OntologyDeleteGroupRequest, types.Nil](router, "/api/v1/ontology/delete-group")
	t.OntologyGroupRename = fhttp.UnaryServer[api.OntologyRenameGroupRequest, types.Nil](router, "/api/v1/ontology/rename-group")
	t.OntologyAddChildren = fhttp.UnaryServer[api.OntologyAddChildrenRequest, types.Nil](router, "/api/v1/ontology/add-children")
	t.OntologyRemoveChildren = fhttp.UnaryServer[api.OntologyRemoveChildrenRequest, types.Nil](router, "/api/v1/ontology/remove-children")
	t.OntologyMoveChildren = fhttp.UnaryServer[api.OntologyMoveChildrenRequest, types.Nil](router, "/api/v1/ontology/move-children")
	t.RangeRetrieve = fhttp.UnaryServer[api.RangeRetrieveRequest, api.RangeRetrieveResponse](router, "/api/v1/range/retrieve")
	t.RangeCreate = fhttp.UnaryServer[api.RangeCreateRequest, api.RangeCreateResponse](router, "/api/v1/range/create")
	t.WorkspaceCreate = fhttp.UnaryServer[api.WorkspaceCreateRequest, api.WorkspaceCreateResponse](router, "/api/v1/workspace/create")
	t.WorkspaceRetrieve = fhttp.UnaryServer[api.WorkspaceRetrieveRequest, api.WorkspaceRetrieveResponse](router, "/api/v1/workspace/retrieve")
	t.WorkspaceDelete = fhttp.UnaryServer[api.WorkspaceDeleteRequest, types.Nil](router, "/api/v1/workspace/delete")
	t.WorkspaceRename = fhttp.UnaryServer[api.WorkspaceRenameRequest, types.Nil](router, "/api/v1/workspace/rename")
	t.WorkspaceSetLayout = fhttp.UnaryServer[api.WorkspaceSetLayoutRequest, types.Nil](router, "/api/v1/workspace/set-layout")
	t.PIDCreate = fhttp.UnaryServer[api.PIDCreateRequest, api.PIDCreateResponse](router, "/api/v1/workspace/pid/create")
	t.PIDRetrieve = fhttp.UnaryServer[api.PIDRetrieveRequest, api.PIDRetrieveResponse](router, "/api/v1/workspace/pid/retrieve")
	t.PIDDelete = fhttp.UnaryServer[api.PIDDeleteRequest, types.Nil](router, "/api/v1/workspace/pid/delete")
	t.PIDRename = fhttp.UnaryServer[api.PIDRenameRequest, types.Nil](router, "/api/v1/workspace/pid/rename")
	t.PIDSetData = fhttp.UnaryServer[api.PIDSetDataRequest, types.Nil](router, "/api/v1/workspace/pid/set-data")
	t.LinePlotCreate = fhttp.UnaryServer[api.LinePlotCreateRequest, api.LinePlotCreateResponse](router, "/api/v1/workspace/lineplot/create")
	t.LinePlotRetrieve = fhttp.UnaryServer[api.LinePlotRetrieveRequest, api.LinePlotRetrieveResponse](router, "/api/v1/workspace/lineplot/retrieve")
	t.LinePlotDelete = fhttp.UnaryServer[api.LinePlotDeleteRequest, types.Nil](router, "/api/v1/workspace/lineplot/delete")
	t.LinePlotRename = fhttp.UnaryServer[api.LinePlotRenameRequest, types.Nil](router, "/api/v1/workspace/lineplot/rename")
	t.LinePlotSetData = fhttp.UnaryServer[api.LinePlotSetDataRequest, types.Nil](router, "/api/v1/workspace/lineplot/set-data")
	return t
}
