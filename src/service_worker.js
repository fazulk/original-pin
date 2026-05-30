import {
  MENU_RESTORE,
  MENU_SET,
  createContextMenuSetup,
  updateContextMenuVisibility
} from "./context_menus.js";
import {
  STORAGE_KEY,
  createEmptyState,
  forgetTabRecord,
  getRecordForTab,
  hydratePinnedTabs,
  recordPinnedNavigation,
  recordPinnedTab
} from "./model.js";

const RESTORE_COMMAND = "restore-current-pinned-tab";

const ensureContextMenus = createContextMenuSetup(chrome);

initializeContextMenus().catch((error) => {
  console.error("Failed to initialize Original Pin context menus", error);
});

chrome.runtime.onInstalled.addListener(async () => {
  await ensureContextMenus();
  await hydrateOpenPinnedTabs();
  await syncContextMenusForActiveTab();
});

chrome.runtime.onStartup.addListener(async () => {
  await ensureContextMenus();
  await hydrateOpenPinnedTabs();
  await syncContextMenusForActiveTab();
});

chrome.tabs.onCreated.addListener(async (tab) => {
  await ensureContextMenus();

  if (tab.pinned) {
    await savePinnedTab(tab);
  }

  await syncContextMenusForActiveTab(tab);
});

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  await ensureContextMenus();

  const tab = await chrome.tabs.get(activeInfo.tabId);
  await syncContextMenusForActiveTab(tab);
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  await ensureContextMenus();

  if (changeInfo.pinned === true) {
    await savePinnedTab(tab);
    await syncContextMenusForActiveTab(tab);
    return;
  }

  if (changeInfo.pinned === false) {
    await removeTabRecord(tabId);
    await syncContextMenusForActiveTab(tab);
    return;
  }

  if (tab.pinned && (changeInfo.url || changeInfo.pendingUrl || changeInfo.status === "complete")) {
    await savePinnedNavigation(tab);
  }
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
  await ensureContextMenus();
  await removeTabRecord(tabId);
  await syncContextMenusForActiveTab();
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== RESTORE_COMMAND) {
    return;
  }

  await ensureContextMenus();

  const tab = await getActiveTab();
  if (tab) {
    await restoreTab(tab);
  }
});

chrome.action.onClicked.addListener(async (tab) => {
  await ensureContextMenus();
  await restoreTab(tab);
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  await ensureContextMenus();

  if (!tab?.id) {
    return;
  }

  if (!tab.pinned) {
    await flashBadge(tab.id, "PIN", "#8a4b00");
    return;
  }

  if (info.menuItemId === MENU_RESTORE) {
    await restoreTab(tab);
  }

  if (info.menuItemId === MENU_SET) {
    await savePinnedTab(tab, { forceOriginal: true });
    await flashBadge(tab.id, "SET", "#2d7d46");
  }

});

async function initializeContextMenus() {
  await ensureContextMenus();
  await syncContextMenusForActiveTab();
}

async function syncContextMenusForActiveTab(tab = null) {
  const activeTab = tab?.active ? tab : await getActiveTab();
  await updateContextMenuVisibility(chrome, Boolean(activeTab?.pinned));
}

async function hydrateOpenPinnedTabs() {
  const tabs = await chrome.tabs.query({ pinned: true });
  const state = await loadState();
  const result = hydratePinnedTabs(state, tabs);

  if (result.changed) {
    await saveState(result.state);
  }
}

async function savePinnedTab(tab, options = {}) {
  if (!tab?.id || !tab.pinned) {
    return null;
  }

  const state = await loadState();
  const result = recordPinnedTab(state, tab, options);

  if (result.changed) {
    await saveState(result.state);
  }

  return result.record || null;
}

async function savePinnedNavigation(tab) {
  if (!tab?.id || !tab.pinned) {
    return null;
  }

  const state = await loadState();
  const result = recordPinnedNavigation(state, tab);

  if (result.changed) {
    await saveState(result.state);
  }

  return result.record || null;
}

async function removeTabRecord(tabId) {
  const state = await loadState();
  await saveState(forgetTabRecord(state, tabId));
}

async function restoreTab(tab) {
  if (!tab?.id) {
    return;
  }

  if (!tab.pinned) {
    await flashBadge(tab.id, "PIN", "#8a4b00");
    return;
  }

  const state = await loadState();
  let record = getRecordForTab(state, tab.id);

  if (!record) {
    record = await savePinnedTab(tab);
  }

  const originalUrl = record?.originalUrl;

  if (!isSupportedNavigationUrl(originalUrl)) {
    await flashBadge(tab.id, "ERR", "#9b1c1c");
    return;
  }

  if (tab.url === originalUrl) {
    await flashBadge(tab.id, "OK", "#2d7d46");
    return;
  }

  await chrome.tabs.update(tab.id, { url: originalUrl });
  await flashBadge(tab.id, "GO", "#2b5dab");
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true
  });
  return tab || null;
}

async function loadState() {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  return result[STORAGE_KEY] || createEmptyState();
}

async function saveState(state) {
  await chrome.storage.local.set({ [STORAGE_KEY]: state });
}

async function flashBadge(tabId, text, color) {
  await chrome.action.setBadgeBackgroundColor({ tabId, color });
  await chrome.action.setBadgeText({ tabId, text });
  setTimeout(() => {
    chrome.action.setBadgeText({ tabId, text: "" });
  }, 1600);
}

function isSupportedNavigationUrl(url) {
  if (!url) {
    return false;
  }

  try {
    const parsed = new URL(url);
    return ["http:", "https:", "file:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}
