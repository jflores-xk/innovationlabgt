/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-vehicle. Base: hero. Source: http://127.0.0.1:8765/bronco.html
 * Source DOM: section.vehicle-hero > h1 (with <br>) + img (vehicle foreground image).
 * xwalk model (hero-vehicle): image (+imageAlt collapsed), text (richtext).
 * Output: 1 column, rows: [image], [text].
 */
export default function parse(element, { document }) {
  const image = element.querySelector(':scope > img, :scope > picture img, img');
  const heading = element.querySelector('h1, h2');
  // any additional text content (paragraphs / CTAs) belongs to the text field too
  const extras = Array.from(element.querySelectorAll(':scope > p, :scope > a'));

  if (!image && !heading && !extras.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];

  // Row: image (imageAlt is collapsed into the img alt attribute)
  if (image) {
    const imageFrag = document.createDocumentFragment();
    imageFrag.appendChild(document.createComment(' field:image '));
    imageFrag.appendChild(image);
    cells.push([imageFrag]);
  } else {
    cells.push(['']);
  }

  // Row: text (keep <h1>2026<br>Bronco</h1> as-is)
  if (heading || extras.length) {
    const textFrag = document.createDocumentFragment();
    textFrag.appendChild(document.createComment(' field:text '));
    if (heading) textFrag.appendChild(heading);
    extras.forEach((el) => textFrag.appendChild(el));
    cells.push([textFrag]);
  } else {
    cells.push(['']);
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-vehicle', cells });
  element.replaceWith(block);
}
