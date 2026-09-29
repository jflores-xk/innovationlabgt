/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroVehicleParser from './parsers/hero-vehicle.js';
import colorTrimParser from './parsers/color-trim.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/bronco-cleanup.js';
import sectionsTransformer from './transformers/bronco-sections.js';

// PARSER REGISTRY
const parsers = {
  'hero-vehicle': heroVehicleParser,
  'color-trim': colorTrimParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'bronco',
  description: '2026 Bronco Color & Trim page: vehicle hero plus per-trim color/interior/upholstery/wheel swatch explorers',
  urls: [
    'http://127.0.0.1:8765/bronco.html',
  ],
  blocks: [
    {
      name: 'hero-vehicle',
      instances: ['section.vehicle-hero'],
    },
    {
      name: 'color-trim',
      instances: ['section.trims > details.trim'],
    },
  ],
  sections: [
    {
      id: 'rc1',
      name: 'Vehicle Hero',
      selector: ['section.vehicle-hero'],
      style: null,
      blocks: ['hero-vehicle'],
      defaultContent: [],
    },
    {
      id: 'rc2',
      name: 'Trims',
      selector: ['section.trims'],
      style: null,
      blocks: ['color-trim'],
      defaultContent: ['section.trims > div.availability', 'section.trims > div.disclaimer'],
    },
  ],
};

// TRANSFORMER REGISTRY - section transformer runs after cleanup
const transformers = [
  cleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
];

/**
 * Execute all page transformers for a specific hook
 * @param {string} hookName - 'beforeTransform' or 'afterTransform'
 * @param {Element} element - The DOM element to transform
 * @param {Object} payload - { document, url, html, params }
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = {
    ...payload,
    template: PAGE_TEMPLATE,
  };

  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all blocks on the page based on the embedded template configuration
 * @param {Document} document - The DOM document
 * @param {Object} template - The embedded PAGE_TEMPLATE object
 * @returns {Array} Block instances found on the page
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];

  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        pageBlocks.push({
          name: blockDef.name,
          selector,
          element,
          section: blockDef.section || null,
        });
      });
    });
  });

  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

/**
 * The source is a temporary reference server; its images are mirrored in the
 * project under /images/bronco/, so strip the source origin to keep them
 * root-relative (served from the project code bus).
 * @param {Element} main - The main element
 * @param {string} originalURL - The source page URL
 */
function localizeImageUrls(main, originalURL) {
  const { origin } = new URL(originalURL);
  main.querySelectorAll('img').forEach((img) => {
    const src = img.getAttribute('src');
    if (src && src.startsWith(`${origin}/images/bronco/`)) {
      img.setAttribute('src', src.substring(origin.length));
    }
  });
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;

    const main = document.body;

    // 1. Initial cleanup + section breaks
    executeTransformers('beforeTransform', main, payload);

    // 2. Find blocks on page
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block (skip elements already replaced by an earlier parser)
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 4. Final cleanup + section metadata
    executeTransformers('afterTransform', main, payload);

    // 5. WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
    localizeImageUrls(main, params.originalURL);

    // 6. Sanitized path (root URL maps to /index)
    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
