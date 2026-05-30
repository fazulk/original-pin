import assert from "node:assert/strict";
import test from "node:test";

import {
  createEmptyState,
  forgetTabRecord,
  getRecordForTab,
  hydratePinnedTabs,
  recordPinnedNavigation,
  recordPinnedTab
} from "../src/model.js";

const T0 = "2026-05-30T00:00:00.000Z";
const T1 = "2026-05-30T00:01:00.000Z";

test("records the first URL when a tab is pinned", () => {
  const result = recordPinnedTab(createEmptyState(), {
    id: 4,
    windowId: 1,
    index: 0,
    pinned: true,
    title: "Mail",
    url: "https://mail.example.com/inbox"
  }, { now: T0 });

  const record = getRecordForTab(result.state, 4);

  assert.equal(record.originalUrl, "https://mail.example.com/inbox");
  assert.equal(record.currentUrl, "https://mail.example.com/inbox");
  assert.equal(result.state.knownUrls["https://mail.example.com/inbox"].originalUrl, "https://mail.example.com/inbox");
});

test("does not overwrite the original URL during navigation", () => {
  let state = recordPinnedTab(createEmptyState(), {
    id: 4,
    windowId: 1,
    index: 0,
    pinned: true,
    title: "Mail",
    url: "https://mail.example.com/inbox"
  }, { now: T0 }).state;

  state = recordPinnedNavigation(state, {
    id: 4,
    windowId: 1,
    index: 0,
    pinned: true,
    title: "Mail message",
    url: "https://mail.example.com/message/123"
  }, { now: T1 }).state;

  const record = getRecordForTab(state, 4);

  assert.equal(record.originalUrl, "https://mail.example.com/inbox");
  assert.equal(record.currentUrl, "https://mail.example.com/message/123");
  assert.equal(state.knownUrls["https://mail.example.com/message/123"].originalUrl, "https://mail.example.com/inbox");
});

test("reattaches a restored pinned tab using a remembered current URL", () => {
  const beforeRestart = recordPinnedNavigation(recordPinnedTab(createEmptyState(), {
    id: 4,
    windowId: 1,
    index: 0,
    pinned: true,
    title: "App",
    url: "https://app.example.com/home"
  }, { now: T0 }).state, {
    id: 4,
    windowId: 1,
    index: 0,
    pinned: true,
    title: "App project",
    url: "https://app.example.com/project/42"
  }, { now: T1 }).state;

  const afterRestart = {
    ...beforeRestart,
    records: {}
  };

  const hydrated = hydratePinnedTabs(afterRestart, [{
    id: 19,
    windowId: 3,
    index: 0,
    pinned: true,
    title: "App project",
    url: "https://app.example.com/project/42"
  }], { now: T1 }).state;

  assert.equal(getRecordForTab(hydrated, 19).originalUrl, "https://app.example.com/home");
});

test("forceOriginal replaces the original URL with the current URL", () => {
  let state = recordPinnedTab(createEmptyState(), {
    id: 4,
    windowId: 1,
    index: 0,
    pinned: true,
    title: "Docs",
    url: "https://docs.example.com/start"
  }, { now: T0 }).state;

  state = recordPinnedTab(state, {
    id: 4,
    windowId: 1,
    index: 0,
    pinned: true,
    title: "Docs current",
    url: "https://docs.example.com/current"
  }, { now: T1, forceOriginal: true }).state;

  assert.equal(getRecordForTab(state, 4).originalUrl, "https://docs.example.com/current");
});

test("forgetTabRecord removes the live tab association", () => {
  const state = recordPinnedTab(createEmptyState(), {
    id: 4,
    windowId: 1,
    index: 0,
    pinned: true,
    title: "Mail",
    url: "https://mail.example.com/inbox"
  }, { now: T0 }).state;

  assert.equal(getRecordForTab(forgetTabRecord(state, 4), 4), null);
});
