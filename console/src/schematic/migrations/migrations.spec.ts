import { describe, expect, it } from "vitest";

import {
  migrateSlice,
  migrateState,
  ZERO_SLICE_STATE,
  ZERO_STATE,
} from "@/schematic/migrations";
import * as v0 from "@/schematic/migrations/v0";
import * as v1 from "@/schematic/migrations/v1";

describe("migrations", () => {
  describe("state", () => {
    const STATES = [v0.ZERO_STATE, v1.ZERO_STATE];
    STATES.forEach((state) => {
      it(`should migrate state from ${state.version} to latest`, () => {
        const migrated = migrateState(state);
        expect(migrated).toEqual(ZERO_STATE);
      });
    });
  });
  describe("slice", () => {
    const STATES = [v0.ZERO_SLICE_STATE, v1.ZERO_SLICE_STATE];
    STATES.forEach((state) => {
      it(`should migrate slice from ${state.version} to latest`, () => {
        const migrated = migrateSlice(state);
        expect(migrated).toEqual(ZERO_SLICE_STATE);
      });
    });
  });
});
