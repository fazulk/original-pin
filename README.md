# Original Pin

Original Pin is a Manifest V3 Chrome extension that remembers the URL a tab had when it became pinned and lets you return that pinned tab to the remembered URL.

Chrome extensions cannot observe `Command`/`Control` + clicks on Chrome's own tab strip, so this extension uses Chrome-supported triggers instead:

- `Command+Shift+Y` on macOS, or `Ctrl+Shift+Y` on Windows/Linux, restores the currently active pinned tab.
- Click the extension action while a pinned tab is active.
- Context menu entries are registered for page right-click menus.

The extension also provides context menu actions to set or forget the saved original URL when the browser exposes those menu entries.

## Local Development

Run checks:

```sh
npm test
npm run check
```

Load the repository folder as an unpacked extension from `chrome://extensions`. For automated local testing, use Chrome for Testing or Chromium; current stable Google Chrome branded builds no longer load unpacked extensions through `--load-extension`.
