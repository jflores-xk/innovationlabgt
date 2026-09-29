/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
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

  // tools/importer/import-footer.js
  var import_footer_exports = {};
  __export(import_footer_exports, {
    default: () => import_footer_default
  });
  var SECTION_SELECTORS = [".footer-copyright", ".footer-legal"];
  var import_footer_default = {
    transform: (payload) => {
      const { document } = payload;
      const main = document.querySelector("main") || document.body;
      SECTION_SELECTORS.slice(1).forEach((sel) => {
        const el = main.querySelector(sel);
        if (el) el.before(document.createElement("hr"));
      });
      main.querySelectorAll("[class], [id]").forEach((el) => {
        el.removeAttribute("class");
        el.removeAttribute("id");
      });
      return [{ element: main, path: "/footer", report: { title: "footer" } }];
    }
  };
  return __toCommonJS(import_footer_exports);
})();
