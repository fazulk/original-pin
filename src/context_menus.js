export const MENU_RESTORE = "original-pin-restore";
export const MENU_SET = "original-pin-set";

const MENU_CONTEXTS = ["page"];

const CONTEXT_MENU_ITEMS = [
  {
    id: MENU_RESTORE,
    title: "Return to original URL",
    contexts: MENU_CONTEXTS,
    visible: false
  },
  {
    id: MENU_SET,
    title: "Set current URL as original",
    contexts: MENU_CONTEXTS,
    visible: false
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

export async function updateContextMenuVisibility(chromeApi, visible) {
  await Promise.all(
    CONTEXT_MENU_ITEMS.map((item) =>
      updateContextMenu(chromeApi, item.id, { visible })
    )
  );
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

function updateContextMenu(chromeApi, id, properties) {
  return new Promise((resolve, reject) => {
    chromeApi.contextMenus.update(id, properties, () => {
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
