// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { describe, it, expect } from "vitest";

import { deep } from "@/deep";
import { z } from "zod";
import { UnknownRecord } from "@/record";

interface TestRecord {
  a: number;
  b: {
    c?: number;
    d?: number;
  };
  c: number[];
}

describe("path", () => {
  describe("get", () => {
    it("should get a key", () => {
      const a: TestRecord = {
        a: 1,
        b: {
          c: 2,
        },
        c: [1],
      };
      expect(deep.get(a, "b.c")).toEqual(2);
    });
    it("should get an array index", () => {
      const a: TestRecord = {
        a: 1,
        b: {
          c: 2,
        },
        c: [1, 2, 3],
      };
      expect(deep.get(a, "c.1")).toEqual(2);
    });
    it("should return the object itself if the key is empty", () => {
      const a: TestRecord = {
        a: 1,
        b: {
          c: 2,
        },
        c: [1, 2, 3],
      };
      expect(deep.get(a, "")).toStrictEqual(a);
    });
    describe("custom getter function", () => {
      const v =  {
        a: {
          value: () => ({
            c: 0
          })
        }
      }
      it("should use the custom getter function", () => {
        expect(deep.get(v, "a.value().c", false, {
          getter: (obj, key) => {
            if (key === "value()") 
              return (obj as { value: () => { c: number } }).value();
            return (obj as UnknownRecord)[key];
          }
        })).toEqual(0);
      });
    });
  });
  describe("set", () => {
    it("should set a key", () => {
      const a: TestRecord = {
        a: 1,
        b: {
          c: 2,
        },
        c: [1],
      };
      const b: TestRecord = {
        a: 1,
        b: {
          c: 3,
        },
        c: [1],
      };
      deep.set(a, "b.c", 3);
      expect(a).toEqual(b);
    });
    it("should set an array index", () => {
      const a: TestRecord = {
        a: 1,
        b: {
          c: 2,
        },
        c: [1, 2, 3],
      };
      const b: TestRecord = {
        a: 1,
        b: {
          c: 2,
        },
        c: [1, 4, 3],
      };
      deep.set(a, "c.1", 4);
      expect(a).toEqual(b);
    });
  });

  describe("transformPath", () => {
    it("should transform a path", () => {
      expect(deep.transformPath("a.b.c", (part) => part.toUpperCase())).toEqual("A.B.C");
    });
    it("should inject additional parts into the path", () => {
      expect(deep.transformPath("a.b.c", (p) => [p, "d"])).toEqual("a.d.b.d.c.d");
    });
    it("should remove parts from the path", () => {
      expect(deep.transformPath("a.b.c", (p, i) => i === 1 ? undefined : p)).toEqual("a.c");
    });
  })

});


