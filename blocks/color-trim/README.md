# color-trim

Custom **accordion** block. Purpose: trim color/upholstery/wheel swatch explorer.
One collapsible panel per vehicle trim, containing authorable tabs of swatches.

## Authoring

Model: `collection`

- **Block fields:** `title` (trim name shown on the bar), `expanded` (open by default).
- **Tab items:** `tabTitle`. Each tab item starts a new tab.
- **Swatch items:** `image`, `imageAlt`, `swatchName`, `code`. A swatch belongs to the
  nearest tab item above it. Swatches added before any tab go into a "Colors" tab.

Add, rename, reorder or remove tab items to change the tabs; move swatches between
tab items to regroup them. A tab with no swatches shows an empty panel.

## Supported variations

No variations.

## Universal Editor

- The container filter allows `color-trim-tab` and `color-trim-swatch` items.
- Tab titles are editable inline on the tab button.
- Selecting a tab or swatch in the content tree opens its trim and activates its tab.
