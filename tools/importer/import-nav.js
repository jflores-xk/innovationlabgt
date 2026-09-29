/* eslint-disable */
/* global WebImporter */

/**
 * Import script for the site navigation fragment (content/nav.plain.html).
 * Source: reference nav page whose <main> holds one div per nav section
 * (brand bar, brand, sections, tools). Output is flat, semantic default content:
 * one section per source div, no classes/ids, images from the public code bus.
 */

// source section order: brand bar, brand (logo + title), nav links, tools
// public origin serving the project code bus, where the nav images are committed
const IMAGE_ORIGIN = 'https://main--innovationlabgt--jflores-xk.aem.page';

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

    // images: public code bus URL (images/bronco/<file>), so AEM can ingest them on upload
    main.querySelectorAll('img').forEach((img) => {
      const file = (img.getAttribute('src') || '').split('?')[0].split('/').pop();
      if (file) img.setAttribute('src', `${IMAGE_ORIGIN}/images/bronco/${file}`);
    });

    return [{ element: main, path: '/nav', report: { title: 'nav' } }];
  },
};
