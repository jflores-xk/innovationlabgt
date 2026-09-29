/*
 * Trim Tab Block
 * One tab of a trim accordion panel (a trim section). The block renders its color
 * items as a swatch grid (image + name + code) and becomes a tab panel; the tabs of
 * all trim-tab blocks in a section share one tab row.
 *
 * Authored rows (xwalk container block):
 *   block field  -> single-cell row: tabName
 *   color items  -> multi-cell rows: image (+alt) | swatchName | code
 */

import { createOptimizedPicture } from '../../scripts/aem.js';
import { decorateTrimSection, moveInstrumentation } from '../../scripts/scripts.js';

let tabCount = 0;
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

function buildSwatch(row) {
  const cells = [...row.children];
  const imageCell = cells.find((c) => c.querySelector('picture, img'))
    || (cells.length > 2 ? cells[0] : null);
  const [nameCell, codeCell] = cells.filter((c) => c !== imageCell);
  const img = imageCell?.querySelector('img');

  let name = textOf(nameCell);
  let code = textOf(codeCell).replace(/^\((.*)\)$/, '$1').trim();
  if (!code) {
    // tolerate "Name (CODE)" authored in a single cell
    const m = name.match(/^(.*?)\s*\(([^()]+)\)$/);
    if (m) [, name, code] = m;
  }

  const li = document.createElement('li');
  li.className = 'trim-tab-swatch';
  moveInstrumentation(row, li);

  const media = document.createElement('div');
  media.className = 'trim-tab-swatch-image';
  if (img) {
    const picture = createOptimizedPicture(img.src, img.alt || name, false, [{ width: '400' }]);
    moveInstrumentation(img, picture.querySelector('img'));
    media.append(picture);
  }

  const label = document.createElement('p');
  label.className = 'trim-tab-swatch-label';
  const nameEl = document.createElement('strong');
  nameEl.className = 'trim-tab-swatch-name';
  nameEl.textContent = name;
  moveCellInstrumentation(nameCell, nameEl);
  label.append(nameEl);

  if (code) {
    const codeEl = document.createElement('span');
    codeEl.className = 'trim-tab-swatch-code';
    codeEl.textContent = `(${code})`;
    moveCellInstrumentation(codeCell, codeEl);
    label.append(' ', codeEl);
  }

  li.append(media, label);
  return li;
}

function selectTab(tablist, panel, focus = false) {
  [...tablist.children].forEach((tab) => {
    const selected = tab.getAttribute('aria-controls') === panel.id;
    tab.setAttribute('aria-selected', selected);
    tab.tabIndex = selected ? 0 : -1;
    const target = document.getElementById(tab.getAttribute('aria-controls'));
    if (target) target.hidden = !selected;
    if (selected && focus) tab.focus();
  });
  tablist.dataset.selected = panel.id;
}

function getTablist(container) {
  let tablist = container.querySelector('.trim-tab-list');
  if (tablist) return tablist;

  tablist = document.createElement('div');
  tablist.className = 'trim-tab-list';
  tablist.setAttribute('role', 'tablist');
  const title = textOf(container.closest('.trim-section')?.querySelector('.trim-section-title'));
  if (title) tablist.setAttribute('aria-label', `${title} options`);
  container.querySelector('.trim-tab-wrapper')?.before(tablist);

  // roving tabindex keyboard support
  tablist.addEventListener('keydown', (e) => {
    const tabs = [...tablist.children];
    const current = tabs.indexOf(document.activeElement);
    if (current === -1) return;
    let next;
    if (e.key === 'ArrowRight') next = (current + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') next = (current - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabs.length - 1;
    else return;
    e.preventDefault();
    const panel = document.getElementById(tabs[next].getAttribute('aria-controls'));
    if (panel) selectTab(tablist, panel, true);
  });
  return tablist;
}

/** rebuild the shared tab row from the decorated trim-tab panels in DOM order */
function syncTabs(container) {
  const tablist = getTablist(container);
  const panels = [...container.querySelectorAll('.trim-tab.block[role="tabpanel"]')];
  tablist.replaceChildren(...panels.map((panel) => {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'trim-tab-button';
    tab.id = `${panel.id}-tab`;
    tab.textContent = panel.dataset.tabName;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', panel.id);
    tab.addEventListener('click', () => selectTab(tablist, panel));
    panel.setAttribute('aria-labelledby', tab.id);
    return tab;
  }));
  tablist.hidden = !panels.length;
  if (!panels.length) return;
  const selected = panels.find((p) => p.id === tablist.dataset.selected) || panels[0];
  selectTab(tablist, selected);
}

/** re-sync when Universal Editor replaces or removes a trim-tab block */
function observeTabs(container) {
  if (container.dataset.trimTabsObserved) return;
  container.dataset.trimTabsObserved = 'true';
  new MutationObserver((mutations) => {
    const removed = mutations.some((m) => [...m.removedNodes]
      .some((n) => n.nodeType === 1 && (n.matches('.trim-tab, .trim-tab-wrapper') || n.querySelector('.trim-tab'))));
    if (removed) syncTabs(container);
  }).observe(container, { childList: true, subtree: true });
}

/**
 * In Universal Editor, selecting a trim, tab or color in the content tree should
 * reveal it: open its trim panel and activate its tab.
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
    const section = el?.closest('.trim-section');
    if (!section) return;
    const toggle = section.querySelector('.trim-section-toggle');
    if (toggle?.getAttribute('aria-expanded') !== 'true') toggle?.click();
    const panel = el.closest('.trim-tab.block');
    const tablist = panel && section.querySelector('.trim-tab-list');
    if (tablist) selectTab(tablist, panel);
  });
}

export default function decorate(block) {
  tabCount += 1;
  const rows = [...block.children];
  const titleRow = rows.find((r) => !isItemRow(r));

  const grid = document.createElement('ul');
  grid.className = 'trim-tab-grid';
  rows.filter(isItemRow).forEach((row) => grid.append(buildSwatch(row)));

  block.id = `trim-tab-${tabCount}`;
  block.dataset.tabName = textOf(titleRow);
  block.setAttribute('role', 'tabpanel');
  block.tabIndex = 0;
  block.replaceChildren(grid);

  const section = block.closest('.section');
  if (section) {
    decorateTrimSection(section);
    const container = section.querySelector('.trim-section-body') || section;
    syncTabs(container);
    observeTabs(container);
  }

  if (block.dataset.aueResource) attachEditorSelection();
}
