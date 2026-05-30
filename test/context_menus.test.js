import assert from "node:assert/strict";
import test from "node:test";

import {
  MENU_FORGET,
  MENU_RESTORE,
  MENU_SET,
  createContextMenuSetup
} from "../src/context_menus.js";

test("context menu setup serializes concurrent rebuild requests", async () => {
  const fake = createFakeChromeApi();
  const errors = [];
  const ensureContextMenus = createContextMenuSetup(fake.chromeApi, {
    error: (...args) => errors.push(args)
  });

  await Promise.all([
    ensureContextMenus(),
    ensureContextMenus(),
    ensureContextMenus()
  ]);

  assert.deepEqual(errors, []);
  assert.equal(fake.stats().removeAllCalls, 1);
  assert.deepEqual(fake.stats().createdIds, [
    MENU_RESTORE,
    MENU_SET,
    MENU_FORGET
  ]);

  await ensureContextMenus();

  assert.equal(fake.stats().removeAllCalls, 1);
});

function createFakeChromeApi() {
  const ids = new Set();
  const createdIds = [];
  let removeAllCalls = 0;

  const chromeApi = {
    runtime: {
      lastError: null
    },
    contextMenus: {
      removeAll(callback) {
        removeAllCalls += 1;
        queueMicrotask(() => {
          ids.clear();
          chromeApi.runtime.lastError = null;
          callback();
        });
      },
      create(properties, callback) {
        queueMicrotask(() => {
          if (ids.has(properties.id)) {
            chromeApi.runtime.lastError = {
              message: `Cannot create item with duplicate id ${properties.id}`
            };
            callback();
            chromeApi.runtime.lastError = null;
            return;
          }

          ids.add(properties.id);
          createdIds.push(properties.id);
          chromeApi.runtime.lastError = null;
          callback();
        });
      }
    }
  };

  return {
    chromeApi,
    stats() {
      return {
        createdIds: [...createdIds],
        removeAllCalls
      };
    }
  };
}
