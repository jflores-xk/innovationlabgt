// footer fragment sections, in document order
const SECTION_CLASSES = ['copyright', 'legal'];

/**
 * Fetches the footer fragment, trying in order: the AEM site root the page lives in
 * (e.g. /content/<site>/footer on the author / Universal Editor), /content (local preview),
 * then the site root (published EDS).
 * @returns {Promise<string|null>}
 */
async function fetchFooter() {
  const siteRoot = window.location.pathname.match(/^\/content\/[^/]+(?=\/)/)?.[0];
  const paths = [siteRoot && `${siteRoot}/footer.plain.html`, '/content/footer.plain.html', '/footer.plain.html']
    .filter((p, i, all) => p && all.indexOf(p) === i);
  // eslint-disable-next-line no-restricted-syntax
  for (const path of paths) {
    // eslint-disable-next-line no-await-in-loop
    const resp = await fetch(path);
    // eslint-disable-next-line no-await-in-loop
    if (resp.ok) return resp.text();
  }
  return null;
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const html = await fetchFooter();
  if (!html) return;

  const content = document.createElement('div');
  content.innerHTML = html;
  [...content.children].forEach((section, i) => {
    if (SECTION_CLASSES[i]) section.classList.add(`footer-${SECTION_CLASSES[i]}`);
  });

  const footer = document.createElement('div');
  footer.className = 'footer-bar';
  footer.append(...content.children);

  block.textContent = '';
  block.append(footer);
}
