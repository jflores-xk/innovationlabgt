/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroVehicleParser from './parsers/hero-vehicle.js';
import trimTabParser from './parsers/trim-tab.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/bronco-cleanup.js';
import trimSectionsTransformer from './transformers/bronco-trim-sections.js';
import sectionsTransformer from './transformers/bronco-sections.js';

// PARSER REGISTRY
const parsers = {
  'hero-vehicle': heroVehicleParser,
  'trim-tab': trimTabParser,
};

// Documents are placed under the site folder (AEM site path /content/innovationlabgt)
const SITE_FOLDER = '/innovationlabgt';

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'bronco',
  description: '2026 Bronco Color & Trim page: vehicle hero, one trim section (accordion panel) per trim holding trim-tab blocks of color swatches, and a notes section',
  urls: [
    'http://127.0.0.1:8765/bronco.html'
  ],
  blocks: [
    {
      name: 'hero-vehicle',
      instances: [
        'section.vehicle-hero'
      ]
    },
    {
      name: 'trim-tab',
      instances: [
        'section.trims > details.trim .tab-panel'
      ]
    }
  ],
  sections: [
    {
      id: 'rc1',
      name: 'Vehicle Hero',
      selector: [
        'section.vehicle-hero'
      ],
      style: null,
      blocks: [
        'hero-vehicle'
      ],
      defaultContent: []
    },
    {
      id: 'rc2',
      name: 'Trims',
      selector: [
        'section.trims'
      ],
      style: null,
      blocks: [
        'trim-tab'
      ],
      defaultContent: []
    },
    {
      id: 'rc3',
      name: 'Trim Notes',
      selector: [
        'section.trims > div.availability'
      ],
      style: 'trim-notes',
      blocks: [],
      defaultContent: [
        'section.trims > div.availability',
        'section.trims > div.disclaimer'
      ]
    }
  ]
};

// TRANSFORMER REGISTRY - section transformer runs after cleanup
const transformers = [
  cleanupTransformer,
  trimSectionsTransformer,
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

// public origin serving the project code bus, where the page images are committed
// (images/bronco/); AEM ingests them into Assets from here on upload
const IMAGE_ORIGIN = 'https://main--innovationlabgt--jflores-xk.aem.page';

/**
 * The source is a temporary reference server; its images are mirrored in the
 * project under /images/bronco/, so point them at the public code bus instead.
 * @param {Element} main - The main element
 * @param {string} originalURL - The source page URL
 */
function localizeImageUrls(main, originalURL) {
  const { origin } = new URL(originalURL);
  main.querySelectorAll('img').forEach((img) => {
    const src = img.getAttribute('src');
    if (src && src.startsWith(`${origin}/images/bronco/`)) {
      img.setAttribute('src', `${IMAGE_ORIGIN}${src.substring(origin.length)}`);
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

    // 6. Sanitized path under the site folder (root URL maps to /index)
    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(`${SITE_FOLDER}${rawPath === '' ? '/index' : rawPath}`);

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
