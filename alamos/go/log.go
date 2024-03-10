// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

package alamos

import (
	"github.com/synnaxlabs/x/config"
	"github.com/synnaxlabs/x/override"
	"go.uber.org/zap"
)

// LoggerConfig is the config for a Logger.
type LoggerConfig struct {
	// Zap sets the underlying zap.Logger. If nil, a no-op logger is used.
	Zap *zap.Logger
}

var (
	_ config.Config[LoggerConfig] = LoggerConfig{}
	// DefaultLoggerConfig is the default config for a Logger.
	DefaultLoggerConfig = LoggerConfig{}
)

// Validate implements config.Properties.
func (c LoggerConfig) Validate() error { return nil }

// Override implements config.Properties.
func (c LoggerConfig) Override(other LoggerConfig) LoggerConfig {
	c.Zap = override.Nil(c.Zap, other.Zap)
	return c
}

// Logger provides logging functionality. It's an enhanced wrapper around a zap.Logger
// that provides no-lop logging when nil.
type Logger struct{ zap *zap.Logger }

// NewLogger creates a new Logger with the given configuration.
func NewLogger(configs ...LoggerConfig) (*Logger, error) {
	cfg, err := config.New(DefaultLoggerConfig, configs...)
	if err != nil {
		return nil, err
	}
	return &Logger{zap: cfg.Zap}, nil
}

func (l *Logger) child(meta InstrumentationMeta) (nl *Logger) {
	if l != nil {
		nl = &Logger{zap: l.zap.Named(meta.Key)}
	}
	return
}

// Debug logs a message at the Debug level with the given fields.
func (l *Logger) Debug(msg string, fields ...zap.Field) {
	if l != nil {
		l.zap.Debug(msg, fields...)
	}
}

// Debugf logs a message at the Debug level using the given format. This is a slower
// method that should not be used in hot paths.
func (l *Logger) Debugf(format string, args ...interface{}) {
	if l != nil {
		l.zap.Sugar().Debugf(format, args...)
	}
}

// Info logs a message at the Info level with the given fields.
func (l *Logger) Info(msg string, fields ...zap.Field) {
	if l != nil {
		l.zap.Info(msg, fields...)
	}
}

// Warn logs a message at the Warn level with the given fields.
func (l *Logger) Warn(msg string, fields ...zap.Field) {
	if l != nil {
		l.zap.Warn(msg, fields...)
	}
}

// Error logs a message at the Error level with the given fields.
func (l *Logger) Error(msg string, fields ...zap.Field) {
	if l != nil {
		l.zap.Error(msg, fields...)
	}
}

// Fatal logs a message at the Fatal level with the given fields and then exits the
// process with status code 1.
func (l *Logger) Fatal(msg string, fields ...zap.Field) {
	if l != nil {
		l.zap.Fatal(msg, fields...)
	}
}

// DPanic logs a message with the given fields that  panics in development mode and logs
// to the Error level in production mode.
func (l *Logger) DPanic(msg string, fields ...zap.Field) {
	if l != nil {
		l.zap.DPanic(msg, fields...)
	}
}

// DebugError returns a zap field that can be used to log an error whose presence
// is not exceptional i.e. it does not deserve a stack trace. zap.Error has no way
// to disable stack traces in debug logging, so we use this instead. DebugError should
// only be used in debug logging, and NOT for production errors that are exceptional.
func DebugError(err error) zap.Field {
	if err == nil {
		return zap.Skip()
	}
	return zap.String("error", err.Error())
}
