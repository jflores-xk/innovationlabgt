/* eslint-disable */
/* global WebImporter */

/**
 * Import script for the site navigation fragment (content/nav.plain.html).
 * Source: reference nav page whose <main> holds one div per nav section
 * (brand bar, brand, sections, tools). Output is flat, semantic default content:
 * one section per source div, no classes/ids, images as relative images/<file>.
 */

// source section order: brand bar, brand (logo + title), nav links, tools
const SECTION_SELECTORS = ['.nav-brandbar', '.nav-brand', '.nav-sections', '.nav-tools'];

export default {
  transform: (payload) => {
    const { document } = payload;
    const main = document.querySelector('main') || document.body;

    // section breaks between nav sections
    SECTION_SELECTORS.slice(1).forEach((sel) => {
      const el = main.querySelector(sel);
      if (el) el.before(document.createElement('hr'));
    });

    // strip wrapper attributes: the fragment must stay class/id free
    main.querySelectorAll('[class], [id]').forEach((el) => {
      el.removeAttribute('class');
      el.removeAttribute('id');
    });

    // images: relative to the fragment (content/images/<file>)
    main.querySelectorAll('img').forEach((img) => {
      const file = (img.getAttribute('src') || '').split('?')[0].split('/').pop();
      if (file) img.setAttribute('src', `images/${file}`);
    });

    return [{ element: main, path: '/nav', report: { title: 'nav' } }];
  },
};
