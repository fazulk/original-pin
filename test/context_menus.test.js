import assert from "node:assert/strict";
import test from "node:test";

import {
  MENU_RESTORE,
  MENU_SET,
  createContextMenuSetup,
  updateContextMenuVisibility
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
  assert.deepEqual(fake.stats().createdIds, [MENU_RESTORE, MENU_SET]);

  await ensureContextMenus();

  assert.equal(fake.stats().removeAllCalls, 1);
});

test("context menu visibility updates every menu item", async () => {
  const fake = createFakeChromeApi();
  const ensureContextMenus = createContextMenuSetup(fake.chromeApi);

  await ensureContextMenus();
  await updateContextMenuVisibility(fake.chromeApi, false);
  await updateContextMenuVisibility(fake.chromeApi, true);

  assert.deepEqual(fake.stats().updates, [
    [MENU_RESTORE, { visible: false }],
    [MENU_SET, { visible: false }],
    [MENU_RESTORE, { visible: true }],
    [MENU_SET, { visible: true }]
  ]);
});

function createFakeChromeApi() {
  const ids = new Set();
  const createdIds = [];
  const updates = [];
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
      },
      update(id, properties, callback) {
        queueMicrotask(() => {
          if (!ids.has(id)) {
            chromeApi.runtime.lastError = {
              message: `Cannot find menu item with id ${id}`
            };
            callback();
            chromeApi.runtime.lastError = null;
            return;
          }

          updates.push([id, { ...properties }]);
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
        removeAllCalls,
        updates: updates.map(([id, properties]) => [id, { ...properties }])
      };
    }
  };
}
