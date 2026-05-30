export const STORAGE_KEY = "originalPinState";

export function createEmptyState() {
  return {
    version: 1,
    records: {},
    knownUrls: {}
  };
}

export function normalizeUrl(url) {
  if (typeof url !== "string") {
    return "";
  }

  return url.trim();
}

export function getVisibleTabUrl(tab) {
  return normalizeUrl(tab?.pendingUrl || tab?.url || "");
}

export function cloneState(state) {
  const source = state && typeof state === "object" ? state : createEmptyState();

  return {
    version: 1,
    records: { ...(source.records || {}) },
    knownUrls: { ...(source.knownUrls || {}) }
  };
}

export function recordPinnedTab(state, tab, options = {}) {
  const next = cloneState(state);
  const tabId = String(tab?.id ?? "");
  const currentUrl = getVisibleTabUrl(tab);

  if (!tabId || !currentUrl) {
    return {
      state: next,
      changed: false,
      reason: "missing-tab-or-url"
    };
  }

  const now = options.now || new Date().toISOString();
  const existing = next.records[tabId];
  const known = next.knownUrls[currentUrl];
  const originalUrl = options.forceOriginal
    ? currentUrl
    : existing?.originalUrl || known?.originalUrl || currentUrl;

  next.records[tabId] = {
    tabId: tab.id,
    windowId: tab.windowId,
    index: tab.index,
    title: tab.title || existing?.title || "",
    originalUrl,
    currentUrl,
    createdAt: existing?.createdAt || now,
    updatedAt: now
  };

  rememberUrl(next, originalUrl, originalUrl, now);
  rememberUrl(next, currentUrl, originalUrl, now);

  return {
    state: next,
    changed: true,
    record: next.records[tabId]
  };
}

export function recordPinnedNavigation(state, tab, options = {}) {
  const tabId = String(tab?.id ?? "");
  const currentUrl = getVisibleTabUrl(tab);

  if (!tabId || !currentUrl) {
    return {
      state: cloneState(state),
      changed: false,
      reason: "missing-tab-or-url"
    };
  }

  const next = cloneState(state);
  const existing = next.records[tabId];

  if (!existing) {
    return recordPinnedTab(next, tab, options);
  }

  const now = options.now || new Date().toISOString();
  const originalUrl = existing.originalUrl || currentUrl;

  next.records[tabId] = {
    ...existing,
    windowId: tab.windowId,
    index: tab.index,
    title: tab.title || existing.title || "",
    currentUrl,
    updatedAt: now
  };

  rememberUrl(next, currentUrl, originalUrl, now);

  return {
    state: next,
    changed: true,
    record: next.records[tabId]
  };
}

export function forgetTabRecord(state, tabId) {
  const next = cloneState(state);
  delete next.records[String(tabId)];
  return next;
}

export function getRecordForTab(state, tabId) {
  return cloneState(state).records[String(tabId)] || null;
}

export function hydratePinnedTabs(state, tabs, options = {}) {
  let next = cloneState(state);
  let changed = false;

  for (const tab of tabs || []) {
    if (!tab?.pinned) {
      continue;
    }

    const result = recordPinnedTab(next, tab, options);
    next = result.state;
    changed = changed || result.changed;
  }

  return {
    state: next,
    changed
  };
}

function rememberUrl(state, seenUrl, originalUrl, seenAt) {
  const normalizedSeenUrl = normalizeUrl(seenUrl);
  const normalizedOriginalUrl = normalizeUrl(originalUrl);

  if (!normalizedSeenUrl || !normalizedOriginalUrl) {
    return;
  }

  state.knownUrls[normalizedSeenUrl] = {
    originalUrl: normalizedOriginalUrl,
    lastSeenAt: seenAt
  };
}
