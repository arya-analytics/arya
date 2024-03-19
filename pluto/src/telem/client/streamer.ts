import { alamos } from "@synnaxlabs/alamos";
import { type framer, type channel, type Synnax } from "@synnaxlabs/client";
import { compare, type AsyncDestructor, type Required } from "@synnaxlabs/x";
import { Mutex } from "async-mutex";

import { type Cache } from "@/telem/client/cache/cache";
import { ReadResponse } from "@/telem/client/types";

export type StreamHandler = (data: Record<channel.Key, ReadResponse>) => void;

interface ListenerEntry {
  valid: boolean;
  keys: channel.Keys;
}

interface StreamerProps {
  core: Synnax;
  cache: Cache;
  instrumentation?: alamos.Instrumentation;
}

export class Streamer {
  private readonly props: Required<StreamerProps>;

  private readonly mu: Mutex = new Mutex();
  private readonly listeners = new Map<StreamHandler, ListenerEntry>();
  private streamerRunLoop: Promise<void> | null = null;
  private streamer: framer.Streamer | null = null;

  constructor(props: StreamerProps) {
    this.props = {
      instrumentation: alamos.NOOP,
      ...props,
    };
  }

  /** Implements StreamClient. */
  async stream(handler: StreamHandler, keys: channel.Keys): Promise<AsyncDestructor> {
    const {
      cache,
      instrumentation: { L },
    } = this.props;
    await cache.populateMissing(keys);
    return await this.mu.runExclusive(async () => {
      L.debug("adding stream handler", { keys });
      this.listeners.set(handler, { valid: true, keys });
      const dynamicBuffs: Record<channel.Key, ReadResponse> = {};
      for (const key of keys) {
        const unary = cache.get(key);
        const bufs = unary.leadingBuffer != null ? [unary.leadingBuffer] : [];
        dynamicBuffs[key] = new ReadResponse(unary.channel, bufs);
      }
      handler(dynamicBuffs);
      await this.updateStreamer();
      return async () => await this.removeStreamHandler(handler);
    });
  }

  private async removeStreamHandler(handler: StreamHandler): Promise<void> {
    const {
      instrumentation: { L },
    } = this.props;
    await this.mu.runExclusive(() => {
      const entry = this.listeners.get(handler);
      if (entry == null) return;
      entry.valid = false;
    });
    setTimeout(() => {
      void this.mu.runExclusive(async () => {
        L.debug("removing stream handler");
        if (this.listeners.delete(handler)) return await this.updateStreamer();
        L.warn("attempted to remove non-existent stream handler");
      });
    }, 5000);
  }

  private async updateStreamer(): Promise<void> {
    const {
      instrumentation: { L },
      core,
    } = this.props;
    // Assemble the set of keys we need to stream.
    const keys = new Set<channel.Key>();
    this.listeners.forEach((v) => v.keys.forEach((k) => keys.add(k)));

    // If we have no keys to stream, close the streamer to save network chatter.
    if (keys.size === 0) {
      L.info("no keys to stream, closing streamer");
      this.streamer?.close();
      if (this.streamerRunLoop != null) await this.streamerRunLoop;
      this.streamer = null;
      L.info("streamer closed successfully");
      return;
    }

    const arrKeys = Array.from(keys);
    if (compare.primitiveArrays(arrKeys, this.streamer?.keys ?? []) === compare.EQUAL) {
      L.debug("streamer keys unchanged", { keys: arrKeys });
      return;
    }

    // Update or create the streamer.
    if (this.streamer == null) {
      L.info("creating new streamer", { keys: arrKeys });
      this.streamer = await core.telem.newStreamer(arrKeys);
      this.streamerRunLoop = this.runStreamer(this.streamer);
    }

    L.debug("updating streamer", { prev: this.streamer.keys, next: arrKeys });

    try {
      await this.streamer.update(arrKeys);
    } catch (e) {
      L.error("failed to update streamer", { error: e });
      throw e;
    }
  }

  private async runStreamer(streamer: framer.Streamer): Promise<void> {
    const {
      cache,
      instrumentation: { L },
    } = this.props;
    try {
      for await (const frame of streamer) {
        const changed: ReadResponse[] = [];
        for (const k of frame.keys) {
          const series = frame.get(k);
          const unary = cache.get(k);
          const out = unary.writeDynamic(series);
          changed.push(new ReadResponse(unary.channel, out));
        }
        this.listeners.forEach((entry, handler) => {
          if (!entry.valid) return;
          const notify = changed.filter((r) => entry.keys.includes(r.channel.key));
          if (notify.length === 0) return;
          const d = Object.fromEntries(notify.map((r) => [r.channel.key, r]));
          handler(d);
        });
      }
    } catch (e) {
      L.error("streamer run loop failed", { error: e });
      throw e;
    }
  }

  async close(): Promise<void> {
    this.streamer?.close();
    if (this.streamerRunLoop != null) await this.streamerRunLoop;
  }
}
