# Original Pin Chrome Web Store Listing Draft

## Store Listing

### Extension Name
Original Pin

### Summary
Return pinned tabs to the URL they were pinned with.

### Description
Original Pin remembers the URL a tab had when it became pinned, then gives you quick ways to return that pinned tab to its remembered original URL.

Use it when a pinned tab drifts away from the page you pinned it for. Restore the active pinned tab from the toolbar button, the page context menu, or the keyboard shortcut.

Features:
- Remember the original URL for each pinned tab.
- Restore the current pinned tab from the extension action.
- Restore or reset the remembered URL from the right-click page menu.
- Use Command+Shift+Y on macOS or Ctrl+Shift+Y on Windows/Linux.
- Store remembered tab data locally in Chrome.

### Category
Productivity

### Language
English

## Privacy

### Single Purpose
Original Pin remembers the URL a tab had when it became pinned and lets the user return that pinned tab to that original URL.

### Permission Justifications

#### contextMenus
Used to add right-click page menu actions for returning a pinned tab to its original URL or setting the current URL as the remembered original URL.

#### storage
Used to save pinned tab URL records locally in Chrome storage.

#### tabs
Used to detect pinned tabs, read their current URLs and titles, track URL changes for pinned tabs, and navigate a pinned tab back to its remembered original URL when the user requests it.

### Data Usage
Original Pin stores pinned tab URLs, current URLs, titles, and tab metadata locally in Chrome storage so it can restore pinned tabs. This data is not transmitted to any external server, sold, shared, or used for advertising.

### Remote Code
No. Original Pin does not execute remote code.

### Privacy Policy Draft
Original Pin stores pinned tab information locally in your browser so it can return pinned tabs to their remembered original URLs.

The extension may store pinned tab URLs, current URLs, tab titles, and basic tab metadata in Chrome local storage. This information stays on your device. Original Pin does not collect, transmit, sell, share, or use this data for advertising or analytics.

Original Pin does not use a remote server and does not execute remote code.

Suggested privacy policy URL after pushing `PRIVACY.md` to `main`:
https://github.com/fazulk/original-pin/blob/main/PRIVACY.md

## Review Notes

Original Pin is a Manifest V3 extension with a background service worker. It uses only local browser APIs and has no network backend. To test it:

1. Pin a tab.
2. Navigate that pinned tab to another URL.
3. Click the extension toolbar action, use the page context menu, or press Command+Shift+Y on macOS / Ctrl+Shift+Y on Windows/Linux.
4. Confirm the pinned tab returns to the URL it had when it was pinned.

The context menu also includes "Set current URL as original" for replacing the remembered URL.
