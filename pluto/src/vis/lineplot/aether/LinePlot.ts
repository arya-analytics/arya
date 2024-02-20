// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { type Instrumentation } from "@synnaxlabs/alamos";
import { box, xy } from "@synnaxlabs/x";
import { z } from "zod";

import { aether } from "@/aether/aether";
import { alamos } from "@/alamos/aether";
import { status } from "@/status/aether";
import { type FindResult } from "@/vis/line/aether/line";
import { calculatePlotBox, gridPositionSpecZ } from "@/vis/lineplot/aether/grid";
import { XAxis } from "@/vis/lineplot/aether/XAxis";
import { YAxis } from "@/vis/lineplot/aether/YAxis";
import { tooltip } from "@/vis/lineplot/tooltip/aether";
import { measure } from "@/vis/measure/aether";
import { render } from "@/vis/render";

export const linePlotStateZ = z.object({
  container: box.box,
  viewport: box.box,
  hold: z.boolean().optional().default(false),
  grid: z.array(gridPositionSpecZ),
  clearOverscan: xy.crudeZ,
});

interface InternalState {
  instrumentation: Instrumentation;
  aggregate: status.Aggregate;
  renderCtx: render.Context;
}

type Children = XAxis | tooltip.Tooltip | measure.Measure;

export class LinePlot extends aether.Composite<
  typeof linePlotStateZ,
  InternalState,
  Children
> {
  static readonly TYPE: string = "LinePlot";
  private readonly eraser: render.Eraser = new render.Eraser();

  schema = linePlotStateZ;

  afterUpdate(): void {
    this.internal.instrumentation = alamos.useInstrumentation(this.ctx, "lineplot");
    this.internal.aggregate = status.useAggregate(this.ctx);
    this.internal.renderCtx = render.Context.use(this.ctx);
    render.Controller.control(this.ctx, (r) => this.requestRender("low", r));
    this.requestRender("high", render.REASON_LAYOUT);
  }

  afterDelete(): void {
    this.internal.renderCtx = render.Context.use(this.ctx);
    this.requestRender("high", render.REASON_LAYOUT);
  }

  async findByXDecimal(x: number): Promise<FindResult[]> {
    const props = { ...this.state, plot: this.calculatePlot() };
    const p = this.axes.flatMap(async (xAxis) => await xAxis.findByXDecimal(props, x));
    return (await Promise.all(p)).flat();
  }

  async findByXValue(x: number): Promise<FindResult[]> {
    const props = { ...this.state, plot: this.calculatePlot() };
    const p = this.axes.flatMap(async (a) => await a.findByXValue(props, x));
    return (await Promise.all(p)).flat();
  }

  private get axes(): readonly XAxis[] {
    return this.childrenOfType<XAxis>(XAxis.TYPE);
  }

  private get tooltips(): readonly tooltip.Tooltip[] {
    return this.childrenOfType<tooltip.Tooltip>(tooltip.Tooltip.TYPE);
  }

  private get measures(): readonly measure.Measure[] {
    return this.childrenOfType<measure.Measure>(measure.Measure.TYPE);
  }

  private async renderAxes(
    plot: box.Box,
    canvases: render.CanvasVariant[],
  ): Promise<void> {
    const p = { ...this.state, plot, canvases };
    await Promise.all(this.axes.map(async (xAxis) => await xAxis.render(p)));
  }

  private async renderTooltips(
    region: box.Box,
    canvases: render.CanvasVariant[],
  ): Promise<void> {
    const p = { findByXDecimal: this.findByXDecimal.bind(this), region, canvases };
    await Promise.all(this.tooltips.map(async (t) => await t.render(p)));
  }

  private async renderMeasures(
    region: box.Box,
    canvases: render.CanvasVariant[],
  ): Promise<void> {
    const p = {
      findByXDecimal: this.findByXDecimal.bind(this),
      findByXValue: this.findByXValue.bind(this),
      region,
      canvases,
    };
    await Promise.all(this.measures.map(async (m) => await m.render(p)));
  }

  private calculatePlot(): box.Box {
    return calculatePlotBox(this.state.grid, this.state.container);
  }

  private async render(
    canvases: render.CanvasVariant[],
  ): Promise<render.Cleanup | undefined> {
    const { instrumentation } = this.internal;
    if (this.deleted) {
      instrumentation.L.debug("deleted, skipping render", { key: this.key });
      return;
    }

    const plot = this.calculatePlot();

    instrumentation.L.debug("rendering", {
      key: this.key,
      viewport: this.state.viewport,
      container: this.state.container,
      grid: this.state.grid,
      plot,
      canvases,
    });

    const { renderCtx } = this.internal;
    const os = xy.construct(this.state.clearOverscan);
    const removeCanvasScissor = renderCtx.scissor(
      this.state.container,
      os,
      canvases.filter((c) => c !== "gl"),
    );
    const removeGLScissor = renderCtx.scissor(
      plot,
      xy.ZERO,
      canvases.filter((c) => c === "gl"),
    );

    try {
      await this.renderAxes(plot, canvases);
      await this.renderTooltips(plot, canvases);
      await this.renderMeasures(plot, canvases);
      renderCtx.gl.flush();
    } catch (e) {
      this.internal.aggregate({
        key: `${this.type}-${this.key}`,
        variant: "error",
        message: (e as Error).message,
      });
    } finally {
      removeCanvasScissor();
      removeGLScissor();
    }
    instrumentation.L.debug("rendered", { key: this.key });
    const eraseRegion = box.copy(this.state.container);
    return async ({ canvases }) => {
      renderCtx.erase(eraseRegion, this.state.clearOverscan, ...canvases);
    };
  }

  requestRender(priority: render.Priority, reason: string): void {
    const { renderCtx: ctx } = this.internal;
    let canvases: render.CanvasVariant[] = ["upper2d", "lower2d", "gl"];
    // Optimization for tooltips, measures and other utilities. In this case, we only
    // need to render the upper2d canvas.
    if (reason === render.REASON_TOOL) canvases = ["upper2d"];
    void ctx.loop.set({
      key: `${this.type}-${this.key}`,
      render: async () => await this.render(canvases),
      priority,
      canvases,
    });
  }
}

export const REGISTRY: aether.ComponentRegistry = {
  [LinePlot.TYPE]: LinePlot,
  [XAxis.TYPE]: XAxis,
  [YAxis.TYPE]: YAxis,
};
