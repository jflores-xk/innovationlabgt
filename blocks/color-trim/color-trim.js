/*
 * Color Trim Block
 * One collapsible panel per vehicle trim, containing authorable tabs. Each tab
 * item starts a new tab; the swatch items that follow it render in that tab's
 * grid (image + name + code). Collapse pattern borrowed from the accordion block,
 * tab switching from tabs, and the swatch grid from cards.
 *
 * Authored rows (xwalk container block):
 *   block fields  -> single-cell rows: title, expanded (true/false)
 *   tab items     -> single-cell rows: tabTitle
 *   swatch items  -> multi-cell rows: image (+alt) | swatchName | code
 */

import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

// "expanded" as a class token (DA: "Color Trim (expanded)") opens the panel by default
const OPTION_CLASSES = ['expanded'];

// label for swatches authored before the first tab item
const DEFAULT_TAB_LABEL = 'Colors';

const FLAG = /^(true|false|yes|no)$/i;

let blockCount = 0;
let editorListenerAttached = false;

const textOf = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');

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
  const imageCell = cells.find((c) => c.querySelector('picture, img'))
    || (cells.length > 2 ? cells[0] : null);
  const [nameCell, codeCell] = cells.filter((c) => c !== imageCell);

  let name = textOf(nameCell);
  let code = textOf(codeCell).replace(/^\((.*)\)$/, '$1').trim();
  if (!code) {
    // tolerate "Name (CODE)" authored in a single cell
    const m = name.match(/^(.*?)\s*\(([^()]+)\)$/);
    if (m) [, name, code] = m;
  }

  return {
    row,
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
 * In Universal Editor, selecting a tab or swatch in the content tree should reveal it:
 * expand its trim panel and activate its tab (or the tab itself when a tab is selected).
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
    if (el.getAttribute('role') === 'tab') {
      el.click();
      return;
    }
    const panel = el.closest('[role="tabpanel"]');
    if (panel) document.getElementById(panel.getAttribute('aria-labelledby'))?.click();
  });
}

export default function decorate(block) {
  blockCount += 1;
  const id = `color-trim-${blockCount}`;
  const active = [...block.classList].filter((c) => OPTION_CLASSES.includes(c));

  // leading single-cell rows are the block fields (title, expanded flag); any later
  // single-cell row is a tab item that starts a new group of swatches
  const rows = [...block.children];
  let titleRow;
  let flagRow;
  const groups = [];
  rows.forEach((row, index) => {
    if (isItemRow(row)) {
      if (!groups.length) groups.push({ tabRow: null, label: DEFAULT_TAB_LABEL, items: [] });
      groups[groups.length - 1].items.push(parseItem(row));
    } else if (index < 2 && !flagRow && FLAG.test(textOf(row))) {
      flagRow = row;
    } else if (index === 0) {
      titleRow = row;
    } else {
      groups.push({ tabRow: row, label: textOf(row), items: [] });
    }
  });

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

  if (groups.length) {
    const tablist = document.createElement('div');
    tablist.className = 'color-trim-tabs';
    tablist.setAttribute('role', 'tablist');
    const titleText = textOf(title);
    if (titleText) tablist.setAttribute('aria-label', `${titleText} options`);

    const tabs = [];
    const panels = [];
    groups.forEach(({ tabRow, label, items: groupItems }, i) => {
      const tabId = `${id}-tab-${i + 1}`;
      const panelId = `${id}-panel-${i + 1}`;

      const tab = document.createElement('button');
      tab.type = 'button';
      tab.className = 'color-trim-tab';
      tab.id = tabId;
      if (tabRow) {
        // tab item instrumentation on the button, the tabTitle prop on its label
        const cell = tabRow.firstElementChild || tabRow;
        const tabLabel = document.createElement('span');
        tabLabel.className = 'color-trim-tab-label';
        tabLabel.textContent = label;
        moveInstrumentation(tabRow, tab);
        moveCellInstrumentation(cell, tabLabel);
        tab.append(tabLabel);
      } else {
        tab.textContent = label;
      }
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
