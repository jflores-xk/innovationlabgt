/* eslint-disable */
/* global WebImporter */
/**
 * Parser for trim-tab. Base: trim-tab (custom). Source: http://127.0.0.1:8765/bronco.html
 * Source DOM: details.trim > div.trim-body > div.tabs > button[data-tab] (tab labels)
 *   ; div.tab-panel#{trim}-{category} > h3.sr-only (skipped) + ul.swatch-grid > li.swatch
 *   > img + p.swatch-name ("Name*,** " + span.swatch-code "(CODE)").
 * One block per tab panel; the trim itself becomes a section (bronco-trim-sections transformer).
 * xwalk container block (see blocks/trim-tab/_trim-tab.json + trim-tab.js):
 *   block row (1 cell): tabTitle
 *   color item rows (3 cells): image (+imageAlt collapsed) | swatchName | code
 */
const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();

function hinted(document, field, content) {
  const frag = document.createDocumentFragment();
  frag.appendChild(document.createComment(` field:${field} `));
  frag.appendChild(typeof content === 'string' ? document.createTextNode(content) : content);
  return frag;
}

/** tab label for a panel: its tab button text, falling back to the hidden panel heading */
function tabLabel(panel) {
  const trim = panel.closest('details.trim') || panel.ownerDocument;
  const button = panel.id
    ? trim.querySelector(`[role="tab"][data-tab="${panel.id}"], [role="tab"][aria-controls="${panel.id}"]`)
    : null;
  return clean(button?.textContent) || clean(panel.querySelector('h3, h4')?.textContent);
}

export default function parse(element, { document }) {
  const title = tabLabel(element);
  const cells = [[title ? hinted(document, 'tabTitle', title) : '']];

  element.querySelectorAll('li.swatch').forEach((swatch) => {
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

  if (!title && cells.length === 1) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'trim-tab', cells });
  element.replaceWith(block);
}
