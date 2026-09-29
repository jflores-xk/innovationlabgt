/* eslint-disable */
/* global WebImporter */
/**
 * Parser for color-trim. Base: color-trim (custom). Source: http://127.0.0.1:8765/bronco.html
 * Source DOM: details.trim[open?] > summary > h2 ; div.trim-body > div.tabs > button[data-tab]
 *   ; div.tab-panel#{trim}-{category} > h3.sr-only (skipped) + ul.swatch-grid > li.swatch
 *   > img + p.swatch-name ("Name*,** " + span.swatch-code "(CODE)").
 * xwalk container block (see blocks/color-trim/_color-trim.json + color-trim.js):
 *   block rows (1 cell): title | expanded (true/false)
 *   tab item rows (1 cell): tabTitle — starts a new tab
 *   swatch item rows (3 cells): image (+imageAlt collapsed) | swatchName | code
 */
const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();

function hinted(document, field, content) {
  const frag = document.createDocumentFragment();
  frag.appendChild(document.createComment(` field:${field} `));
  frag.appendChild(typeof content === 'string' ? document.createTextNode(content) : content);
  return frag;
}

/** tab label for a panel: its tab button text, falling back to the hidden panel heading */
function tabLabel(element, panel) {
  const button = panel.id
    ? element.querySelector(`[role="tab"][data-tab="${panel.id}"], [role="tab"][aria-controls="${panel.id}"]`)
    : null;
  return clean(button?.textContent) || clean(panel.querySelector('h3, h4')?.textContent);
}

export default function parse(element, { document }) {
  const titleEl = element.querySelector(':scope > summary h2, :scope > summary h3, :scope > summary');
  const title = clean(titleEl?.textContent);
  const expanded = element.hasAttribute('open') ? 'true' : 'false';

  const panels = Array.from(element.querySelectorAll('.tab-panel'));

  const cells = [];
  // block field rows
  cells.push([title ? hinted(document, 'title', title) : '']);
  cells.push([hinted(document, 'expanded', expanded)]);

  // one tab item per panel, followed by that panel's swatch items
  // (tab buttons and sr-only headings are not emitted as content)
  const scopes = panels.length ? panels : [element];
  scopes.forEach((panel) => {
    const label = panels.length ? tabLabel(element, panel) : '';
    if (label) cells.push([hinted(document, 'tabTitle', label)]);

    panel.querySelectorAll('li.swatch').forEach((swatch) => {
      const img = swatch.querySelector('img');
      const nameEl = swatch.querySelector('.swatch-name');
      const codeEl = swatch.querySelector('.swatch-code');

      let name = '';
      if (nameEl) {
        const copy = nameEl.cloneNode(true);
        copy.querySelectorAll('.swatch-code').forEach((c) => c.remove());
        name = clean(copy.textContent);
      }
      const code = clean(codeEl?.textContent).replace(/^\((.*)\)$/, '$1').trim();

      cells.push([
        img ? hinted(document, 'image', img) : '',
        name ? hinted(document, 'swatchName', name) : '',
        code ? hinted(document, 'code', code) : '',
      ]);
    });
  });

  if (!title && cells.length === 2) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'color-trim', cells });
  element.replaceWith(block);
}
