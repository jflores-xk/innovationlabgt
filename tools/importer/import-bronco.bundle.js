/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-bronco.js
  var import_bronco_exports = {};
  __export(import_bronco_exports, {
    default: () => import_bronco_default
  });

  // tools/importer/parsers/hero-vehicle.js
  function parse(element, { document: document2 }) {
    const image = element.querySelector(":scope > img, :scope > picture img, img");
    const heading = element.querySelector("h1, h2");
    const extras = Array.from(element.querySelectorAll(":scope > p, :scope > a"));
    if (!image && !heading && !extras.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    if (image) {
      const imageFrag = document2.createDocumentFragment();
      imageFrag.appendChild(document2.createComment(" field:image "));
      imageFrag.appendChild(image);
      cells.push([imageFrag]);
    } else {
      cells.push([""]);
    }
    if (heading || extras.length) {
      const textFrag = document2.createDocumentFragment();
      textFrag.appendChild(document2.createComment(" field:text "));
      if (heading) textFrag.appendChild(heading);
      extras.forEach((el) => textFrag.appendChild(el));
      cells.push([textFrag]);
    } else {
      cells.push([""]);
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "hero-vehicle", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/color-trim.js
  var CATEGORY_KEYS = ["exterior", "interior", "upholstery", "wheels"];
  function resolveCategory(panel) {
    var _a;
    const id = (panel.id || "").toLowerCase();
    const suffix = id.includes("-") ? id.slice(id.lastIndexOf("-") + 1) : id;
    if (CATEGORY_KEYS.includes(suffix)) return suffix;
    if (/^exterior/.test(suffix)) return "exterior";
    if (/^interior/.test(suffix)) return "interior";
    if (/^upholster/.test(suffix)) return "upholstery";
    if (/^wheel/.test(suffix)) return "wheels";
    const label = (((_a = panel.querySelector("h3, h4")) == null ? void 0 : _a.textContent) || "").toLowerCase();
    if (label.includes("exterior")) return "exterior";
    if (label.includes("interior")) return "interior";
    if (label.includes("upholster")) return "upholstery";
    if (label.includes("wheel")) return "wheels";
    return "exterior";
  }
  var clean = (s) => (s || "").replace(/\s+/g, " ").trim();
  function hinted(document2, field, content) {
    const frag = document2.createDocumentFragment();
    frag.appendChild(document2.createComment(` field:${field} `));
    frag.appendChild(typeof content === "string" ? document2.createTextNode(content) : content);
    return frag;
  }
  function parse2(element, { document: document2 }) {
    const titleEl = element.querySelector(":scope > summary h2, :scope > summary h3, :scope > summary");
    const title = clean(titleEl == null ? void 0 : titleEl.textContent);
    const expanded = element.hasAttribute("open") ? "true" : "false";
    const panels = Array.from(element.querySelectorAll(".tab-panel"));
    const cells = [];
    cells.push([title ? hinted(document2, "title", title) : ""]);
    cells.push([hinted(document2, "expanded", expanded)]);
    const scopes = panels.length ? panels : [element];
    scopes.forEach((panel) => {
      const category = panels.length ? resolveCategory(panel) : "exterior";
      panel.querySelectorAll("li.swatch").forEach((swatch) => {
        const img = swatch.querySelector("img");
        const nameEl = swatch.querySelector(".swatch-name");
        const codeEl = swatch.querySelector(".swatch-code");
        let name = "";
        if (nameEl) {
          const copy = nameEl.cloneNode(true);
          copy.querySelectorAll(".swatch-code").forEach((c) => c.remove());
          name = clean(copy.textContent);
        }
        const code = clean(codeEl == null ? void 0 : codeEl.textContent).replace(/^\((.*)\)$/, "$1").trim();
        cells.push([
          hinted(document2, "category", category),
          img ? hinted(document2, "image", img) : "",
          name ? hinted(document2, "swatchName", name) : "",
          code ? hinted(document2, "code", code) : ""
        ]);
      });
    });
    if (!title && cells.length === 2) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "color-trim", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/bronco-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, ["script", "noscript"]);
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        "header.site-header",
        "footer.site-footer",
        "script",
        "noscript",
        "link"
      ]);
      element.querySelectorAll(".sr-only").forEach((el) => {
        if (!el.closest("table")) el.remove();
      });
    }
  }

  // tools/importer/transformers/bronco-sections.js
  var SECTION_MARKER_ATTR = "data-excat-section-id";
  function querySection(root, selectors) {
    const list = Array.isArray(selectors) ? selectors : [selectors];
    for (const sel of list) {
      const el = root.querySelector(sel);
      if (el) return el;
    }
    return null;
  }
  function transform2(hookName, element, payload) {
    const sections = payload && payload.template && payload.template.sections || [];
    if (hookName === "beforeTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (i === 0 && !section.style) continue;
        const sectionEl = querySection(element, section.selector);
        if (!sectionEl) continue;
        const hr = document.createElement("hr");
        if (section.style) hr.setAttribute(SECTION_MARKER_ATTR, section.id);
        sectionEl.before(hr);
      }
    }
    if (hookName === "afterTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (!section.style) continue;
        const marker = element.querySelector(`[${SECTION_MARKER_ATTR}="${section.id}"]`);
        const anchor = marker || querySection(element, section.selector);
        if (!anchor) continue;
        const metadataBlock = WebImporter.Blocks.createBlock(document, {
          name: "Section Metadata",
          cells: { style: section.style }
        });
        anchor.after(metadataBlock);
        if (marker) {
          marker.removeAttribute(SECTION_MARKER_ATTR);
          if (i === 0) marker.remove();
        }
      }
    }
  }

  // tools/importer/import-bronco.js
  var parsers = {
    "hero-vehicle": parse,
    "color-trim": parse2
  };
  var PAGE_TEMPLATE = {
    name: "bronco",
    description: "2026 Bronco Color & Trim page: vehicle hero plus per-trim color/interior/upholstery/wheel swatch explorers",
    urls: [
      "http://127.0.0.1:8765/bronco.html"
    ],
    blocks: [
      {
        name: "hero-vehicle",
        instances: ["section.vehicle-hero"]
      },
      {
        name: "color-trim",
        instances: ["section.trims > details.trim"]
      }
    ],
    sections: [
      {
        id: "rc1",
        name: "Vehicle Hero",
        selector: ["section.vehicle-hero"],
        style: null,
        blocks: ["hero-vehicle"],
        defaultContent: []
      },
      {
        id: "rc2",
        name: "Trims",
        selector: ["section.trims"],
        style: null,
        blocks: ["color-trim"],
        defaultContent: ["section.trims > div.availability", "section.trims > div.disclaimer"]
      }
    ]
  };
  var transformers = [
    transform,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform2] : []
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), {
      template: PAGE_TEMPLATE
    });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document2, template) {
    const pageBlocks = [];
    template.blocks.forEach((blockDef) => {
      blockDef.instances.forEach((selector) => {
        const elements = document2.querySelectorAll(selector);
        if (elements.length === 0) {
          console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
        }
        elements.forEach((element) => {
          pageBlocks.push({
            name: blockDef.name,
            selector,
            element,
            section: blockDef.section || null
          });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  function localizeImageUrls(main, originalURL) {
    const { origin } = new URL(originalURL);
    main.querySelectorAll("img").forEach((img) => {
      const src = img.getAttribute("src");
      if (src && src.startsWith(`${origin}/images/bronco/`)) {
        img.setAttribute("src", src.substring(origin.length));
      }
    });
  }
  var import_bronco_default = {
    transform: (payload) => {
      const { document: document2, url, params } = payload;
      const main = document2.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document2, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
        const parser = parsers[block.name];
        if (parser) {
          try {
            parser(block.element, { document: document2, url, params });
          } catch (e) {
            console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
          }
        } else {
          console.warn(`No parser found for block: ${block.name}`);
        }
      });
      executeTransformers("afterTransform", main, payload);
      const hr = document2.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document2);
      WebImporter.rules.transformBackgroundImages(main, document2);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      localizeImageUrls(main, params.originalURL);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: {
          title: document2.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_bronco_exports);
})();
