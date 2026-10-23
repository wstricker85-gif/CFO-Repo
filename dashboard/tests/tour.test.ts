import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, existsSync } from "node:fs";
import {
  initialTourState,
  tourReducer,
  tourSteps,
  tourChapters,
  tourProgress,
  tourIndex,
  normalizeTourPath,
} from "../src/lib/tour.ts";
test("the full tour covers every dashboard page exactly once across five chapters", () => {
  const app = new URL("../src/app/", import.meta.url);
  const pages = [
    "/",
    ...readdirSync(app, { withFileTypes: true })
      .filter((e) => e.isDirectory() && existsSync(new URL(`${e.name}/page.tsx`, app)))
      .map((e) => `/${e.name}`),
  ];
  assert.equal(tourSteps.length, 15);
  assert.equal(new Set(tourSteps.map((s) => s.path)).size, 15);
  assert.deepEqual([...tourSteps.map((s) => s.path)].sort(), pages.sort());
  assert.deepEqual(
    tourChapters.map((c) => tourSteps.filter((s) => s.chapter === c).length),
    [3, 5, 4, 2, 1],
  );
  for (const s of tourSteps) {
    for (const text of [s.title, s.description, s.benefit, s.tryIt, s.dataNote, s.target])
      assert.ok(text.trim());
  }
});
test("navigation resolves trailing slashes and hashes without counting unknown routes", () => {
  assert.equal(normalizeTourPath("/working-capital/#ueberfaellig"), "/working-capital");
  assert.equal(tourIndex("/kpi/?status=watch"), 1);
  assert.equal(tourIndex("/missing"), -1);
  assert.equal(tourIndex("/"), 0);
});
test("forward and backward navigation records unique visited pages without requiring exercises", () => {
  let state = tourReducer(initialTourState, { type: "start" });
  for (const step of tourSteps) state = tourReducer(state, { type: "visit", path: step.path });
  assert.equal(state.visited.length, 15);
  state = tourReducer(state, { type: "visit", path: "/guv/" });
  const progress = tourProgress(state, "/guv");
  assert.equal(progress.visited.size, 15);
  assert.equal(progress.remaining.length, 0);
  assert.equal(progress.previous!.path, "/analyse");
  assert.equal(progress.next!.path, "/bilanz");
});
test("jumping to the end never marks skipped pages as visited", () => {
  const state = tourReducer(tourReducer(initialTourState, { type: "start" }), {
    type: "visit",
    path: "/projekt",
  });
  const progress = tourProgress(state, "/projekt");
  assert.equal(progress.visited.size, 2);
  assert.equal(progress.remaining.length, 13);
  assert.equal(progress.next, null);
  const finished = tourReducer(state, { type: "finish" });
  assert.equal(finished.active, false);
  assert.equal(finished.finished, true);
  assert.equal(finished.visited.length, 2);
});
test("stop and resume retain progress and ignore browsing while inactive", () => {
  const started = tourReducer(initialTourState, { type: "start", path: "/bilanz" });
  const stopped = tourReducer(started, { type: "stop" });
  assert.equal(stopped.lastPath, "/bilanz");
  assert.equal(tourReducer(stopped, { type: "visit", path: "/markt" }), stopped);
  const resumed = tourReducer(stopped, { type: "resume" });
  assert.equal(resumed.active, true);
  assert.deepEqual(resumed.visited, ["/bilanz"]);
  assert.equal(tourReducer(resumed, { type: "visit", path: "/invalid" }), resumed);
});
test("restart clears only tour progress and a new session starts without a running tour", () => {
  assert.deepEqual(initialTourState, {
    active: false,
    visited: [],
    lastPath: null,
    finished: false,
  });
  const finished = tourReducer(tourReducer(initialTourState, { type: "start", path: "/board" }), {
    type: "finish",
  });
  assert.deepEqual(tourReducer(finished, { type: "start" }), {
    active: true,
    visited: ["/"],
    lastPath: "/",
    finished: false,
  });
  assert.equal(tourReducer(initialTourState, { type: "start", path: "/invalid" }).lastPath, "/");
});
test("current route is immediately reflected in progress without mutating stored state", () => {
  const state = tourReducer(initialTourState, { type: "start" });
  const before = structuredClone(state);
  const progress = tourProgress(state, "/daten/");
  assert.equal(progress.visited.size, 2);
  assert.equal(progress.step!.label, "CSV-Demo & Auswertung");
  assert.deepEqual(state, before);
  assert.equal(tourProgress(state, "/").previous, null);
});
test("source notes distinguish company fixtures, local CSV, live-source status and independent DCF assumptions", () => {
  assert.match(tourSteps.find((s) => s.path === "/markt")!.dataNote, /Abrufstatus.*Fallback/);
  assert.match(tourSteps.find((s) => s.path === "/daten")!.dataNote, /ohne Server- oder KI-Upload/);
  assert.match(tourSteps.find((s) => s.path === "/bewertung")!.dataNote, /WACC nicht automatisch/);
  assert.match(tourSteps.find((s) => s.path === "/board")!.dataNote, /keine ausgeführte KI/);
});
