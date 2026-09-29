// media query match that indicates desktop width
const isDesktop = window.matchMedia('(width >= 900px)');

// nav fragment sections, in document order
const SECTION_CLASSES = ['brandbar', 'brand', 'sections', 'tools'];

/**
 * Fetches the nav fragment, trying in order: the AEM site root the page lives in
 * (e.g. /content/<site>/nav on the author / Universal Editor), /content (local preview),
 * then the site root (published EDS).
 * @returns {Promise<{html: string, base: string}|null>}
 */
async function fetchNav() {
  const siteRoot = window.location.pathname.match(/^\/content\/[^/]+(?=\/)/)?.[0];
  const paths = [siteRoot && `${siteRoot}/nav.plain.html`, '/content/nav.plain.html', '/nav.plain.html']
    .filter((p, i, all) => p && all.indexOf(p) === i);
  // eslint-disable-next-line no-restricted-syntax
  for (const path of paths) {
    // eslint-disable-next-line no-await-in-loop
    const resp = await fetch(path);
    // eslint-disable-next-line no-await-in-loop
    if (resp.ok) return { html: await resp.text(), base: resp.url };
  }
  return null;
}

/**
 * Parses the fragment and resolves relative media paths against the fragment URL,
 * so images work whatever page the header is rendered on.
 */
function parseNav(html, base) {
  const container = document.createElement('div');
  container.innerHTML = html;
  container.querySelectorAll('img[src], source[srcset]').forEach((el) => {
    const attr = el.hasAttribute('src') ? 'src' : 'srcset';
    const value = el.getAttribute(attr);
    if (!/^([a-z]+:|\/)/i.test(value)) el.setAttribute(attr, new URL(value, base).pathname);
  });
  return container;
}

/** marks list items whose link is wrapped in <strong> as the current item */
function decorateCurrentItems(section) {
  section.querySelectorAll('li').forEach((li) => {
    const strong = li.querySelector(':scope > strong');
    const link = li.querySelector('a');
    if (strong && link) {
      li.classList.add('active');
      link.setAttribute('aria-current', 'true');
    }
  });
}

/** authored emphasis (<em><a>) marks an accent link: move it onto the link as a class */
function decorateAccentLinks(list) {
  list.querySelectorAll('li > em, li > strong').forEach((wrapper) => {
    const link = wrapper.querySelector(':scope > a');
    if (!link) return;
    link.classList.add(wrapper.tagName === 'EM' ? 'nav-accent' : 'nav-strong');
    wrapper.replaceWith(link);
  });
}

/** wraps the brand link's text in a title span next to the logo */
function decorateBrand(section) {
  const link = section.querySelector('a');
  if (!link) return;
  const text = [...link.childNodes]
    .filter((n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim());
  if (text.length) {
    const title = document.createElement('span');
    title.className = 'nav-brand-title';
    text[0].before(title);
    title.append(...text);
  }
  const img = link.querySelector('img');
  if (img && !link.getAttribute('aria-label')) {
    link.setAttribute('aria-label', link.textContent.trim() || img.alt);
  }
}

/**
 * Toggles the mobile menu
 * @param {Element} nav The nav element
 * @param {Boolean|null} forceExpanded Optional state to force
 */
function toggleMenu(nav, forceExpanded = null) {
  const expanded = forceExpanded !== null ? forceExpanded : nav.getAttribute('aria-expanded') !== 'true';
  const button = nav.querySelector('.nav-hamburger button');
  const open = expanded && !isDesktop.matches;
  nav.setAttribute('aria-expanded', open ? 'true' : 'false');
  if (button) {
    button.setAttribute('aria-expanded', open ? 'true' : 'false');
    button.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  }
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const fragment = await fetchNav();
  if (!fragment) return;
  const content = parseNav(fragment.html, fragment.base);

  block.textContent = '';
  const sections = [...content.children];
  sections.forEach((section, i) => {
    if (SECTION_CLASSES[i]) section.classList.add(`nav-${SECTION_CLASSES[i]}`);
  });

  const brandbar = content.querySelector('.nav-brandbar');
  const brand = content.querySelector('.nav-brand');
  if (brandbar) decorateCurrentItems(brandbar);
  if (brand) decorateBrand(brand);

  // link sections render as lists directly inside the nav
  const lists = ['sections', 'tools'].map((name) => {
    const list = content.querySelector(`.nav-${name}`)?.querySelector('ul');
    if (list) {
      list.classList.add(`nav-${name}`);
      decorateAccentLinks(list);
    }
    return list;
  });

  // main row: brand | sections | tools
  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.className = 'nav-main';
  nav.setAttribute('aria-label', 'Main');
  // hamburger (mobile only) toggles sections + tools; sits after the brand so it
  // stays on the brand row and comes before the links in keyboard order
  const hamburger = document.createElement('div');
  hamburger.className = 'nav-hamburger';
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-expanded="false" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  hamburger.querySelector('button').addEventListener('click', () => toggleMenu(nav));
  nav.append(...[brand, hamburger, ...lists].filter(Boolean));
  nav.setAttribute('aria-expanded', 'false');

  // close the mobile menu on Escape and when resizing to desktop
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Escape' && nav.getAttribute('aria-expanded') === 'true') {
      toggleMenu(nav, false);
      hamburger.querySelector('button').focus();
    }
  });
  isDesktop.addEventListener('change', () => toggleMenu(nav, false));

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(...[brandbar, nav].filter(Boolean));
  block.append(navWrapper);
}
