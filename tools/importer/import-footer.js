/* eslint-disable */
/* global WebImporter */

/**
 * Import script for the site footer fragment (content/footer.plain.html).
 * Source: reference footer page whose <main> holds one div per footer section
 * (copyright, legal links). Output is flat, semantic default content:
 * one section per source div, no classes/ids.
 */

// source section order: copyright, legal links
const SECTION_SELECTORS = ['.footer-copyright', '.footer-legal'];

export default {
  transform: (payload) => {
    const { document } = payload;
    const main = document.querySelector('main') || document.body;

    // section breaks between footer sections
    SECTION_SELECTORS.slice(1).forEach((sel) => {
      const el = main.querySelector(sel);
      if (el) el.before(document.createElement('hr'));
    });

    // strip wrapper attributes: the fragment must stay class/id free
    main.querySelectorAll('[class], [id]').forEach((el) => {
      el.removeAttribute('class');
      el.removeAttribute('id');
    });

    return [{ element: main, path: '/footer', report: { title: 'footer' } }];
  },
};
