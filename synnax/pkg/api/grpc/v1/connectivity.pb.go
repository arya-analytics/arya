// Code generated by protoc-gen-go. DO NOT EDIT.
// versions:
// 	protoc-gen-go v1.34.1
// 	protoc        (unknown)
// source: synnax/pkg/api/grpc/v1/connectivity.proto

package v1

import (
	protoreflect "google.golang.org/protobuf/reflect/protoreflect"
	protoimpl "google.golang.org/protobuf/runtime/protoimpl"
	emptypb "google.golang.org/protobuf/types/known/emptypb"
	reflect "reflect"
	sync "sync"
)

const (
	// Verify that this generated code is sufficiently up-to-date.
	_ = protoimpl.EnforceVersion(20 - protoimpl.MinVersion)
	// Verify that runtime/protoimpl is sufficiently up-to-date.
	_ = protoimpl.EnforceVersion(protoimpl.MaxVersion - 20)
)

type ConnectivityCheckResponse struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	ClusterKey string `protobuf:"bytes,1,opt,name=cluster_key,json=clusterKey,proto3" json:"cluster_key,omitempty"`
}

func (x *ConnectivityCheckResponse) Reset() {
	*x = ConnectivityCheckResponse{}
	if protoimpl.UnsafeEnabled {
		mi := &file_synnax_pkg_api_grpc_v1_connectivity_proto_msgTypes[0]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *ConnectivityCheckResponse) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*ConnectivityCheckResponse) ProtoMessage() {}

func (x *ConnectivityCheckResponse) ProtoReflect() protoreflect.Message {
	mi := &file_synnax_pkg_api_grpc_v1_connectivity_proto_msgTypes[0]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use ConnectivityCheckResponse.ProtoReflect.Descriptor instead.
func (*ConnectivityCheckResponse) Descriptor() ([]byte, []int) {
	return file_synnax_pkg_api_grpc_v1_connectivity_proto_rawDescGZIP(), []int{0}
}

func (x *ConnectivityCheckResponse) GetClusterKey() string {
	if x != nil {
		return x.ClusterKey
	}
	return ""
}

var File_synnax_pkg_api_grpc_v1_connectivity_proto protoreflect.FileDescriptor

var file_synnax_pkg_api_grpc_v1_connectivity_proto_rawDesc = []byte{
	0x0a, 0x29, 0x73, 0x79, 0x6e, 0x6e, 0x61, 0x78, 0x2f, 0x70, 0x6b, 0x67, 0x2f, 0x61, 0x70, 0x69,
	0x2f, 0x67, 0x72, 0x70, 0x63, 0x2f, 0x76, 0x31, 0x2f, 0x63, 0x6f, 0x6e, 0x6e, 0x65, 0x63, 0x74,
	0x69, 0x76, 0x69, 0x74, 0x79, 0x2e, 0x70, 0x72, 0x6f, 0x74, 0x6f, 0x12, 0x06, 0x61, 0x70, 0x69,
	0x2e, 0x76, 0x31, 0x1a, 0x1b, 0x67, 0x6f, 0x6f, 0x67, 0x6c, 0x65, 0x2f, 0x70, 0x72, 0x6f, 0x74,
	0x6f, 0x62, 0x75, 0x66, 0x2f, 0x65, 0x6d, 0x70, 0x74, 0x79, 0x2e, 0x70, 0x72, 0x6f, 0x74, 0x6f,
	0x22, 0x3c, 0x0a, 0x19, 0x43, 0x6f, 0x6e, 0x6e, 0x65, 0x63, 0x74, 0x69, 0x76, 0x69, 0x74, 0x79,
	0x43, 0x68, 0x65, 0x63, 0x6b, 0x52, 0x65, 0x73, 0x70, 0x6f, 0x6e, 0x73, 0x65, 0x12, 0x1f, 0x0a,
	0x0b, 0x63, 0x6c, 0x75, 0x73, 0x74, 0x65, 0x72, 0x5f, 0x6b, 0x65, 0x79, 0x18, 0x01, 0x20, 0x01,
	0x28, 0x09, 0x52, 0x0a, 0x63, 0x6c, 0x75, 0x73, 0x74, 0x65, 0x72, 0x4b, 0x65, 0x79, 0x32, 0x5a,
	0x0a, 0x13, 0x43, 0x6f, 0x6e, 0x6e, 0x65, 0x63, 0x74, 0x69, 0x76, 0x69, 0x74, 0x79, 0x53, 0x65,
	0x72, 0x76, 0x69, 0x63, 0x65, 0x12, 0x43, 0x0a, 0x04, 0x45, 0x78, 0x65, 0x63, 0x12, 0x16, 0x2e,
	0x67, 0x6f, 0x6f, 0x67, 0x6c, 0x65, 0x2e, 0x70, 0x72, 0x6f, 0x74, 0x6f, 0x62, 0x75, 0x66, 0x2e,
	0x45, 0x6d, 0x70, 0x74, 0x79, 0x1a, 0x21, 0x2e, 0x61, 0x70, 0x69, 0x2e, 0x76, 0x31, 0x2e, 0x43,
	0x6f, 0x6e, 0x6e, 0x65, 0x63, 0x74, 0x69, 0x76, 0x69, 0x74, 0x79, 0x43, 0x68, 0x65, 0x63, 0x6b,
	0x52, 0x65, 0x73, 0x70, 0x6f, 0x6e, 0x73, 0x65, 0x22, 0x00, 0x42, 0x86, 0x01, 0x0a, 0x0a, 0x63,
	0x6f, 0x6d, 0x2e, 0x61, 0x70, 0x69, 0x2e, 0x76, 0x31, 0x42, 0x11, 0x43, 0x6f, 0x6e, 0x6e, 0x65,
	0x63, 0x74, 0x69, 0x76, 0x69, 0x74, 0x79, 0x50, 0x72, 0x6f, 0x74, 0x6f, 0x50, 0x01, 0x5a, 0x2c,
	0x67, 0x69, 0x74, 0x68, 0x75, 0x62, 0x2e, 0x63, 0x6f, 0x6d, 0x2f, 0x73, 0x79, 0x6e, 0x6e, 0x61,
	0x78, 0x6c, 0x61, 0x62, 0x73, 0x2f, 0x73, 0x79, 0x6e, 0x6e, 0x61, 0x78, 0x2f, 0x70, 0x6b, 0x67,
	0x2f, 0x61, 0x70, 0x69, 0x2f, 0x67, 0x72, 0x70, 0x63, 0x2f, 0x76, 0x31, 0xa2, 0x02, 0x03, 0x41,
	0x58, 0x58, 0xaa, 0x02, 0x06, 0x41, 0x70, 0x69, 0x2e, 0x56, 0x31, 0xca, 0x02, 0x06, 0x41, 0x70,
	0x69, 0x5c, 0x56, 0x31, 0xe2, 0x02, 0x12, 0x41, 0x70, 0x69, 0x5c, 0x56, 0x31, 0x5c, 0x47, 0x50,
	0x42, 0x4d, 0x65, 0x74, 0x61, 0x64, 0x61, 0x74, 0x61, 0xea, 0x02, 0x07, 0x41, 0x70, 0x69, 0x3a,
	0x3a, 0x56, 0x31, 0x62, 0x06, 0x70, 0x72, 0x6f, 0x74, 0x6f, 0x33,
}

var (
	file_synnax_pkg_api_grpc_v1_connectivity_proto_rawDescOnce sync.Once
	file_synnax_pkg_api_grpc_v1_connectivity_proto_rawDescData = file_synnax_pkg_api_grpc_v1_connectivity_proto_rawDesc
)

func file_synnax_pkg_api_grpc_v1_connectivity_proto_rawDescGZIP() []byte {
	file_synnax_pkg_api_grpc_v1_connectivity_proto_rawDescOnce.Do(func() {
		file_synnax_pkg_api_grpc_v1_connectivity_proto_rawDescData = protoimpl.X.CompressGZIP(file_synnax_pkg_api_grpc_v1_connectivity_proto_rawDescData)
	})
	return file_synnax_pkg_api_grpc_v1_connectivity_proto_rawDescData
}

var file_synnax_pkg_api_grpc_v1_connectivity_proto_msgTypes = make([]protoimpl.MessageInfo, 1)
var file_synnax_pkg_api_grpc_v1_connectivity_proto_goTypes = []interface{}{
	(*ConnectivityCheckResponse)(nil), // 0: api.v1.ConnectivityCheckResponse
	(*emptypb.Empty)(nil),             // 1: google.protobuf.Empty
}
var file_synnax_pkg_api_grpc_v1_connectivity_proto_deschematicxs = []int32{
	1, // 0: api.v1.ConnectivityService.Exec:input_type -> google.protobuf.Empty
	0, // 1: api.v1.ConnectivityService.Exec:output_type -> api.v1.ConnectivityCheckResponse
	1, // [1:2] is the sub-list for method output_type
	0, // [0:1] is the sub-list for method input_type
	0, // [0:0] is the sub-list for extension type_name
	0, // [0:0] is the sub-list for extension extendee
	0, // [0:0] is the sub-list for field type_name
}

func init() { file_synnax_pkg_api_grpc_v1_connectivity_proto_init() }
func file_synnax_pkg_api_grpc_v1_connectivity_proto_init() {
	if File_synnax_pkg_api_grpc_v1_connectivity_proto != nil {
		return
	}
	if !protoimpl.UnsafeEnabled {
		file_synnax_pkg_api_grpc_v1_connectivity_proto_msgTypes[0].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*ConnectivityCheckResponse); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
	}
	type x struct{}
	out := protoimpl.TypeBuilder{
		File: protoimpl.DescBuilder{
			GoPackagePath: reflect.TypeOf(x{}).PkgPath(),
			RawDescriptor: file_synnax_pkg_api_grpc_v1_connectivity_proto_rawDesc,
			NumEnums:      0,
			NumMessages:   1,
			NumExtensions: 0,
			NumServices:   1,
		},
		GoTypes:           file_synnax_pkg_api_grpc_v1_connectivity_proto_goTypes,
		DependencyIndexes: file_synnax_pkg_api_grpc_v1_connectivity_proto_deschematicxs,
		MessageInfos:      file_synnax_pkg_api_grpc_v1_connectivity_proto_msgTypes,
	}.Build()
	File_synnax_pkg_api_grpc_v1_connectivity_proto = out.File
	file_synnax_pkg_api_grpc_v1_connectivity_proto_rawDesc = nil
	file_synnax_pkg_api_grpc_v1_connectivity_proto_goTypes = nil
	file_synnax_pkg_api_grpc_v1_connectivity_proto_deschematicxs = nil
}
