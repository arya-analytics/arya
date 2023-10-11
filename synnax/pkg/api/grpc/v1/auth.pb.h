// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

// Generated by the protocol buffer compiler.  DO NOT EDIT!
// source: v1/auth.proto

#ifndef GOOGLE_PROTOBUF_INCLUDED_v1_2fauth_2eproto_2epb_2eh
#define GOOGLE_PROTOBUF_INCLUDED_v1_2fauth_2eproto_2epb_2eh

#include <limits>
#include <string>
#include <type_traits>

#include "google/protobuf/port_def.inc"
#if PROTOBUF_VERSION < 4024000
#error "This file was generated by a newer version of protoc which is"
#error "incompatible with your Protocol Buffer headers. Please update"
#error "your headers."
#endif  // PROTOBUF_VERSION

#if 4024004 < PROTOBUF_MIN_PROTOC_VERSION
#error "This file was generated by an older version of protoc which is"
#error "incompatible with your Protocol Buffer headers. Please"
#error "regenerate this file with a newer version of protoc."
#endif  // PROTOBUF_MIN_PROTOC_VERSION
#include "google/protobuf/port_undef.inc"
#include "google/protobuf/io/coded_stream.h"
#include "google/protobuf/arena.h"
#include "google/protobuf/arenastring.h"
#include "google/protobuf/generated_message_tctable_decl.h"
#include "google/protobuf/generated_message_util.h"
#include "google/protobuf/metadata_lite.h"
#include "google/protobuf/generated_message_reflection.h"
#include "google/protobuf/message.h"
#include "google/protobuf/repeated_field.h"  // IWYU pragma: export
#include "google/protobuf/extension_set.h"  // IWYU pragma: export
#include "google/protobuf/unknown_field_set.h"
// @@protoc_insertion_point(includes)

// Must be included last.
#include "google/protobuf/port_def.inc"

#define PROTOBUF_INTERNAL_EXPORT_v1_2fauth_2eproto

namespace google {
namespace protobuf {
namespace internal {
class AnyMetadata;
}  // namespace internal
}  // namespace protobuf
}  // namespace google

// Internal implementation detail -- do not use these members.
struct TableStruct_v1_2fauth_2eproto {
  static const ::uint32_t offsets[];
};
extern const ::google::protobuf::internal::DescriptorTable
    descriptor_table_v1_2fauth_2eproto;
namespace api {
namespace v1 {
class LoginRequest;
struct LoginRequestDefaultTypeInternal;
extern LoginRequestDefaultTypeInternal _LoginRequest_default_instance_;
class LoginResponse;
struct LoginResponseDefaultTypeInternal;
extern LoginResponseDefaultTypeInternal _LoginResponse_default_instance_;
class User;
struct UserDefaultTypeInternal;
extern UserDefaultTypeInternal _User_default_instance_;
}  // namespace v1
}  // namespace api
namespace google {
namespace protobuf {
}  // namespace protobuf
}  // namespace google

namespace api {
namespace v1 {

// ===================================================================


// -------------------------------------------------------------------

class LoginRequest final :
    public ::google::protobuf::Message /* @@protoc_insertion_point(class_definition:api.v1.LoginRequest) */ {
 public:
  inline LoginRequest() : LoginRequest(nullptr) {}
  ~LoginRequest() override;
  template<typename = void>
  explicit PROTOBUF_CONSTEXPR LoginRequest(::google::protobuf::internal::ConstantInitialized);

  LoginRequest(const LoginRequest& from);
  LoginRequest(LoginRequest&& from) noexcept
    : LoginRequest() {
    *this = ::std::move(from);
  }

  inline LoginRequest& operator=(const LoginRequest& from) {
    CopyFrom(from);
    return *this;
  }
  inline LoginRequest& operator=(LoginRequest&& from) noexcept {
    if (this == &from) return *this;
    if (GetOwningArena() == from.GetOwningArena()
  #ifdef PROTOBUF_FORCE_COPY_IN_MOVE
        && GetOwningArena() != nullptr
  #endif  // !PROTOBUF_FORCE_COPY_IN_MOVE
    ) {
      InternalSwap(&from);
    } else {
      CopyFrom(from);
    }
    return *this;
  }

  inline const ::google::protobuf::UnknownFieldSet& unknown_fields() const {
    return _internal_metadata_.unknown_fields<::google::protobuf::UnknownFieldSet>(::google::protobuf::UnknownFieldSet::default_instance);
  }
  inline ::google::protobuf::UnknownFieldSet* mutable_unknown_fields() {
    return _internal_metadata_.mutable_unknown_fields<::google::protobuf::UnknownFieldSet>();
  }

  static const ::google::protobuf::Descriptor* descriptor() {
    return GetDescriptor();
  }
  static const ::google::protobuf::Descriptor* GetDescriptor() {
    return default_instance().GetMetadata().descriptor;
  }
  static const ::google::protobuf::Reflection* GetReflection() {
    return default_instance().GetMetadata().reflection;
  }
  static const LoginRequest& default_instance() {
    return *internal_default_instance();
  }
  static inline const LoginRequest* internal_default_instance() {
    return reinterpret_cast<const LoginRequest*>(
               &_LoginRequest_default_instance_);
  }
  static constexpr int kIndexInFileMessages =
    0;

  friend void swap(LoginRequest& a, LoginRequest& b) {
    a.Swap(&b);
  }
  inline void Swap(LoginRequest* other) {
    if (other == this) return;
  #ifdef PROTOBUF_FORCE_COPY_IN_SWAP
    if (GetOwningArena() != nullptr &&
        GetOwningArena() == other->GetOwningArena()) {
   #else  // PROTOBUF_FORCE_COPY_IN_SWAP
    if (GetOwningArena() == other->GetOwningArena()) {
  #endif  // !PROTOBUF_FORCE_COPY_IN_SWAP
      InternalSwap(other);
    } else {
      ::google::protobuf::internal::GenericSwap(this, other);
    }
  }
  void UnsafeArenaSwap(LoginRequest* other) {
    if (other == this) return;
    ABSL_DCHECK(GetOwningArena() == other->GetOwningArena());
    InternalSwap(other);
  }

  // implements Message ----------------------------------------------

  LoginRequest* New(::google::protobuf::Arena* arena = nullptr) const final {
    return CreateMaybeMessage<LoginRequest>(arena);
  }
  using ::google::protobuf::Message::CopyFrom;
  void CopyFrom(const LoginRequest& from);
  using ::google::protobuf::Message::MergeFrom;
  void MergeFrom( const LoginRequest& from) {
    LoginRequest::MergeImpl(*this, from);
  }
  private:
  static void MergeImpl(::google::protobuf::Message& to_msg, const ::google::protobuf::Message& from_msg);
  public:
  PROTOBUF_ATTRIBUTE_REINITIALIZES void Clear() final;
  bool IsInitialized() const final;

  ::size_t ByteSizeLong() const final;
  const char* _InternalParse(const char* ptr, ::google::protobuf::internal::ParseContext* ctx) final;
  ::uint8_t* _InternalSerialize(
      ::uint8_t* target, ::google::protobuf::io::EpsCopyOutputStream* stream) const final;
  int GetCachedSize() const final { return _impl_._cached_size_.Get(); }

  private:
  void SharedCtor(::google::protobuf::Arena* arena);
  void SharedDtor();
  void SetCachedSize(int size) const final;
  void InternalSwap(LoginRequest* other);

  private:
  friend class ::google::protobuf::internal::AnyMetadata;
  static ::absl::string_view FullMessageName() {
    return "api.v1.LoginRequest";
  }
  protected:
  explicit LoginRequest(::google::protobuf::Arena* arena);
  public:

  static const ClassData _class_data_;
  const ::google::protobuf::Message::ClassData*GetClassData() const final;

  ::google::protobuf::Metadata GetMetadata() const final;

  // nested types ----------------------------------------------------

  // accessors -------------------------------------------------------

  enum : int {
    kUsernameFieldNumber = 1,
    kPasswordFieldNumber = 2,
  };
  // string username = 1 [json_name = "username"];
  void clear_username() ;
  const std::string& username() const;
  template <typename Arg_ = const std::string&, typename... Args_>
  void set_username(Arg_&& arg, Args_... args);
  std::string* mutable_username();
  PROTOBUF_NODISCARD std::string* release_username();
  void set_allocated_username(std::string* ptr);

  private:
  const std::string& _internal_username() const;
  inline PROTOBUF_ALWAYS_INLINE void _internal_set_username(
      const std::string& value);
  std::string* _internal_mutable_username();

  public:
  // string password = 2 [json_name = "password"];
  void clear_password() ;
  const std::string& password() const;
  template <typename Arg_ = const std::string&, typename... Args_>
  void set_password(Arg_&& arg, Args_... args);
  std::string* mutable_password();
  PROTOBUF_NODISCARD std::string* release_password();
  void set_allocated_password(std::string* ptr);

  private:
  const std::string& _internal_password() const;
  inline PROTOBUF_ALWAYS_INLINE void _internal_set_password(
      const std::string& value);
  std::string* _internal_mutable_password();

  public:
  // @@protoc_insertion_point(class_scope:api.v1.LoginRequest)
 private:
  class _Internal;

  friend class ::google::protobuf::internal::TcParser;
  static const ::google::protobuf::internal::TcParseTable<1, 2, 0, 44, 2> _table_;
  template <typename T> friend class ::google::protobuf::Arena::InternalHelper;
  typedef void InternalArenaConstructable_;
  typedef void DestructorSkippable_;
  struct Impl_ {
    ::google::protobuf::internal::ArenaStringPtr username_;
    ::google::protobuf::internal::ArenaStringPtr password_;
    mutable ::google::protobuf::internal::CachedSize _cached_size_;
    PROTOBUF_TSAN_DECLARE_MEMBER
  };
  union { Impl_ _impl_; };
  friend struct ::TableStruct_v1_2fauth_2eproto;
};// -------------------------------------------------------------------

class LoginResponse final :
    public ::google::protobuf::Message /* @@protoc_insertion_point(class_definition:api.v1.LoginResponse) */ {
 public:
  inline LoginResponse() : LoginResponse(nullptr) {}
  ~LoginResponse() override;
  template<typename = void>
  explicit PROTOBUF_CONSTEXPR LoginResponse(::google::protobuf::internal::ConstantInitialized);

  LoginResponse(const LoginResponse& from);
  LoginResponse(LoginResponse&& from) noexcept
    : LoginResponse() {
    *this = ::std::move(from);
  }

  inline LoginResponse& operator=(const LoginResponse& from) {
    CopyFrom(from);
    return *this;
  }
  inline LoginResponse& operator=(LoginResponse&& from) noexcept {
    if (this == &from) return *this;
    if (GetOwningArena() == from.GetOwningArena()
  #ifdef PROTOBUF_FORCE_COPY_IN_MOVE
        && GetOwningArena() != nullptr
  #endif  // !PROTOBUF_FORCE_COPY_IN_MOVE
    ) {
      InternalSwap(&from);
    } else {
      CopyFrom(from);
    }
    return *this;
  }

  inline const ::google::protobuf::UnknownFieldSet& unknown_fields() const {
    return _internal_metadata_.unknown_fields<::google::protobuf::UnknownFieldSet>(::google::protobuf::UnknownFieldSet::default_instance);
  }
  inline ::google::protobuf::UnknownFieldSet* mutable_unknown_fields() {
    return _internal_metadata_.mutable_unknown_fields<::google::protobuf::UnknownFieldSet>();
  }

  static const ::google::protobuf::Descriptor* descriptor() {
    return GetDescriptor();
  }
  static const ::google::protobuf::Descriptor* GetDescriptor() {
    return default_instance().GetMetadata().descriptor;
  }
  static const ::google::protobuf::Reflection* GetReflection() {
    return default_instance().GetMetadata().reflection;
  }
  static const LoginResponse& default_instance() {
    return *internal_default_instance();
  }
  static inline const LoginResponse* internal_default_instance() {
    return reinterpret_cast<const LoginResponse*>(
               &_LoginResponse_default_instance_);
  }
  static constexpr int kIndexInFileMessages =
    1;

  friend void swap(LoginResponse& a, LoginResponse& b) {
    a.Swap(&b);
  }
  inline void Swap(LoginResponse* other) {
    if (other == this) return;
  #ifdef PROTOBUF_FORCE_COPY_IN_SWAP
    if (GetOwningArena() != nullptr &&
        GetOwningArena() == other->GetOwningArena()) {
   #else  // PROTOBUF_FORCE_COPY_IN_SWAP
    if (GetOwningArena() == other->GetOwningArena()) {
  #endif  // !PROTOBUF_FORCE_COPY_IN_SWAP
      InternalSwap(other);
    } else {
      ::google::protobuf::internal::GenericSwap(this, other);
    }
  }
  void UnsafeArenaSwap(LoginResponse* other) {
    if (other == this) return;
    ABSL_DCHECK(GetOwningArena() == other->GetOwningArena());
    InternalSwap(other);
  }

  // implements Message ----------------------------------------------

  LoginResponse* New(::google::protobuf::Arena* arena = nullptr) const final {
    return CreateMaybeMessage<LoginResponse>(arena);
  }
  using ::google::protobuf::Message::CopyFrom;
  void CopyFrom(const LoginResponse& from);
  using ::google::protobuf::Message::MergeFrom;
  void MergeFrom( const LoginResponse& from) {
    LoginResponse::MergeImpl(*this, from);
  }
  private:
  static void MergeImpl(::google::protobuf::Message& to_msg, const ::google::protobuf::Message& from_msg);
  public:
  PROTOBUF_ATTRIBUTE_REINITIALIZES void Clear() final;
  bool IsInitialized() const final;

  ::size_t ByteSizeLong() const final;
  const char* _InternalParse(const char* ptr, ::google::protobuf::internal::ParseContext* ctx) final;
  ::uint8_t* _InternalSerialize(
      ::uint8_t* target, ::google::protobuf::io::EpsCopyOutputStream* stream) const final;
  int GetCachedSize() const final { return _impl_._cached_size_.Get(); }

  private:
  void SharedCtor(::google::protobuf::Arena* arena);
  void SharedDtor();
  void SetCachedSize(int size) const final;
  void InternalSwap(LoginResponse* other);

  private:
  friend class ::google::protobuf::internal::AnyMetadata;
  static ::absl::string_view FullMessageName() {
    return "api.v1.LoginResponse";
  }
  protected:
  explicit LoginResponse(::google::protobuf::Arena* arena);
  public:

  static const ClassData _class_data_;
  const ::google::protobuf::Message::ClassData*GetClassData() const final;

  ::google::protobuf::Metadata GetMetadata() const final;

  // nested types ----------------------------------------------------

  // accessors -------------------------------------------------------

  enum : int {
    kTokenFieldNumber = 1,
    kUserFieldNumber = 2,
  };
  // string token = 1 [json_name = "token"];
  void clear_token() ;
  const std::string& token() const;
  template <typename Arg_ = const std::string&, typename... Args_>
  void set_token(Arg_&& arg, Args_... args);
  std::string* mutable_token();
  PROTOBUF_NODISCARD std::string* release_token();
  void set_allocated_token(std::string* ptr);

  private:
  const std::string& _internal_token() const;
  inline PROTOBUF_ALWAYS_INLINE void _internal_set_token(
      const std::string& value);
  std::string* _internal_mutable_token();

  public:
  // .api.v1.User user = 2 [json_name = "user"];
  bool has_user() const;
  void clear_user() ;
  const ::api::v1::User& user() const;
  PROTOBUF_NODISCARD ::api::v1::User* release_user();
  ::api::v1::User* mutable_user();
  void set_allocated_user(::api::v1::User* value);
  void unsafe_arena_set_allocated_user(::api::v1::User* value);
  ::api::v1::User* unsafe_arena_release_user();

  private:
  const ::api::v1::User& _internal_user() const;
  ::api::v1::User* _internal_mutable_user();

  public:
  // @@protoc_insertion_point(class_scope:api.v1.LoginResponse)
 private:
  class _Internal;

  friend class ::google::protobuf::internal::TcParser;
  static const ::google::protobuf::internal::TcParseTable<1, 2, 1, 34, 2> _table_;
  template <typename T> friend class ::google::protobuf::Arena::InternalHelper;
  typedef void InternalArenaConstructable_;
  typedef void DestructorSkippable_;
  struct Impl_ {
    ::google::protobuf::internal::HasBits<1> _has_bits_;
    mutable ::google::protobuf::internal::CachedSize _cached_size_;
    ::google::protobuf::internal::ArenaStringPtr token_;
    ::api::v1::User* user_;
    PROTOBUF_TSAN_DECLARE_MEMBER
  };
  union { Impl_ _impl_; };
  friend struct ::TableStruct_v1_2fauth_2eproto;
};// -------------------------------------------------------------------

class User final :
    public ::google::protobuf::Message /* @@protoc_insertion_point(class_definition:api.v1.User) */ {
 public:
  inline User() : User(nullptr) {}
  ~User() override;
  template<typename = void>
  explicit PROTOBUF_CONSTEXPR User(::google::protobuf::internal::ConstantInitialized);

  User(const User& from);
  User(User&& from) noexcept
    : User() {
    *this = ::std::move(from);
  }

  inline User& operator=(const User& from) {
    CopyFrom(from);
    return *this;
  }
  inline User& operator=(User&& from) noexcept {
    if (this == &from) return *this;
    if (GetOwningArena() == from.GetOwningArena()
  #ifdef PROTOBUF_FORCE_COPY_IN_MOVE
        && GetOwningArena() != nullptr
  #endif  // !PROTOBUF_FORCE_COPY_IN_MOVE
    ) {
      InternalSwap(&from);
    } else {
      CopyFrom(from);
    }
    return *this;
  }

  inline const ::google::protobuf::UnknownFieldSet& unknown_fields() const {
    return _internal_metadata_.unknown_fields<::google::protobuf::UnknownFieldSet>(::google::protobuf::UnknownFieldSet::default_instance);
  }
  inline ::google::protobuf::UnknownFieldSet* mutable_unknown_fields() {
    return _internal_metadata_.mutable_unknown_fields<::google::protobuf::UnknownFieldSet>();
  }

  static const ::google::protobuf::Descriptor* descriptor() {
    return GetDescriptor();
  }
  static const ::google::protobuf::Descriptor* GetDescriptor() {
    return default_instance().GetMetadata().descriptor;
  }
  static const ::google::protobuf::Reflection* GetReflection() {
    return default_instance().GetMetadata().reflection;
  }
  static const User& default_instance() {
    return *internal_default_instance();
  }
  static inline const User* internal_default_instance() {
    return reinterpret_cast<const User*>(
               &_User_default_instance_);
  }
  static constexpr int kIndexInFileMessages =
    2;

  friend void swap(User& a, User& b) {
    a.Swap(&b);
  }
  inline void Swap(User* other) {
    if (other == this) return;
  #ifdef PROTOBUF_FORCE_COPY_IN_SWAP
    if (GetOwningArena() != nullptr &&
        GetOwningArena() == other->GetOwningArena()) {
   #else  // PROTOBUF_FORCE_COPY_IN_SWAP
    if (GetOwningArena() == other->GetOwningArena()) {
  #endif  // !PROTOBUF_FORCE_COPY_IN_SWAP
      InternalSwap(other);
    } else {
      ::google::protobuf::internal::GenericSwap(this, other);
    }
  }
  void UnsafeArenaSwap(User* other) {
    if (other == this) return;
    ABSL_DCHECK(GetOwningArena() == other->GetOwningArena());
    InternalSwap(other);
  }

  // implements Message ----------------------------------------------

  User* New(::google::protobuf::Arena* arena = nullptr) const final {
    return CreateMaybeMessage<User>(arena);
  }
  using ::google::protobuf::Message::CopyFrom;
  void CopyFrom(const User& from);
  using ::google::protobuf::Message::MergeFrom;
  void MergeFrom( const User& from) {
    User::MergeImpl(*this, from);
  }
  private:
  static void MergeImpl(::google::protobuf::Message& to_msg, const ::google::protobuf::Message& from_msg);
  public:
  PROTOBUF_ATTRIBUTE_REINITIALIZES void Clear() final;
  bool IsInitialized() const final;

  ::size_t ByteSizeLong() const final;
  const char* _InternalParse(const char* ptr, ::google::protobuf::internal::ParseContext* ctx) final;
  ::uint8_t* _InternalSerialize(
      ::uint8_t* target, ::google::protobuf::io::EpsCopyOutputStream* stream) const final;
  int GetCachedSize() const final { return _impl_._cached_size_.Get(); }

  private:
  void SharedCtor(::google::protobuf::Arena* arena);
  void SharedDtor();
  void SetCachedSize(int size) const final;
  void InternalSwap(User* other);

  private:
  friend class ::google::protobuf::internal::AnyMetadata;
  static ::absl::string_view FullMessageName() {
    return "api.v1.User";
  }
  protected:
  explicit User(::google::protobuf::Arena* arena);
  public:

  static const ClassData _class_data_;
  const ::google::protobuf::Message::ClassData*GetClassData() const final;

  ::google::protobuf::Metadata GetMetadata() const final;

  // nested types ----------------------------------------------------

  // accessors -------------------------------------------------------

  enum : int {
    kKeyFieldNumber = 1,
    kUsernameFieldNumber = 2,
  };
  // string key = 1 [json_name = "key"];
  void clear_key() ;
  const std::string& key() const;
  template <typename Arg_ = const std::string&, typename... Args_>
  void set_key(Arg_&& arg, Args_... args);
  std::string* mutable_key();
  PROTOBUF_NODISCARD std::string* release_key();
  void set_allocated_key(std::string* ptr);

  private:
  const std::string& _internal_key() const;
  inline PROTOBUF_ALWAYS_INLINE void _internal_set_key(
      const std::string& value);
  std::string* _internal_mutable_key();

  public:
  // string username = 2 [json_name = "username"];
  void clear_username() ;
  const std::string& username() const;
  template <typename Arg_ = const std::string&, typename... Args_>
  void set_username(Arg_&& arg, Args_... args);
  std::string* mutable_username();
  PROTOBUF_NODISCARD std::string* release_username();
  void set_allocated_username(std::string* ptr);

  private:
  const std::string& _internal_username() const;
  inline PROTOBUF_ALWAYS_INLINE void _internal_set_username(
      const std::string& value);
  std::string* _internal_mutable_username();

  public:
  // @@protoc_insertion_point(class_scope:api.v1.User)
 private:
  class _Internal;

  friend class ::google::protobuf::internal::TcParser;
  static const ::google::protobuf::internal::TcParseTable<1, 2, 0, 31, 2> _table_;
  template <typename T> friend class ::google::protobuf::Arena::InternalHelper;
  typedef void InternalArenaConstructable_;
  typedef void DestructorSkippable_;
  struct Impl_ {
    ::google::protobuf::internal::ArenaStringPtr key_;
    ::google::protobuf::internal::ArenaStringPtr username_;
    mutable ::google::protobuf::internal::CachedSize _cached_size_;
    PROTOBUF_TSAN_DECLARE_MEMBER
  };
  union { Impl_ _impl_; };
  friend struct ::TableStruct_v1_2fauth_2eproto;
};

// ===================================================================




// ===================================================================


#ifdef __GNUC__
#pragma GCC diagnostic push
#pragma GCC diagnostic ignored "-Wstrict-aliasing"
#endif  // __GNUC__
// -------------------------------------------------------------------

// LoginRequest

// string username = 1 [json_name = "username"];
inline void LoginRequest::clear_username() {
  _impl_.username_.ClearToEmpty();
}
inline const std::string& LoginRequest::username() const {
  // @@protoc_insertion_point(field_get:api.v1.LoginRequest.username)
  return _internal_username();
}
template <typename Arg_, typename... Args_>
inline PROTOBUF_ALWAYS_INLINE void LoginRequest::set_username(Arg_&& arg,
                                                     Args_... args) {
  PROTOBUF_TSAN_WRITE(&_impl_._tsan_detect_race);
  ;
  _impl_.username_.Set(static_cast<Arg_&&>(arg), args..., GetArenaForAllocation());
  // @@protoc_insertion_point(field_set:api.v1.LoginRequest.username)
}
inline std::string* LoginRequest::mutable_username() {
  std::string* _s = _internal_mutable_username();
  // @@protoc_insertion_point(field_mutable:api.v1.LoginRequest.username)
  return _s;
}
inline const std::string& LoginRequest::_internal_username() const {
  PROTOBUF_TSAN_READ(&_impl_._tsan_detect_race);
  return _impl_.username_.Get();
}
inline void LoginRequest::_internal_set_username(const std::string& value) {
  PROTOBUF_TSAN_WRITE(&_impl_._tsan_detect_race);
  ;
  _impl_.username_.Set(value, GetArenaForAllocation());
}
inline std::string* LoginRequest::_internal_mutable_username() {
  PROTOBUF_TSAN_WRITE(&_impl_._tsan_detect_race);
  ;
  return _impl_.username_.Mutable( GetArenaForAllocation());
}
inline std::string* LoginRequest::release_username() {
  PROTOBUF_TSAN_WRITE(&_impl_._tsan_detect_race);
  // @@protoc_insertion_point(field_release:api.v1.LoginRequest.username)
  return _impl_.username_.Release();
}
inline void LoginRequest::set_allocated_username(std::string* value) {
  PROTOBUF_TSAN_WRITE(&_impl_._tsan_detect_race);
  _impl_.username_.SetAllocated(value, GetArenaForAllocation());
  #ifdef PROTOBUF_FORCE_COPY_DEFAULT_STRING
        if (_impl_.username_.IsDefault()) {
          _impl_.username_.Set("", GetArenaForAllocation());
        }
  #endif  // PROTOBUF_FORCE_COPY_DEFAULT_STRING
  // @@protoc_insertion_point(field_set_allocated:api.v1.LoginRequest.username)
}

// string password = 2 [json_name = "password"];
inline void LoginRequest::clear_password() {
  _impl_.password_.ClearToEmpty();
}
inline const std::string& LoginRequest::password() const {
  // @@protoc_insertion_point(field_get:api.v1.LoginRequest.password)
  return _internal_password();
}
template <typename Arg_, typename... Args_>
inline PROTOBUF_ALWAYS_INLINE void LoginRequest::set_password(Arg_&& arg,
                                                     Args_... args) {
  PROTOBUF_TSAN_WRITE(&_impl_._tsan_detect_race);
  ;
  _impl_.password_.Set(static_cast<Arg_&&>(arg), args..., GetArenaForAllocation());
  // @@protoc_insertion_point(field_set:api.v1.LoginRequest.password)
}
inline std::string* LoginRequest::mutable_password() {
  std::string* _s = _internal_mutable_password();
  // @@protoc_insertion_point(field_mutable:api.v1.LoginRequest.password)
  return _s;
}
inline const std::string& LoginRequest::_internal_password() const {
  PROTOBUF_TSAN_READ(&_impl_._tsan_detect_race);
  return _impl_.password_.Get();
}
inline void LoginRequest::_internal_set_password(const std::string& value) {
  PROTOBUF_TSAN_WRITE(&_impl_._tsan_detect_race);
  ;
  _impl_.password_.Set(value, GetArenaForAllocation());
}
inline std::string* LoginRequest::_internal_mutable_password() {
  PROTOBUF_TSAN_WRITE(&_impl_._tsan_detect_race);
  ;
  return _impl_.password_.Mutable( GetArenaForAllocation());
}
inline std::string* LoginRequest::release_password() {
  PROTOBUF_TSAN_WRITE(&_impl_._tsan_detect_race);
  // @@protoc_insertion_point(field_release:api.v1.LoginRequest.password)
  return _impl_.password_.Release();
}
inline void LoginRequest::set_allocated_password(std::string* value) {
  PROTOBUF_TSAN_WRITE(&_impl_._tsan_detect_race);
  _impl_.password_.SetAllocated(value, GetArenaForAllocation());
  #ifdef PROTOBUF_FORCE_COPY_DEFAULT_STRING
        if (_impl_.password_.IsDefault()) {
          _impl_.password_.Set("", GetArenaForAllocation());
        }
  #endif  // PROTOBUF_FORCE_COPY_DEFAULT_STRING
  // @@protoc_insertion_point(field_set_allocated:api.v1.LoginRequest.password)
}

// -------------------------------------------------------------------

// LoginResponse

// string token = 1 [json_name = "token"];
inline void LoginResponse::clear_token() {
  _impl_.token_.ClearToEmpty();
}
inline const std::string& LoginResponse::token() const {
  // @@protoc_insertion_point(field_get:api.v1.LoginResponse.token)
  return _internal_token();
}
template <typename Arg_, typename... Args_>
inline PROTOBUF_ALWAYS_INLINE void LoginResponse::set_token(Arg_&& arg,
                                                     Args_... args) {
  PROTOBUF_TSAN_WRITE(&_impl_._tsan_detect_race);
  ;
  _impl_.token_.Set(static_cast<Arg_&&>(arg), args..., GetArenaForAllocation());
  // @@protoc_insertion_point(field_set:api.v1.LoginResponse.token)
}
inline std::string* LoginResponse::mutable_token() {
  std::string* _s = _internal_mutable_token();
  // @@protoc_insertion_point(field_mutable:api.v1.LoginResponse.token)
  return _s;
}
inline const std::string& LoginResponse::_internal_token() const {
  PROTOBUF_TSAN_READ(&_impl_._tsan_detect_race);
  return _impl_.token_.Get();
}
inline void LoginResponse::_internal_set_token(const std::string& value) {
  PROTOBUF_TSAN_WRITE(&_impl_._tsan_detect_race);
  ;
  _impl_.token_.Set(value, GetArenaForAllocation());
}
inline std::string* LoginResponse::_internal_mutable_token() {
  PROTOBUF_TSAN_WRITE(&_impl_._tsan_detect_race);
  ;
  return _impl_.token_.Mutable( GetArenaForAllocation());
}
inline std::string* LoginResponse::release_token() {
  PROTOBUF_TSAN_WRITE(&_impl_._tsan_detect_race);
  // @@protoc_insertion_point(field_release:api.v1.LoginResponse.token)
  return _impl_.token_.Release();
}
inline void LoginResponse::set_allocated_token(std::string* value) {
  PROTOBUF_TSAN_WRITE(&_impl_._tsan_detect_race);
  _impl_.token_.SetAllocated(value, GetArenaForAllocation());
  #ifdef PROTOBUF_FORCE_COPY_DEFAULT_STRING
        if (_impl_.token_.IsDefault()) {
          _impl_.token_.Set("", GetArenaForAllocation());
        }
  #endif  // PROTOBUF_FORCE_COPY_DEFAULT_STRING
  // @@protoc_insertion_point(field_set_allocated:api.v1.LoginResponse.token)
}

// .api.v1.User user = 2 [json_name = "user"];
inline bool LoginResponse::has_user() const {
  bool value = (_impl_._has_bits_[0] & 0x00000001u) != 0;
  PROTOBUF_ASSUME(!value || _impl_.user_ != nullptr);
  return value;
}
inline void LoginResponse::clear_user() {
  if (_impl_.user_ != nullptr) _impl_.user_->Clear();
  _impl_._has_bits_[0] &= ~0x00000001u;
}
inline const ::api::v1::User& LoginResponse::_internal_user() const {
  PROTOBUF_TSAN_READ(&_impl_._tsan_detect_race);
  const ::api::v1::User* p = _impl_.user_;
  return p != nullptr ? *p : reinterpret_cast<const ::api::v1::User&>(::api::v1::_User_default_instance_);
}
inline const ::api::v1::User& LoginResponse::user() const {
  // @@protoc_insertion_point(field_get:api.v1.LoginResponse.user)
  return _internal_user();
}
inline void LoginResponse::unsafe_arena_set_allocated_user(::api::v1::User* value) {
  PROTOBUF_TSAN_WRITE(&_impl_._tsan_detect_race);
  if (GetArenaForAllocation() == nullptr) {
    delete reinterpret_cast<::google::protobuf::MessageLite*>(_impl_.user_);
  }
  _impl_.user_ = reinterpret_cast<::api::v1::User*>(value);
  if (value != nullptr) {
    _impl_._has_bits_[0] |= 0x00000001u;
  } else {
    _impl_._has_bits_[0] &= ~0x00000001u;
  }
  // @@protoc_insertion_point(field_unsafe_arena_set_allocated:api.v1.LoginResponse.user)
}
inline ::api::v1::User* LoginResponse::release_user() {
  PROTOBUF_TSAN_WRITE(&_impl_._tsan_detect_race);

  _impl_._has_bits_[0] &= ~0x00000001u;
  ::api::v1::User* released = _impl_.user_;
  _impl_.user_ = nullptr;
#ifdef PROTOBUF_FORCE_COPY_IN_RELEASE
  auto* old = reinterpret_cast<::google::protobuf::MessageLite*>(released);
  released = ::google::protobuf::internal::DuplicateIfNonNull(released);
  if (GetArenaForAllocation() == nullptr) {
    delete old;
  }
#else   // PROTOBUF_FORCE_COPY_IN_RELEASE
  if (GetArenaForAllocation() != nullptr) {
    released = ::google::protobuf::internal::DuplicateIfNonNull(released);
  }
#endif  // !PROTOBUF_FORCE_COPY_IN_RELEASE
  return released;
}
inline ::api::v1::User* LoginResponse::unsafe_arena_release_user() {
  PROTOBUF_TSAN_WRITE(&_impl_._tsan_detect_race);
  // @@protoc_insertion_point(field_release:api.v1.LoginResponse.user)

  _impl_._has_bits_[0] &= ~0x00000001u;
  ::api::v1::User* temp = _impl_.user_;
  _impl_.user_ = nullptr;
  return temp;
}
inline ::api::v1::User* LoginResponse::_internal_mutable_user() {
  PROTOBUF_TSAN_WRITE(&_impl_._tsan_detect_race);
  _impl_._has_bits_[0] |= 0x00000001u;
  if (_impl_.user_ == nullptr) {
    auto* p = CreateMaybeMessage<::api::v1::User>(GetArenaForAllocation());
    _impl_.user_ = reinterpret_cast<::api::v1::User*>(p);
  }
  return _impl_.user_;
}
inline ::api::v1::User* LoginResponse::mutable_user() {
  ::api::v1::User* _msg = _internal_mutable_user();
  // @@protoc_insertion_point(field_mutable:api.v1.LoginResponse.user)
  return _msg;
}
inline void LoginResponse::set_allocated_user(::api::v1::User* value) {
  ::google::protobuf::Arena* message_arena = GetArenaForAllocation();
  PROTOBUF_TSAN_WRITE(&_impl_._tsan_detect_race);
  if (message_arena == nullptr) {
    delete reinterpret_cast<::api::v1::User*>(_impl_.user_);
  }

  if (value != nullptr) {
    ::google::protobuf::Arena* submessage_arena =
        ::google::protobuf::Arena::InternalGetOwningArena(reinterpret_cast<::api::v1::User*>(value));
    if (message_arena != submessage_arena) {
      value = ::google::protobuf::internal::GetOwnedMessage(message_arena, value, submessage_arena);
    }
    _impl_._has_bits_[0] |= 0x00000001u;
  } else {
    _impl_._has_bits_[0] &= ~0x00000001u;
  }

  _impl_.user_ = reinterpret_cast<::api::v1::User*>(value);
  // @@protoc_insertion_point(field_set_allocated:api.v1.LoginResponse.user)
}

// -------------------------------------------------------------------

// User

// string key = 1 [json_name = "key"];
inline void User::clear_key() {
  _impl_.key_.ClearToEmpty();
}
inline const std::string& User::key() const {
  // @@protoc_insertion_point(field_get:api.v1.User.key)
  return _internal_key();
}
template <typename Arg_, typename... Args_>
inline PROTOBUF_ALWAYS_INLINE void User::set_key(Arg_&& arg,
                                                     Args_... args) {
  PROTOBUF_TSAN_WRITE(&_impl_._tsan_detect_race);
  ;
  _impl_.key_.Set(static_cast<Arg_&&>(arg), args..., GetArenaForAllocation());
  // @@protoc_insertion_point(field_set:api.v1.User.key)
}
inline std::string* User::mutable_key() {
  std::string* _s = _internal_mutable_key();
  // @@protoc_insertion_point(field_mutable:api.v1.User.key)
  return _s;
}
inline const std::string& User::_internal_key() const {
  PROTOBUF_TSAN_READ(&_impl_._tsan_detect_race);
  return _impl_.key_.Get();
}
inline void User::_internal_set_key(const std::string& value) {
  PROTOBUF_TSAN_WRITE(&_impl_._tsan_detect_race);
  ;
  _impl_.key_.Set(value, GetArenaForAllocation());
}
inline std::string* User::_internal_mutable_key() {
  PROTOBUF_TSAN_WRITE(&_impl_._tsan_detect_race);
  ;
  return _impl_.key_.Mutable( GetArenaForAllocation());
}
inline std::string* User::release_key() {
  PROTOBUF_TSAN_WRITE(&_impl_._tsan_detect_race);
  // @@protoc_insertion_point(field_release:api.v1.User.key)
  return _impl_.key_.Release();
}
inline void User::set_allocated_key(std::string* value) {
  PROTOBUF_TSAN_WRITE(&_impl_._tsan_detect_race);
  _impl_.key_.SetAllocated(value, GetArenaForAllocation());
  #ifdef PROTOBUF_FORCE_COPY_DEFAULT_STRING
        if (_impl_.key_.IsDefault()) {
          _impl_.key_.Set("", GetArenaForAllocation());
        }
  #endif  // PROTOBUF_FORCE_COPY_DEFAULT_STRING
  // @@protoc_insertion_point(field_set_allocated:api.v1.User.key)
}

// string username = 2 [json_name = "username"];
inline void User::clear_username() {
  _impl_.username_.ClearToEmpty();
}
inline const std::string& User::username() const {
  // @@protoc_insertion_point(field_get:api.v1.User.username)
  return _internal_username();
}
template <typename Arg_, typename... Args_>
inline PROTOBUF_ALWAYS_INLINE void User::set_username(Arg_&& arg,
                                                     Args_... args) {
  PROTOBUF_TSAN_WRITE(&_impl_._tsan_detect_race);
  ;
  _impl_.username_.Set(static_cast<Arg_&&>(arg), args..., GetArenaForAllocation());
  // @@protoc_insertion_point(field_set:api.v1.User.username)
}
inline std::string* User::mutable_username() {
  std::string* _s = _internal_mutable_username();
  // @@protoc_insertion_point(field_mutable:api.v1.User.username)
  return _s;
}
inline const std::string& User::_internal_username() const {
  PROTOBUF_TSAN_READ(&_impl_._tsan_detect_race);
  return _impl_.username_.Get();
}
inline void User::_internal_set_username(const std::string& value) {
  PROTOBUF_TSAN_WRITE(&_impl_._tsan_detect_race);
  ;
  _impl_.username_.Set(value, GetArenaForAllocation());
}
inline std::string* User::_internal_mutable_username() {
  PROTOBUF_TSAN_WRITE(&_impl_._tsan_detect_race);
  ;
  return _impl_.username_.Mutable( GetArenaForAllocation());
}
inline std::string* User::release_username() {
  PROTOBUF_TSAN_WRITE(&_impl_._tsan_detect_race);
  // @@protoc_insertion_point(field_release:api.v1.User.username)
  return _impl_.username_.Release();
}
inline void User::set_allocated_username(std::string* value) {
  PROTOBUF_TSAN_WRITE(&_impl_._tsan_detect_race);
  _impl_.username_.SetAllocated(value, GetArenaForAllocation());
  #ifdef PROTOBUF_FORCE_COPY_DEFAULT_STRING
        if (_impl_.username_.IsDefault()) {
          _impl_.username_.Set("", GetArenaForAllocation());
        }
  #endif  // PROTOBUF_FORCE_COPY_DEFAULT_STRING
  // @@protoc_insertion_point(field_set_allocated:api.v1.User.username)
}

#ifdef __GNUC__
#pragma GCC diagnostic pop
#endif  // __GNUC__

// @@protoc_insertion_point(namespace_scope)
}  // namespace v1
}  // namespace api


// @@protoc_insertion_point(global_scope)

#include "google/protobuf/port_undef.inc"

#endif  // GOOGLE_PROTOBUF_INCLUDED_v1_2fauth_2eproto_2epb_2eh
