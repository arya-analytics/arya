import { describe, expect, it } from "vitest";

import { telem } from "@/telem/aether";

describe("telem", () => {
  it.only("pipeline", async () => {
    const s1 = telem.fixedNumber(20);
    const s2 = telem.fixedNumber(9);
    const avg = telem.mean({});
    const bool = telem.withinBounds({ trueBound: { upper: 15, lower: 5 } });
    const p = new telem.SourcePipeline(
      {
        connections: [
          { from: "s1", to: "avg" },
          { from: "s2", to: "avg" },
          { from: "avg", to: "bool" },
        ],
        outlet: "bool",
        segments: {
          s1,
          s2,
          avg,
          bool,
        },
      },
      telem.factory(),
    );
    expect(await p.value()).toEqual(false);
  });
});
