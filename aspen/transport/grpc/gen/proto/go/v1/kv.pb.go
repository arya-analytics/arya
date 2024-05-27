// Code generated by protoc-gen-go. DO NOT EDIT.
// versions:
// 	protoc-gen-go v1.28.1
// 	protoc        (unknown)
// source: v1/kv.proto

package aspenv1

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

type FeedbackMessage struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	Sender  uint32             `protobuf:"varint,1,opt,name=sender,proto3" json:"sender,omitempty"`
	Digests []*OperationDigest `protobuf:"bytes,2,rep,name=digests,proto3" json:"digests,omitempty"`
}

func (x *FeedbackMessage) Reset() {
	*x = FeedbackMessage{}
	if protoimpl.UnsafeEnabled {
		mi := &file_v1_kv_proto_msgTypes[0]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *FeedbackMessage) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*FeedbackMessage) ProtoMessage() {}

func (x *FeedbackMessage) ProtoReflect() protoreflect.Message {
	mi := &file_v1_kv_proto_msgTypes[0]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use FeedbackMessage.ProtoReflect.Descriptor instead.
func (*FeedbackMessage) Descriptor() ([]byte, []int) {
	return file_v1_kv_proto_rawDescGZIP(), []int{0}
}

func (x *FeedbackMessage) GetSender() uint32 {
	if x != nil {
		return x.Sender
	}
	return 0
}

func (x *FeedbackMessage) GetDigests() []*OperationDigest {
	if x != nil {
		return x.Digests
	}
	return nil
}

type OperationDigest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	Version     int64  `protobuf:"varint,1,opt,name=version,proto3" json:"version,omitempty"`
	Leaseholder uint32 `protobuf:"varint,2,opt,name=leaseholder,proto3" json:"leaseholder,omitempty"`
	Key         []byte `protobuf:"bytes,3,opt,name=key,proto3" json:"key,omitempty"`
}

func (x *OperationDigest) Reset() {
	*x = OperationDigest{}
	if protoimpl.UnsafeEnabled {
		mi := &file_v1_kv_proto_msgTypes[1]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *OperationDigest) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*OperationDigest) ProtoMessage() {}

func (x *OperationDigest) ProtoReflect() protoreflect.Message {
	mi := &file_v1_kv_proto_msgTypes[1]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use OperationDigest.ProtoReflect.Descriptor instead.
func (*OperationDigest) Descriptor() ([]byte, []int) {
	return file_v1_kv_proto_rawDescGZIP(), []int{1}
}

func (x *OperationDigest) GetVersion() int64 {
	if x != nil {
		return x.Version
	}
	return 0
}

func (x *OperationDigest) GetLeaseholder() uint32 {
	if x != nil {
		return x.Leaseholder
	}
	return 0
}

func (x *OperationDigest) GetKey() []byte {
	if x != nil {
		return x.Key
	}
	return nil
}

type BatchRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	Sender      uint32       `protobuf:"varint,1,opt,name=sender,proto3" json:"sender,omitempty"`
	Leaseholder uint32       `protobuf:"varint,2,opt,name=leaseholder,proto3" json:"leaseholder,omitempty"`
	Operations  []*Operation `protobuf:"bytes,3,rep,name=operations,proto3" json:"operations,omitempty"`
}

func (x *BatchRequest) Reset() {
	*x = BatchRequest{}
	if protoimpl.UnsafeEnabled {
		mi := &file_v1_kv_proto_msgTypes[2]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *BatchRequest) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*BatchRequest) ProtoMessage() {}

func (x *BatchRequest) ProtoReflect() protoreflect.Message {
	mi := &file_v1_kv_proto_msgTypes[2]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use BatchRequest.ProtoReflect.Descriptor instead.
func (*BatchRequest) Descriptor() ([]byte, []int) {
	return file_v1_kv_proto_rawDescGZIP(), []int{2}
}

func (x *BatchRequest) GetSender() uint32 {
	if x != nil {
		return x.Sender
	}
	return 0
}

func (x *BatchRequest) GetLeaseholder() uint32 {
	if x != nil {
		return x.Leaseholder
	}
	return 0
}

func (x *BatchRequest) GetOperations() []*Operation {
	if x != nil {
		return x.Operations
	}
	return nil
}

type Operation struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	Variant     uint32 `protobuf:"varint,1,opt,name=variant,proto3" json:"variant,omitempty"`
	Leaseholder uint32 `protobuf:"varint,2,opt,name=leaseholder,proto3" json:"leaseholder,omitempty"`
	Version     int64  `protobuf:"varint,3,opt,name=version,proto3" json:"version,omitempty"`
	Key         []byte `protobuf:"bytes,4,opt,name=key,proto3" json:"key,omitempty"`
	Value       []byte `protobuf:"bytes,5,opt,name=value,proto3" json:"value,omitempty"`
}

func (x *Operation) Reset() {
	*x = Operation{}
	if protoimpl.UnsafeEnabled {
		mi := &file_v1_kv_proto_msgTypes[3]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *Operation) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*Operation) ProtoMessage() {}

func (x *Operation) ProtoReflect() protoreflect.Message {
	mi := &file_v1_kv_proto_msgTypes[3]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use Operation.ProtoReflect.Descriptor instead.
func (*Operation) Descriptor() ([]byte, []int) {
	return file_v1_kv_proto_rawDescGZIP(), []int{3}
}

func (x *Operation) GetVariant() uint32 {
	if x != nil {
		return x.Variant
	}
	return 0
}

func (x *Operation) GetLeaseholder() uint32 {
	if x != nil {
		return x.Leaseholder
	}
	return 0
}

func (x *Operation) GetVersion() int64 {
	if x != nil {
		return x.Version
	}
	return 0
}

func (x *Operation) GetKey() []byte {
	if x != nil {
		return x.Key
	}
	return nil
}

func (x *Operation) GetValue() []byte {
	if x != nil {
		return x.Value
	}
	return nil
}

var File_v1_kv_proto protoreflect.FileDescriptor

var file_v1_kv_proto_rawDesc = []byte{
	0x0a, 0x0b, 0x76, 0x31, 0x2f, 0x6b, 0x76, 0x2e, 0x70, 0x72, 0x6f, 0x74, 0x6f, 0x12, 0x08, 0x61,
	0x73, 0x70, 0x65, 0x6e, 0x2e, 0x76, 0x31, 0x1a, 0x1b, 0x67, 0x6f, 0x6f, 0x67, 0x6c, 0x65, 0x2f,
	0x70, 0x72, 0x6f, 0x74, 0x6f, 0x62, 0x75, 0x66, 0x2f, 0x65, 0x6d, 0x70, 0x74, 0x79, 0x2e, 0x70,
	0x72, 0x6f, 0x74, 0x6f, 0x22, 0x5e, 0x0a, 0x0f, 0x46, 0x65, 0x65, 0x64, 0x62, 0x61, 0x63, 0x6b,
	0x4d, 0x65, 0x73, 0x73, 0x61, 0x67, 0x65, 0x12, 0x16, 0x0a, 0x06, 0x73, 0x65, 0x6e, 0x64, 0x65,
	0x72, 0x18, 0x01, 0x20, 0x01, 0x28, 0x0d, 0x52, 0x06, 0x73, 0x65, 0x6e, 0x64, 0x65, 0x72, 0x12,
	0x33, 0x0a, 0x07, 0x64, 0x69, 0x67, 0x65, 0x73, 0x74, 0x73, 0x18, 0x02, 0x20, 0x03, 0x28, 0x0b,
	0x32, 0x19, 0x2e, 0x61, 0x73, 0x70, 0x65, 0x6e, 0x2e, 0x76, 0x31, 0x2e, 0x4f, 0x70, 0x65, 0x72,
	0x61, 0x74, 0x69, 0x6f, 0x6e, 0x44, 0x69, 0x67, 0x65, 0x73, 0x74, 0x52, 0x07, 0x64, 0x69, 0x67,
	0x65, 0x73, 0x74, 0x73, 0x22, 0x5f, 0x0a, 0x0f, 0x4f, 0x70, 0x65, 0x72, 0x61, 0x74, 0x69, 0x6f,
	0x6e, 0x44, 0x69, 0x67, 0x65, 0x73, 0x74, 0x12, 0x18, 0x0a, 0x07, 0x76, 0x65, 0x72, 0x73, 0x69,
	0x6f, 0x6e, 0x18, 0x01, 0x20, 0x01, 0x28, 0x03, 0x52, 0x07, 0x76, 0x65, 0x72, 0x73, 0x69, 0x6f,
	0x6e, 0x12, 0x20, 0x0a, 0x0b, 0x6c, 0x65, 0x61, 0x73, 0x65, 0x68, 0x6f, 0x6c, 0x64, 0x65, 0x72,
	0x18, 0x02, 0x20, 0x01, 0x28, 0x0d, 0x52, 0x0b, 0x6c, 0x65, 0x61, 0x73, 0x65, 0x68, 0x6f, 0x6c,
	0x64, 0x65, 0x72, 0x12, 0x10, 0x0a, 0x03, 0x6b, 0x65, 0x79, 0x18, 0x03, 0x20, 0x01, 0x28, 0x0c,
	0x52, 0x03, 0x6b, 0x65, 0x79, 0x22, 0x7d, 0x0a, 0x0c, 0x42, 0x61, 0x74, 0x63, 0x68, 0x52, 0x65,
	0x71, 0x75, 0x65, 0x73, 0x74, 0x12, 0x16, 0x0a, 0x06, 0x73, 0x65, 0x6e, 0x64, 0x65, 0x72, 0x18,
	0x01, 0x20, 0x01, 0x28, 0x0d, 0x52, 0x06, 0x73, 0x65, 0x6e, 0x64, 0x65, 0x72, 0x12, 0x20, 0x0a,
	0x0b, 0x6c, 0x65, 0x61, 0x73, 0x65, 0x68, 0x6f, 0x6c, 0x64, 0x65, 0x72, 0x18, 0x02, 0x20, 0x01,
	0x28, 0x0d, 0x52, 0x0b, 0x6c, 0x65, 0x61, 0x73, 0x65, 0x68, 0x6f, 0x6c, 0x64, 0x65, 0x72, 0x12,
	0x33, 0x0a, 0x0a, 0x6f, 0x70, 0x65, 0x72, 0x61, 0x74, 0x69, 0x6f, 0x6e, 0x73, 0x18, 0x03, 0x20,
	0x03, 0x28, 0x0b, 0x32, 0x13, 0x2e, 0x61, 0x73, 0x70, 0x65, 0x6e, 0x2e, 0x76, 0x31, 0x2e, 0x4f,
	0x70, 0x65, 0x72, 0x61, 0x74, 0x69, 0x6f, 0x6e, 0x52, 0x0a, 0x6f, 0x70, 0x65, 0x72, 0x61, 0x74,
	0x69, 0x6f, 0x6e, 0x73, 0x22, 0x89, 0x01, 0x0a, 0x09, 0x4f, 0x70, 0x65, 0x72, 0x61, 0x74, 0x69,
	0x6f, 0x6e, 0x12, 0x18, 0x0a, 0x07, 0x76, 0x61, 0x72, 0x69, 0x61, 0x6e, 0x74, 0x18, 0x01, 0x20,
	0x01, 0x28, 0x0d, 0x52, 0x07, 0x76, 0x61, 0x72, 0x69, 0x61, 0x6e, 0x74, 0x12, 0x20, 0x0a, 0x0b,
	0x6c, 0x65, 0x61, 0x73, 0x65, 0x68, 0x6f, 0x6c, 0x64, 0x65, 0x72, 0x18, 0x02, 0x20, 0x01, 0x28,
	0x0d, 0x52, 0x0b, 0x6c, 0x65, 0x61, 0x73, 0x65, 0x68, 0x6f, 0x6c, 0x64, 0x65, 0x72, 0x12, 0x18,
	0x0a, 0x07, 0x76, 0x65, 0x72, 0x73, 0x69, 0x6f, 0x6e, 0x18, 0x03, 0x20, 0x01, 0x28, 0x03, 0x52,
	0x07, 0x76, 0x65, 0x72, 0x73, 0x69, 0x6f, 0x6e, 0x12, 0x10, 0x0a, 0x03, 0x6b, 0x65, 0x79, 0x18,
	0x04, 0x20, 0x01, 0x28, 0x0c, 0x52, 0x03, 0x6b, 0x65, 0x79, 0x12, 0x14, 0x0a, 0x05, 0x76, 0x61,
	0x6c, 0x75, 0x65, 0x18, 0x05, 0x20, 0x01, 0x28, 0x0c, 0x52, 0x05, 0x76, 0x61, 0x6c, 0x75, 0x65,
	0x32, 0x4c, 0x0a, 0x0f, 0x46, 0x65, 0x65, 0x64, 0x62, 0x61, 0x63, 0x6b, 0x53, 0x65, 0x72, 0x76,
	0x69, 0x63, 0x65, 0x12, 0x39, 0x0a, 0x04, 0x45, 0x78, 0x65, 0x63, 0x12, 0x19, 0x2e, 0x61, 0x73,
	0x70, 0x65, 0x6e, 0x2e, 0x76, 0x31, 0x2e, 0x46, 0x65, 0x65, 0x64, 0x62, 0x61, 0x63, 0x6b, 0x4d,
	0x65, 0x73, 0x73, 0x61, 0x67, 0x65, 0x1a, 0x16, 0x2e, 0x67, 0x6f, 0x6f, 0x67, 0x6c, 0x65, 0x2e,
	0x70, 0x72, 0x6f, 0x74, 0x6f, 0x62, 0x75, 0x66, 0x2e, 0x45, 0x6d, 0x70, 0x74, 0x79, 0x32, 0x46,
	0x0a, 0x0c, 0x42, 0x61, 0x74, 0x63, 0x68, 0x53, 0x65, 0x72, 0x76, 0x69, 0x63, 0x65, 0x12, 0x36,
	0x0a, 0x04, 0x45, 0x78, 0x65, 0x63, 0x12, 0x16, 0x2e, 0x61, 0x73, 0x70, 0x65, 0x6e, 0x2e, 0x76,
	0x31, 0x2e, 0x42, 0x61, 0x74, 0x63, 0x68, 0x52, 0x65, 0x71, 0x75, 0x65, 0x73, 0x74, 0x1a, 0x16,
	0x2e, 0x61, 0x73, 0x70, 0x65, 0x6e, 0x2e, 0x76, 0x31, 0x2e, 0x42, 0x61, 0x74, 0x63, 0x68, 0x52,
	0x65, 0x71, 0x75, 0x65, 0x73, 0x74, 0x32, 0x46, 0x0a, 0x0c, 0x4c, 0x65, 0x61, 0x73, 0x65, 0x53,
	0x65, 0x72, 0x76, 0x69, 0x63, 0x65, 0x12, 0x36, 0x0a, 0x04, 0x45, 0x78, 0x65, 0x63, 0x12, 0x16,
	0x2e, 0x61, 0x73, 0x70, 0x65, 0x6e, 0x2e, 0x76, 0x31, 0x2e, 0x42, 0x61, 0x74, 0x63, 0x68, 0x52,
	0x65, 0x71, 0x75, 0x65, 0x73, 0x74, 0x1a, 0x16, 0x2e, 0x67, 0x6f, 0x6f, 0x67, 0x6c, 0x65, 0x2e,
	0x70, 0x72, 0x6f, 0x74, 0x6f, 0x62, 0x75, 0x66, 0x2e, 0x45, 0x6d, 0x70, 0x74, 0x79, 0x42, 0x8f,
	0x01, 0x0a, 0x0c, 0x63, 0x6f, 0x6d, 0x2e, 0x61, 0x73, 0x70, 0x65, 0x6e, 0x2e, 0x76, 0x31, 0x42,
	0x07, 0x4b, 0x76, 0x50, 0x72, 0x6f, 0x74, 0x6f, 0x50, 0x01, 0x5a, 0x35, 0x67, 0x69, 0x74, 0x68,
	0x75, 0x62, 0x2e, 0x63, 0x6f, 0x6d, 0x2f, 0x73, 0x79, 0x6e, 0x6e, 0x61, 0x78, 0x6c, 0x61, 0x62,
	0x73, 0x2f, 0x61, 0x73, 0x70, 0x65, 0x6e, 0x2f, 0x74, 0x72, 0x61, 0x6e, 0x73, 0x70, 0x6f, 0x72,
	0x74, 0x2f, 0x67, 0x72, 0x70, 0x63, 0x2f, 0x76, 0x31, 0x3b, 0x61, 0x73, 0x70, 0x65, 0x6e, 0x76,
	0x31, 0xa2, 0x02, 0x03, 0x41, 0x58, 0x58, 0xaa, 0x02, 0x08, 0x41, 0x73, 0x70, 0x65, 0x6e, 0x2e,
	0x56, 0x31, 0xca, 0x02, 0x08, 0x41, 0x73, 0x70, 0x65, 0x6e, 0x5c, 0x56, 0x31, 0xe2, 0x02, 0x14,
	0x41, 0x73, 0x70, 0x65, 0x6e, 0x5c, 0x56, 0x31, 0x5c, 0x47, 0x50, 0x42, 0x4d, 0x65, 0x74, 0x61,
	0x64, 0x61, 0x74, 0x61, 0xea, 0x02, 0x09, 0x41, 0x73, 0x70, 0x65, 0x6e, 0x3a, 0x3a, 0x56, 0x31,
	0x62, 0x06, 0x70, 0x72, 0x6f, 0x74, 0x6f, 0x33,
}

var (
	file_v1_kv_proto_rawDescOnce sync.Once
	file_v1_kv_proto_rawDescData = file_v1_kv_proto_rawDesc
)

func file_v1_kv_proto_rawDescGZIP() []byte {
	file_v1_kv_proto_rawDescOnce.Do(func() {
		file_v1_kv_proto_rawDescData = protoimpl.X.CompressGZIP(file_v1_kv_proto_rawDescData)
	})
	return file_v1_kv_proto_rawDescData
}

var file_v1_kv_proto_msgTypes = make([]protoimpl.MessageInfo, 4)
var file_v1_kv_proto_goTypes = []interface{}{
	(*FeedbackMessage)(nil), // 0: aspen.v1.FeedbackMessage
	(*OperationDigest)(nil), // 1: aspen.v1.OperationDigest
	(*BatchRequest)(nil),    // 2: aspen.v1.BatchRequest
	(*Operation)(nil),       // 3: aspen.v1.Operation
	(*emptypb.Empty)(nil),   // 4: google.protobuf.Empty
}
var file_v1_kv_proto_deschematicxs = []int32{
	1, // 0: aspen.v1.FeedbackMessage.digests:type_name -> aspen.v1.OperationDigest
	3, // 1: aspen.v1.BatchRequest.operations:type_name -> aspen.v1.Operation
	0, // 2: aspen.v1.FeedbackService.Exec:input_type -> aspen.v1.FeedbackMessage
	2, // 3: aspen.v1.BatchService.Exec:input_type -> aspen.v1.BatchRequest
	2, // 4: aspen.v1.LeaseService.Exec:input_type -> aspen.v1.BatchRequest
	4, // 5: aspen.v1.FeedbackService.Exec:output_type -> google.protobuf.Empty
	2, // 6: aspen.v1.BatchService.Exec:output_type -> aspen.v1.BatchRequest
	4, // 7: aspen.v1.LeaseService.Exec:output_type -> google.protobuf.Empty
	5, // [5:8] is the sub-list for method output_type
	2, // [2:5] is the sub-list for method input_type
	2, // [2:2] is the sub-list for extension type_name
	2, // [2:2] is the sub-list for extension extendee
	0, // [0:2] is the sub-list for field type_name
}

func init() { file_v1_kv_proto_init() }
func file_v1_kv_proto_init() {
	if File_v1_kv_proto != nil {
		return
	}
	if !protoimpl.UnsafeEnabled {
		file_v1_kv_proto_msgTypes[0].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*FeedbackMessage); i {
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
		file_v1_kv_proto_msgTypes[1].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*OperationDigest); i {
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
		file_v1_kv_proto_msgTypes[2].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*BatchRequest); i {
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
		file_v1_kv_proto_msgTypes[3].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*Operation); i {
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
			RawDescriptor: file_v1_kv_proto_rawDesc,
			NumEnums:      0,
			NumMessages:   4,
			NumExtensions: 0,
			NumServices:   3,
		},
		GoTypes:           file_v1_kv_proto_goTypes,
		DependencyIndexes: file_v1_kv_proto_deschematicxs,
		MessageInfos:      file_v1_kv_proto_msgTypes,
	}.Build()
	File_v1_kv_proto = out.File
	file_v1_kv_proto_rawDesc = nil
	file_v1_kv_proto_goTypes = nil
	file_v1_kv_proto_deschematicxs = nil
}
