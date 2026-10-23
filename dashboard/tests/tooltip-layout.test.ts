import test from "node:test";
import assert from "node:assert/strict";
import { metricPanelPosition } from "../src/lib/tooltip-layout.ts";
test("metric explanations stay usable across portrait, landscape and keyboard viewports", () => {
  for (const viewport of [
    { width: 320, height: 568 },
    { width: 1280, height: 900 },
    { width: 390, height: 844 },
    { width: 844, height: 390 },
    { width: 320, height: 240 },
    { width: 320, height: 300, top: 120, left: 20 },
  ]) {
    const ox = viewport.left ?? 0,
      oy = viewport.top ?? 0;
    for (const anchor of [
      { left: ox, right: ox + 40, top: oy + 60, bottom: oy + 100 },
      {
        left: ox,
        right: ox + 320,
        top: oy + viewport.height - 80,
        bottom: oy + viewport.height - 20,
      },
      { left: ox + 250, right: ox + 320, top: oy + 150, bottom: oy + 510 },
      { left: ox, right: ox + 320, top: oy + 5, bottom: oy + viewport.height - 5 },
    ]) {
      const p = metricPanelPosition(anchor, viewport, 400);
      assert.ok(p.left >= ox + 16);
      assert.ok(p.left + p.width <= ox + viewport.width - 16);
      assert.ok(p.top >= oy + 16);
      assert.ok(p.maxHeight >= 1);
      assert.ok(p.top + p.maxHeight <= oy + viewport.height - 16);
    }
  }
});
test("normal desktop placement keeps the explanation outside its hover card", () => {
  const anchor = { left: 100, right: 440, top: 120, bottom: 300 };
  const p = metricPanelPosition(anchor, { width: 1280, height: 900 });
  assert.equal(p.top, 312);
  assert.equal(p.width, 340);
});
