# trim-tab

One tab of a trim accordion panel. Purpose: color/upholstery/wheel/top/package swatch explorer.

## Content tree

```
Trim (section, model trim-section)      -> accordion panel: navy bar + collapsible body
  └─ Tab (trim-tab block)               -> one tab in the trim's tab row
       └─ Color (trim-color item)       -> one swatch in the tab's grid
```

Consecutive Trim sections stack as one accordion.

## Authoring

- **Trim section fields:** `trimTitle` (bar label), `trimExpanded` (open by default).
  A Trim section only accepts Tab blocks.
- **Tab block field:** `tabTitle`. The tabs of all Tab blocks in a Trim share one tab row,
  in content order.
- **Color item fields:** `image`, `imageAlt`, `swatchName`, `code`.

## Rendering

- `scripts/scripts.js` → `decorateTrimSection()` builds the bar and body for any section
  with a `trimTitle` in its section metadata (also re-run from `editor-support.js`).
- `trim-tab.js` renders the swatch grid, turns the block into a tab panel and rebuilds
  the shared tab row; it re-syncs when a Tab block is replaced or removed in Universal Editor.
- Selecting a Trim, Tab or Color in the Universal Editor content tree opens its trim and
  activates its tab.

## Supported variations

No variations.
