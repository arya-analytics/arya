// Code generated by protoc-gen-go. DO NOT EDIT.
// versions:
// 	protoc-gen-go v1.32.0
// 	protoc        (unknown)
// source: v1/channel.proto

package apiv1

import (
	protoreflect "google.golang.org/protobuf/reflect/protoreflect"
	protoimpl "google.golang.org/protobuf/runtime/protoimpl"
	reflect "reflect"
	sync "sync"
)

const (
	// Verify that this generated code is sufficiently up-to-date.
	_ = protoimpl.EnforceVersion(20 - protoimpl.MinVersion)
	// Verify that runtime/protoimpl is sufficiently up-to-date.
	_ = protoimpl.EnforceVersion(protoimpl.MaxVersion - 20)
)

type Channel struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	Key         uint32  `protobuf:"varint,1,opt,name=key,proto3" json:"key,omitempty"`
	Name        string  `protobuf:"bytes,2,opt,name=name,proto3" json:"name,omitempty"`
	Leaseholder uint32  `protobuf:"varint,3,opt,name=leaseholder,proto3" json:"leaseholder,omitempty"`
	Rate        float32 `protobuf:"fixed32,4,opt,name=rate,proto3" json:"rate,omitempty"`
	DataType    string  `protobuf:"bytes,5,opt,name=data_type,json=dataType,proto3" json:"data_type,omitempty"`
	Density     int64   `protobuf:"varint,6,opt,name=density,proto3" json:"density,omitempty"`
	IsIndex     bool    `protobuf:"varint,7,opt,name=is_index,json=isIndex,proto3" json:"is_index,omitempty"`
	Index       uint32  `protobuf:"varint,8,opt,name=index,proto3" json:"index,omitempty"`
}

func (x *Channel) Reset() {
	*x = Channel{}
	if protoimpl.UnsafeEnabled {
		mi := &file_v1_channel_proto_msgTypes[0]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *Channel) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*Channel) ProtoMessage() {}

func (x *Channel) ProtoReflect() protoreflect.Message {
	mi := &file_v1_channel_proto_msgTypes[0]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use Channel.ProtoReflect.Descriptor instead.
func (*Channel) Descriptor() ([]byte, []int) {
	return file_v1_channel_proto_rawDescGZIP(), []int{0}
}

func (x *Channel) GetKey() uint32 {
	if x != nil {
		return x.Key
	}
	return 0
}

func (x *Channel) GetName() string {
	if x != nil {
		return x.Name
	}
	return ""
}

func (x *Channel) GetLeaseholder() uint32 {
	if x != nil {
		return x.Leaseholder
	}
	return 0
}

func (x *Channel) GetRate() float32 {
	if x != nil {
		return x.Rate
	}
	return 0
}

func (x *Channel) GetDataType() string {
	if x != nil {
		return x.DataType
	}
	return ""
}

func (x *Channel) GetDensity() int64 {
	if x != nil {
		return x.Density
	}
	return 0
}

func (x *Channel) GetIsIndex() bool {
	if x != nil {
		return x.IsIndex
	}
	return false
}

func (x *Channel) GetIndex() uint32 {
	if x != nil {
		return x.Index
	}
	return 0
}

type ChannelRetrieveRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	NodeKey uint32   `protobuf:"varint,1,opt,name=node_key,json=nodeKey,proto3" json:"node_key,omitempty"`
	Keys    []uint32 `protobuf:"varint,2,rep,packed,name=keys,proto3" json:"keys,omitempty"`
	Names   []string `protobuf:"bytes,3,rep,name=names,proto3" json:"names,omitempty"`
	Search  string   `protobuf:"bytes,4,opt,name=search,proto3" json:"search,omitempty"`
}

func (x *ChannelRetrieveRequest) Reset() {
	*x = ChannelRetrieveRequest{}
	if protoimpl.UnsafeEnabled {
		mi := &file_v1_channel_proto_msgTypes[1]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *ChannelRetrieveRequest) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*ChannelRetrieveRequest) ProtoMessage() {}

func (x *ChannelRetrieveRequest) ProtoReflect() protoreflect.Message {
	mi := &file_v1_channel_proto_msgTypes[1]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use ChannelRetrieveRequest.ProtoReflect.Descriptor instead.
func (*ChannelRetrieveRequest) Descriptor() ([]byte, []int) {
	return file_v1_channel_proto_rawDescGZIP(), []int{1}
}

func (x *ChannelRetrieveRequest) GetNodeKey() uint32 {
	if x != nil {
		return x.NodeKey
	}
	return 0
}

func (x *ChannelRetrieveRequest) GetKeys() []uint32 {
	if x != nil {
		return x.Keys
	}
	return nil
}

func (x *ChannelRetrieveRequest) GetNames() []string {
	if x != nil {
		return x.Names
	}
	return nil
}

func (x *ChannelRetrieveRequest) GetSearch() string {
	if x != nil {
		return x.Search
	}
	return ""
}

type ChannelRetrieveResponse struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	Channels []*Channel `protobuf:"bytes,1,rep,name=channels,proto3" json:"channels,omitempty"`
}

func (x *ChannelRetrieveResponse) Reset() {
	*x = ChannelRetrieveResponse{}
	if protoimpl.UnsafeEnabled {
		mi := &file_v1_channel_proto_msgTypes[2]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *ChannelRetrieveResponse) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*ChannelRetrieveResponse) ProtoMessage() {}

func (x *ChannelRetrieveResponse) ProtoReflect() protoreflect.Message {
	mi := &file_v1_channel_proto_msgTypes[2]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use ChannelRetrieveResponse.ProtoReflect.Descriptor instead.
func (*ChannelRetrieveResponse) Descriptor() ([]byte, []int) {
	return file_v1_channel_proto_rawDescGZIP(), []int{2}
}

func (x *ChannelRetrieveResponse) GetChannels() []*Channel {
	if x != nil {
		return x.Channels
	}
	return nil
}

type ChannelCreateRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	Channels []*Channel `protobuf:"bytes,1,rep,name=channels,proto3" json:"channels,omitempty"`
}

func (x *ChannelCreateRequest) Reset() {
	*x = ChannelCreateRequest{}
	if protoimpl.UnsafeEnabled {
		mi := &file_v1_channel_proto_msgTypes[3]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *ChannelCreateRequest) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*ChannelCreateRequest) ProtoMessage() {}

func (x *ChannelCreateRequest) ProtoReflect() protoreflect.Message {
	mi := &file_v1_channel_proto_msgTypes[3]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use ChannelCreateRequest.ProtoReflect.Descriptor instead.
func (*ChannelCreateRequest) Descriptor() ([]byte, []int) {
	return file_v1_channel_proto_rawDescGZIP(), []int{3}
}

func (x *ChannelCreateRequest) GetChannels() []*Channel {
	if x != nil {
		return x.Channels
	}
	return nil
}

type ChannelCreateResponse struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	Channels []*Channel `protobuf:"bytes,1,rep,name=channels,proto3" json:"channels,omitempty"`
}

func (x *ChannelCreateResponse) Reset() {
	*x = ChannelCreateResponse{}
	if protoimpl.UnsafeEnabled {
		mi := &file_v1_channel_proto_msgTypes[4]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *ChannelCreateResponse) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*ChannelCreateResponse) ProtoMessage() {}

func (x *ChannelCreateResponse) ProtoReflect() protoreflect.Message {
	mi := &file_v1_channel_proto_msgTypes[4]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use ChannelCreateResponse.ProtoReflect.Descriptor instead.
func (*ChannelCreateResponse) Descriptor() ([]byte, []int) {
	return file_v1_channel_proto_rawDescGZIP(), []int{4}
}

func (x *ChannelCreateResponse) GetChannels() []*Channel {
	if x != nil {
		return x.Channels
	}
	return nil
}

var File_v1_channel_proto protoreflect.FileDescriptor

var file_v1_channel_proto_rawDesc = []byte{
	0x0a, 0x10, 0x76, 0x31, 0x2f, 0x63, 0x68, 0x61, 0x6e, 0x6e, 0x65, 0x6c, 0x2e, 0x70, 0x72, 0x6f,
	0x74, 0x6f, 0x12, 0x06, 0x61, 0x70, 0x69, 0x2e, 0x76, 0x31, 0x22, 0xcd, 0x01, 0x0a, 0x07, 0x43,
	0x68, 0x61, 0x6e, 0x6e, 0x65, 0x6c, 0x12, 0x10, 0x0a, 0x03, 0x6b, 0x65, 0x79, 0x18, 0x01, 0x20,
	0x01, 0x28, 0x0d, 0x52, 0x03, 0x6b, 0x65, 0x79, 0x12, 0x12, 0x0a, 0x04, 0x6e, 0x61, 0x6d, 0x65,
	0x18, 0x02, 0x20, 0x01, 0x28, 0x09, 0x52, 0x04, 0x6e, 0x61, 0x6d, 0x65, 0x12, 0x20, 0x0a, 0x0b,
	0x6c, 0x65, 0x61, 0x73, 0x65, 0x68, 0x6f, 0x6c, 0x64, 0x65, 0x72, 0x18, 0x03, 0x20, 0x01, 0x28,
	0x0d, 0x52, 0x0b, 0x6c, 0x65, 0x61, 0x73, 0x65, 0x68, 0x6f, 0x6c, 0x64, 0x65, 0x72, 0x12, 0x12,
	0x0a, 0x04, 0x72, 0x61, 0x74, 0x65, 0x18, 0x04, 0x20, 0x01, 0x28, 0x02, 0x52, 0x04, 0x72, 0x61,
	0x74, 0x65, 0x12, 0x1b, 0x0a, 0x09, 0x64, 0x61, 0x74, 0x61, 0x5f, 0x74, 0x79, 0x70, 0x65, 0x18,
	0x05, 0x20, 0x01, 0x28, 0x09, 0x52, 0x08, 0x64, 0x61, 0x74, 0x61, 0x54, 0x79, 0x70, 0x65, 0x12,
	0x18, 0x0a, 0x07, 0x64, 0x65, 0x6e, 0x73, 0x69, 0x74, 0x79, 0x18, 0x06, 0x20, 0x01, 0x28, 0x03,
	0x52, 0x07, 0x64, 0x65, 0x6e, 0x73, 0x69, 0x74, 0x79, 0x12, 0x19, 0x0a, 0x08, 0x69, 0x73, 0x5f,
	0x69, 0x6e, 0x64, 0x65, 0x78, 0x18, 0x07, 0x20, 0x01, 0x28, 0x08, 0x52, 0x07, 0x69, 0x73, 0x49,
	0x6e, 0x64, 0x65, 0x78, 0x12, 0x14, 0x0a, 0x05, 0x69, 0x6e, 0x64, 0x65, 0x78, 0x18, 0x08, 0x20,
	0x01, 0x28, 0x0d, 0x52, 0x05, 0x69, 0x6e, 0x64, 0x65, 0x78, 0x22, 0x75, 0x0a, 0x16, 0x43, 0x68,
	0x61, 0x6e, 0x6e, 0x65, 0x6c, 0x52, 0x65, 0x74, 0x72, 0x69, 0x65, 0x76, 0x65, 0x52, 0x65, 0x71,
	0x75, 0x65, 0x73, 0x74, 0x12, 0x19, 0x0a, 0x08, 0x6e, 0x6f, 0x64, 0x65, 0x5f, 0x6b, 0x65, 0x79,
	0x18, 0x01, 0x20, 0x01, 0x28, 0x0d, 0x52, 0x07, 0x6e, 0x6f, 0x64, 0x65, 0x4b, 0x65, 0x79, 0x12,
	0x12, 0x0a, 0x04, 0x6b, 0x65, 0x79, 0x73, 0x18, 0x02, 0x20, 0x03, 0x28, 0x0d, 0x52, 0x04, 0x6b,
	0x65, 0x79, 0x73, 0x12, 0x14, 0x0a, 0x05, 0x6e, 0x61, 0x6d, 0x65, 0x73, 0x18, 0x03, 0x20, 0x03,
	0x28, 0x09, 0x52, 0x05, 0x6e, 0x61, 0x6d, 0x65, 0x73, 0x12, 0x16, 0x0a, 0x06, 0x73, 0x65, 0x61,
	0x72, 0x63, 0x68, 0x18, 0x04, 0x20, 0x01, 0x28, 0x09, 0x52, 0x06, 0x73, 0x65, 0x61, 0x72, 0x63,
	0x68, 0x22, 0x46, 0x0a, 0x17, 0x43, 0x68, 0x61, 0x6e, 0x6e, 0x65, 0x6c, 0x52, 0x65, 0x74, 0x72,
	0x69, 0x65, 0x76, 0x65, 0x52, 0x65, 0x73, 0x70, 0x6f, 0x6e, 0x73, 0x65, 0x12, 0x2b, 0x0a, 0x08,
	0x63, 0x68, 0x61, 0x6e, 0x6e, 0x65, 0x6c, 0x73, 0x18, 0x01, 0x20, 0x03, 0x28, 0x0b, 0x32, 0x0f,
	0x2e, 0x61, 0x70, 0x69, 0x2e, 0x76, 0x31, 0x2e, 0x43, 0x68, 0x61, 0x6e, 0x6e, 0x65, 0x6c, 0x52,
	0x08, 0x63, 0x68, 0x61, 0x6e, 0x6e, 0x65, 0x6c, 0x73, 0x22, 0x43, 0x0a, 0x14, 0x43, 0x68, 0x61,
	0x6e, 0x6e, 0x65, 0x6c, 0x43, 0x72, 0x65, 0x61, 0x74, 0x65, 0x52, 0x65, 0x71, 0x75, 0x65, 0x73,
	0x74, 0x12, 0x2b, 0x0a, 0x08, 0x63, 0x68, 0x61, 0x6e, 0x6e, 0x65, 0x6c, 0x73, 0x18, 0x01, 0x20,
	0x03, 0x28, 0x0b, 0x32, 0x0f, 0x2e, 0x61, 0x70, 0x69, 0x2e, 0x76, 0x31, 0x2e, 0x43, 0x68, 0x61,
	0x6e, 0x6e, 0x65, 0x6c, 0x52, 0x08, 0x63, 0x68, 0x61, 0x6e, 0x6e, 0x65, 0x6c, 0x73, 0x22, 0x44,
	0x0a, 0x15, 0x43, 0x68, 0x61, 0x6e, 0x6e, 0x65, 0x6c, 0x43, 0x72, 0x65, 0x61, 0x74, 0x65, 0x52,
	0x65, 0x73, 0x70, 0x6f, 0x6e, 0x73, 0x65, 0x12, 0x2b, 0x0a, 0x08, 0x63, 0x68, 0x61, 0x6e, 0x6e,
	0x65, 0x6c, 0x73, 0x18, 0x01, 0x20, 0x03, 0x28, 0x0b, 0x32, 0x0f, 0x2e, 0x61, 0x70, 0x69, 0x2e,
	0x76, 0x31, 0x2e, 0x43, 0x68, 0x61, 0x6e, 0x6e, 0x65, 0x6c, 0x52, 0x08, 0x63, 0x68, 0x61, 0x6e,
	0x6e, 0x65, 0x6c, 0x73, 0x32, 0x5d, 0x0a, 0x14, 0x43, 0x68, 0x61, 0x6e, 0x6e, 0x65, 0x6c, 0x43,
	0x72, 0x65, 0x61, 0x74, 0x65, 0x53, 0x65, 0x72, 0x76, 0x69, 0x63, 0x65, 0x12, 0x45, 0x0a, 0x04,
	0x45, 0x78, 0x65, 0x63, 0x12, 0x1c, 0x2e, 0x61, 0x70, 0x69, 0x2e, 0x76, 0x31, 0x2e, 0x43, 0x68,
	0x61, 0x6e, 0x6e, 0x65, 0x6c, 0x43, 0x72, 0x65, 0x61, 0x74, 0x65, 0x52, 0x65, 0x71, 0x75, 0x65,
	0x73, 0x74, 0x1a, 0x1d, 0x2e, 0x61, 0x70, 0x69, 0x2e, 0x76, 0x31, 0x2e, 0x43, 0x68, 0x61, 0x6e,
	0x6e, 0x65, 0x6c, 0x43, 0x72, 0x65, 0x61, 0x74, 0x65, 0x52, 0x65, 0x73, 0x70, 0x6f, 0x6e, 0x73,
	0x65, 0x22, 0x00, 0x32, 0x63, 0x0a, 0x16, 0x43, 0x68, 0x61, 0x6e, 0x6e, 0x65, 0x6c, 0x52, 0x65,
	0x74, 0x72, 0x69, 0x65, 0x76, 0x65, 0x53, 0x65, 0x72, 0x76, 0x69, 0x63, 0x65, 0x12, 0x49, 0x0a,
	0x04, 0x45, 0x78, 0x65, 0x63, 0x12, 0x1e, 0x2e, 0x61, 0x70, 0x69, 0x2e, 0x76, 0x31, 0x2e, 0x43,
	0x68, 0x61, 0x6e, 0x6e, 0x65, 0x6c, 0x52, 0x65, 0x74, 0x72, 0x69, 0x65, 0x76, 0x65, 0x52, 0x65,
	0x71, 0x75, 0x65, 0x73, 0x74, 0x1a, 0x1f, 0x2e, 0x61, 0x70, 0x69, 0x2e, 0x76, 0x31, 0x2e, 0x43,
	0x68, 0x61, 0x6e, 0x6e, 0x65, 0x6c, 0x52, 0x65, 0x74, 0x72, 0x69, 0x65, 0x76, 0x65, 0x52, 0x65,
	0x73, 0x70, 0x6f, 0x6e, 0x73, 0x65, 0x22, 0x00, 0x42, 0x87, 0x01, 0x0a, 0x0a, 0x63, 0x6f, 0x6d,
	0x2e, 0x61, 0x70, 0x69, 0x2e, 0x76, 0x31, 0x42, 0x0c, 0x43, 0x68, 0x61, 0x6e, 0x6e, 0x65, 0x6c,
	0x50, 0x72, 0x6f, 0x74, 0x6f, 0x50, 0x01, 0x5a, 0x32, 0x67, 0x69, 0x74, 0x68, 0x75, 0x62, 0x2e,
	0x63, 0x6f, 0x6d, 0x2f, 0x73, 0x79, 0x6e, 0x6e, 0x61, 0x78, 0x6c, 0x61, 0x62, 0x73, 0x2f, 0x73,
	0x79, 0x6e, 0x6e, 0x61, 0x78, 0x2f, 0x70, 0x6b, 0x67, 0x2f, 0x61, 0x70, 0x69, 0x2f, 0x67, 0x72,
	0x70, 0x63, 0x2f, 0x76, 0x31, 0x3b, 0x61, 0x70, 0x69, 0x76, 0x31, 0xa2, 0x02, 0x03, 0x41, 0x58,
	0x58, 0xaa, 0x02, 0x06, 0x41, 0x70, 0x69, 0x2e, 0x56, 0x31, 0xca, 0x02, 0x06, 0x41, 0x70, 0x69,
	0x5c, 0x56, 0x31, 0xe2, 0x02, 0x12, 0x41, 0x70, 0x69, 0x5c, 0x56, 0x31, 0x5c, 0x47, 0x50, 0x42,
	0x4d, 0x65, 0x74, 0x61, 0x64, 0x61, 0x74, 0x61, 0xea, 0x02, 0x07, 0x41, 0x70, 0x69, 0x3a, 0x3a,
	0x56, 0x31, 0x62, 0x06, 0x70, 0x72, 0x6f, 0x74, 0x6f, 0x33,
}

var (
	file_v1_channel_proto_rawDescOnce sync.Once
	file_v1_channel_proto_rawDescData = file_v1_channel_proto_rawDesc
)

func file_v1_channel_proto_rawDescGZIP() []byte {
	file_v1_channel_proto_rawDescOnce.Do(func() {
		file_v1_channel_proto_rawDescData = protoimpl.X.CompressGZIP(file_v1_channel_proto_rawDescData)
	})
	return file_v1_channel_proto_rawDescData
}

var file_v1_channel_proto_msgTypes = make([]protoimpl.MessageInfo, 5)
var file_v1_channel_proto_goTypes = []interface{}{
	(*Channel)(nil),                 // 0: api.v1.Channel
	(*ChannelRetrieveRequest)(nil),  // 1: api.v1.ChannelRetrieveRequest
	(*ChannelRetrieveResponse)(nil), // 2: api.v1.ChannelRetrieveResponse
	(*ChannelCreateRequest)(nil),    // 3: api.v1.ChannelCreateRequest
	(*ChannelCreateResponse)(nil),   // 4: api.v1.ChannelCreateResponse
}
var file_v1_channel_proto_depIdxs = []int32{
	0, // 0: api.v1.ChannelRetrieveResponse.channels:type_name -> api.v1.Channel
	0, // 1: api.v1.ChannelCreateRequest.channels:type_name -> api.v1.Channel
	0, // 2: api.v1.ChannelCreateResponse.channels:type_name -> api.v1.Channel
	3, // 3: api.v1.ChannelCreateService.Exec:input_type -> api.v1.ChannelCreateRequest
	1, // 4: api.v1.ChannelRetrieveService.Exec:input_type -> api.v1.ChannelRetrieveRequest
	4, // 5: api.v1.ChannelCreateService.Exec:output_type -> api.v1.ChannelCreateResponse
	2, // 6: api.v1.ChannelRetrieveService.Exec:output_type -> api.v1.ChannelRetrieveResponse
	5, // [5:7] is the sub-list for method output_type
	3, // [3:5] is the sub-list for method input_type
	3, // [3:3] is the sub-list for extension type_name
	3, // [3:3] is the sub-list for extension extendee
	0, // [0:3] is the sub-list for field type_name
}

func init() { file_v1_channel_proto_init() }
func file_v1_channel_proto_init() {
	if File_v1_channel_proto != nil {
		return
	}
	if !protoimpl.UnsafeEnabled {
		file_v1_channel_proto_msgTypes[0].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*Channel); i {
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
		file_v1_channel_proto_msgTypes[1].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*ChannelRetrieveRequest); i {
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
		file_v1_channel_proto_msgTypes[2].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*ChannelRetrieveResponse); i {
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
		file_v1_channel_proto_msgTypes[3].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*ChannelCreateRequest); i {
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
		file_v1_channel_proto_msgTypes[4].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*ChannelCreateResponse); i {
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
			RawDescriptor: file_v1_channel_proto_rawDesc,
			NumEnums:      0,
			NumMessages:   5,
			NumExtensions: 0,
			NumServices:   2,
		},
		GoTypes:           file_v1_channel_proto_goTypes,
		DependencyIndexes: file_v1_channel_proto_depIdxs,
		MessageInfos:      file_v1_channel_proto_msgTypes,
	}.Build()
	File_v1_channel_proto = out.File
	file_v1_channel_proto_rawDesc = nil
	file_v1_channel_proto_goTypes = nil
	file_v1_channel_proto_depIdxs = nil
}
