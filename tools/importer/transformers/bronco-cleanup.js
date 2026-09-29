/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Ford Color & Trim (bronco) site-wide cleanup.
 * All selectors verified in migration-work/cleaned.html / source page:
 *   - header.site-header   (global brand bar + main nav, outside <main>)
 *   - footer.site-footer   (global copyright + legal links, outside <main>)
 *   - script               (inline tab-toggle script after footer)
 *   - link / noscript      (<link rel="stylesheet"> in head; safe removal)
 *   - .sr-only             (visually hidden h3 helpers inside .tab-panel; only
 *                           removed when left outside block tables after parsing,
 *                           so color-trim parser can still read them)
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Inline tab-toggle script (non-authorable) - remove before parsing
    WebImporter.DOMUtils.remove(element, ['script', 'noscript']);
  }

  if (hookName === TransformHook.afterTransform) {
    // Global chrome: header and footer
    WebImporter.DOMUtils.remove(element, [
      'header.site-header',
      'footer.site-footer',
      'script',
      'noscript',
      'link',
    ]);

    // Visually-hidden helper headings left outside block tables
    element.querySelectorAll('.sr-only').forEach((el) => {
      if (!el.closest('table')) el.remove();
    });
  }
}
