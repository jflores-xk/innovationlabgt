/*
 * Color Trim Block
 * One collapsible panel per vehicle trim. Child swatch rows are grouped by
 * category into tabs, each tab rendering a grid of swatches (image + name + code).
 * Collapse pattern borrowed from the accordion block, category switching from tabs,
 * and the swatch grid from cards.
 *
 * Authored rows (xwalk container block):
 *   block fields  -> single-cell rows: title, expanded (true/false)
 *   swatch items  -> multi-cell rows: category | image (+alt) | swatchName | code
 */

import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

// "expanded" as a class token (DA: "Color Trim (expanded)") opens the panel by default
const OPTION_CLASSES = ['expanded'];

// fixed tab order; empty categories are skipped
const CATEGORIES = [
  { key: 'exterior', label: 'Exterior Colors', match: /^exterior/ },
  { key: 'interior', label: 'Interiors', match: /^interior/ },
  { key: 'upholstery', label: 'Upholsteries', match: /^upholster/ },
  { key: 'wheels', label: 'Wheels', match: /^wheel/ },
];

const FLAG = /^(true|false|yes|no)$/i;

let blockCount = 0;
let editorListenerAttached = false;

const textOf = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');

function resolveCategory(value) {
  const v = (value || '').toLowerCase();
  if (!v) return null;
  return CATEGORIES.find((c) => c.match.test(v)) || null;
}

function isItemRow(row) {
  return row.children.length > 1 || !!row.querySelector('picture, img');
}

/** move instrumentation from a cell (and its instrumented descendants) onto a target */
function moveCellInstrumentation(cell, target) {
  if (!cell || !target) return;
  moveInstrumentation(cell, target);
  cell.querySelectorAll('[data-aue-prop], [data-richtext-prop]').forEach((el) => {
    moveInstrumentation(el, target);
  });
}

function parseItem(row) {
  const cells = [...row.children];
  const imageCell = cells.find((c) => c.querySelector('picture, img'));
  const textCells = cells.filter((c) => c !== imageCell);

  // xwalk renders every field as a cell, so category is positional when all cells exist;
  // otherwise look for the cell whose value is a known category
  const categoryCell = textCells.length >= 3
    ? textCells[0]
    : textCells.find((c) => resolveCategory(textOf(c)));
  const [nameCell, codeCell] = textCells.filter((c) => c !== categoryCell);

  let name = textOf(nameCell);
  let code = textOf(codeCell).replace(/^\((.*)\)$/, '$1').trim();
  if (!code) {
    // tolerate "Name (CODE)" authored in a single cell
    const m = name.match(/^(.*?)\s*\(([^()]+)\)$/);
    if (m) [, name, code] = m;
  }

  return {
    row,
    category: resolveCategory(textOf(categoryCell)) || CATEGORIES[0],
    img: imageCell?.querySelector('img') || null,
    name,
    code,
    nameCell,
    codeCell,
  };
}

function buildSwatch(item) {
  const li = document.createElement('li');
  li.className = 'color-trim-swatch';
  moveInstrumentation(item.row, li);

  const media = document.createElement('div');
  media.className = 'color-trim-swatch-image';
  if (item.img) {
    const picture = createOptimizedPicture(item.img.src, item.img.alt || item.name, false, [{ width: '400' }]);
    moveInstrumentation(item.img, picture.querySelector('img'));
    media.append(picture);
  }

  const label = document.createElement('p');
  label.className = 'color-trim-swatch-label';
  const nameEl = document.createElement('strong');
  nameEl.className = 'color-trim-swatch-name';
  nameEl.textContent = item.name;
  moveCellInstrumentation(item.nameCell, nameEl);
  label.append(nameEl);

  if (item.code) {
    const codeEl = document.createElement('span');
    codeEl.className = 'color-trim-swatch-code';
    codeEl.textContent = `(${item.code})`;
    moveCellInstrumentation(item.codeCell, codeEl);
    label.append(' ', codeEl);
  }

  li.append(media, label);
  return li;
}

function selectTab(tabs, panels, index, focus = false) {
  tabs.forEach((tab, i) => {
    const selected = i === index;
    tab.setAttribute('aria-selected', selected);
    tab.tabIndex = selected ? 0 : -1;
    panels[i].hidden = !selected;
  });
  if (focus) tabs[index].focus();
}

function setExpanded(toggle, body, expanded) {
  toggle.setAttribute('aria-expanded', expanded);
  body.hidden = !expanded;
}

/**
 * In Universal Editor, selecting a swatch in the content tree should reveal it:
 * expand its trim panel and activate its category tab.
 */
function attachEditorSelection() {
  if (editorListenerAttached) return;
  const main = document.querySelector('main');
  if (!main) return;
  editorListenerAttached = true;
  main.addEventListener('aue:ui-select', (event) => {
    const resource = event.detail?.resource;
    if (!resource) return;
    const el = document.querySelector(`[data-aue-resource="${resource}"]`);
    const block = el?.closest('.color-trim');
    if (!block) return;
    const toggle = block.querySelector('.color-trim-toggle');
    const body = block.querySelector('.color-trim-body');
    if (toggle && body) setExpanded(toggle, body, true);
    const panel = el.closest('[role="tabpanel"]');
    if (panel) document.getElementById(panel.getAttribute('aria-labelledby'))?.click();
  });
}

export default function decorate(block) {
  blockCount += 1;
  const id = `color-trim-${blockCount}`;
  const active = [...block.classList].filter((c) => OPTION_CLASSES.includes(c));

  const rows = [...block.children];
  const configRows = rows.filter((r) => !isItemRow(r));
  const items = rows.filter(isItemRow).map(parseItem);

  const titleRow = configRows.find((r) => !FLAG.test(textOf(r)));
  const flagRow = configRows.find((r) => r !== titleRow && FLAG.test(textOf(r)));
  const expanded = active.includes('expanded') || /^(true|yes)$/i.test(textOf(flagRow));

  // --- collapsible header (h2 > button) ---
  const heading = document.createElement('h2');
  heading.className = 'color-trim-heading';

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'color-trim-toggle';
  toggle.id = `${id}-toggle`;
  toggle.setAttribute('aria-controls', `${id}-body`);

  const title = document.createElement('span');
  title.className = 'color-trim-title';
  if (titleRow) {
    const cell = titleRow.firstElementChild || titleRow;
    const source = cell.querySelector('h1, h2, h3, h4, h5, h6, p') || cell;
    moveCellInstrumentation(cell, title);
    title.append(...source.childNodes);
  }

  const chevron = document.createElement('span');
  chevron.className = 'color-trim-chevron';
  chevron.setAttribute('aria-hidden', 'true');

  toggle.append(title, chevron);
  heading.append(toggle);

  // --- collapsible body ---
  const body = document.createElement('div');
  body.className = 'color-trim-body';
  body.id = `${id}-body`;
  body.setAttribute('role', 'region');
  body.setAttribute('aria-labelledby', toggle.id);

  const groups = CATEGORIES
    .map((category) => ({ category, items: items.filter((it) => it.category === category) }))
    .filter((g) => g.items.length);

  if (groups.length) {
    const tablist = document.createElement('div');
    tablist.className = 'color-trim-tabs';
    tablist.setAttribute('role', 'tablist');
    const titleText = textOf(title);
    if (titleText) tablist.setAttribute('aria-label', `${titleText} categories`);

    const tabs = [];
    const panels = [];
    groups.forEach(({ category, items: groupItems }, i) => {
      const tabId = `${id}-tab-${category.key}`;
      const panelId = `${id}-panel-${category.key}`;

      const tab = document.createElement('button');
      tab.type = 'button';
      tab.className = 'color-trim-tab';
      tab.id = tabId;
      tab.textContent = category.label;
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-controls', panelId);
      tab.addEventListener('click', () => selectTab(tabs, panels, i));

      const panel = document.createElement('div');
      panel.className = 'color-trim-panel';
      panel.id = panelId;
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', tabId);
      panel.tabIndex = 0;

      const grid = document.createElement('ul');
      grid.className = 'color-trim-grid';
      groupItems.forEach((item) => grid.append(buildSwatch(item)));
      panel.append(grid);

      tabs.push(tab);
      panels.push(panel);
      tablist.append(tab);
    });

    // roving tabindex keyboard support
    tablist.addEventListener('keydown', (e) => {
      const current = tabs.indexOf(document.activeElement);
      if (current === -1) return;
      let next;
      if (e.key === 'ArrowRight') next = (current + 1) % tabs.length;
      else if (e.key === 'ArrowLeft') next = (current - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = tabs.length - 1;
      else return;
      e.preventDefault();
      selectTab(tabs, panels, next, true);
    });

    selectTab(tabs, panels, 0);
    body.append(tablist, ...panels);
  }

  setExpanded(toggle, body, expanded);
  toggle.addEventListener('click', () => {
    setExpanded(toggle, body, toggle.getAttribute('aria-expanded') !== 'true');
  });

  block.replaceChildren(heading, body);

  if (block.dataset.aueResource) attachEditorSelection();
}
