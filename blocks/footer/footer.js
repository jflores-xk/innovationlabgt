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
  let resp = siteRoot ? await fetch(`${siteRoot}/footer.plain.html`) : null;
  if (!resp?.ok) resp = await fetch('/content/footer.plain.html');
  if (!resp.ok) resp = await fetch('/footer.plain.html');
  return resp.ok ? resp.text() : null;
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
