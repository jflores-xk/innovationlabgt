/* eslint-disable */
/* global WebImporter */
/**
 * Parser for color-trim. Base: color-trim (custom). Source: http://127.0.0.1:8765/bronco.html
 * Source DOM: details.trim[open?] > summary > h2 ; div.trim-body > div.tabs > button* (skipped)
 *   ; div.tab-panel#{trim}-{category} > h3.sr-only (skipped) + ul.swatch-grid > li.swatch
 *   > img + p.swatch-name ("Name*,** " + span.swatch-code "(CODE)").
 * xwalk container block (see blocks/color-trim/_color-trim.json + color-trim.js):
 *   block rows (1 cell): title | expanded (true/false)
 *   item rows (4 cells): category | image (+imageAlt collapsed) | swatchName | code
 */
const CATEGORY_KEYS = ['exterior', 'interior', 'upholstery', 'wheels'];

function resolveCategory(panel) {
  const id = (panel.id || '').toLowerCase();
  const suffix = id.includes('-') ? id.slice(id.lastIndexOf('-') + 1) : id;
  if (CATEGORY_KEYS.includes(suffix)) return suffix;
  // tolerate plural / alternate suffixes (e.g. "interiors", "upholsteries", "wheel")
  if (/^exterior/.test(suffix)) return 'exterior';
  if (/^interior/.test(suffix)) return 'interior';
  if (/^upholster/.test(suffix)) return 'upholstery';
  if (/^wheel/.test(suffix)) return 'wheels';
  // fallback: hidden panel heading text
  const label = (panel.querySelector('h3, h4')?.textContent || '').toLowerCase();
  if (label.includes('exterior')) return 'exterior';
  if (label.includes('interior')) return 'interior';
  if (label.includes('upholster')) return 'upholstery';
  if (label.includes('wheel')) return 'wheels';
  return 'exterior';
}

const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();

function hinted(document, field, content) {
  const frag = document.createDocumentFragment();
  frag.appendChild(document.createComment(` field:${field} `));
  frag.appendChild(typeof content === 'string' ? document.createTextNode(content) : content);
  return frag;
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

  // item rows: one per li.swatch across all tab panels (tabs buttons + sr-only headings skipped)
  const scopes = panels.length ? panels : [element];
  scopes.forEach((panel) => {
    const category = panels.length ? resolveCategory(panel) : 'exterior';
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
        hinted(document, 'category', category),
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
