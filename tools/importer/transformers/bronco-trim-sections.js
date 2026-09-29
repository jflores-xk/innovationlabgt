/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Ford Color & Trim (bronco) trim sections.
 * Each source trim (section.trims > details.trim) becomes its own section — an
 * accordion panel in the "trim-section" model — holding the trim-tab blocks the
 * parser produced from its tab panels:
 *   <hr> (except the first trim, which follows the section break before section.trims)
 *   trim-tab blocks
 *   Section Metadata: blockModelId=trim-section, trimTitle, trimExpanded
 * Runs in afterTransform, once parsers have replaced the tab panels with blocks.
 */
const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();

export default function transform(hookName, element, payload) {
  if (hookName !== 'afterTransform') return;

  const document = (payload && payload.document) || element.ownerDocument;
  const trims = [...element.querySelectorAll('details.trim')];

  trims.forEach((trim, index) => {
    const titleEl = trim.querySelector(':scope > summary h2, :scope > summary h3, :scope > summary');
    const trimTitle = clean(titleEl?.textContent);
    const trimExpanded = trim.hasAttribute('open') ? 'true' : 'false';
    const blocks = [...trim.querySelectorAll('table')].filter((t) => !t.parentElement.closest('table'));

    const nodes = [];
    if (index > 0) nodes.push(document.createElement('hr'));
    nodes.push(...blocks);
    nodes.push(WebImporter.Blocks.createBlock(document, {
      name: 'Section Metadata',
      cells: { blockModelId: 'trim-section', trimTitle, trimExpanded },
    }));
    trim.replaceWith(...nodes);
  });
}
