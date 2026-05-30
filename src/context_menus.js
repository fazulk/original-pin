export const MENU_RESTORE = "original-pin-restore";
export const MENU_SET = "original-pin-set";
export const MENU_FORGET = "original-pin-forget";

const MENU_CONTEXTS = ["page"];

const CONTEXT_MENU_ITEMS = [
  {
    id: MENU_RESTORE,
    title: "Return pinned tab to original URL",
    contexts: MENU_CONTEXTS
  },
  {
    id: MENU_SET,
    title: "Set original URL for pinned tab",
    contexts: MENU_CONTEXTS
  },
  {
    id: MENU_FORGET,
    title: "Forget original URL for tab",
    contexts: MENU_CONTEXTS
  }
];

export function createContextMenuSetup(chromeApi, logger = console) {
  let contextMenuSetup = null;
  let contextMenusReady = false;

  return function ensureContextMenus() {
    if (contextMenusReady) {
      return Promise.resolve();
    }

    if (contextMenuSetup) {
      return contextMenuSetup;
    }

    contextMenuSetup = rebuildContextMenus(chromeApi)
      .then(() => {
        contextMenusReady = true;
      })
      .catch((error) => {
        contextMenusReady = false;
        logger.error("Failed to create Original Pin context menus", error);
      })
      .finally(() => {
        contextMenuSetup = null;
      });

    return contextMenuSetup;
  };
}

export async function rebuildContextMenus(chromeApi) {
  await removeAllContextMenus(chromeApi);

  for (const item of CONTEXT_MENU_ITEMS) {
    await createContextMenu(chromeApi, item);
  }
}

function removeAllContextMenus(chromeApi) {
  return new Promise((resolve, reject) => {
    chromeApi.contextMenus.removeAll(() => {
      const error = chromeApi.runtime.lastError;
      if (error) {
        reject(new Error(error.message));
        return;
      }

      resolve();
    });
  });
}

function createContextMenu(chromeApi, properties) {
  return new Promise((resolve, reject) => {
    chromeApi.contextMenus.create(properties, () => {
      const error = chromeApi.runtime.lastError;
      if (error) {
        reject(new Error(error.message));
        return;
      }

      resolve();
    });
  });
}
