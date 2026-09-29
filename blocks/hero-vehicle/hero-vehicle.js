/*
 * Hero Vehicle Block
 * Two-column intro: heading text on the left, a foreground vehicle image on the right.
 * Content model mirrors the vanilla hero xwalk model: image (+ imageAlt) and rich text.
 */

import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

// no authorable options yet; kept so future options branch in one place
const OPTION_CLASSES = [];

function hasTextContent(cell) {
  return [...cell.querySelectorAll('h1, h2, h3, h4, h5, h6, p, ul, ol')]
    .some((el) => !el.querySelector('picture, img') && el.textContent.trim())
    || (!cell.querySelector('picture, img') && cell.textContent.trim() !== '');
}

export default function decorate(block) {
  // eslint-disable-next-line no-unused-vars
  const active = [...block.classList].filter((c) => OPTION_CLASSES.includes(c));

  // Flatten rows -> cells so both the xwalk shape (one field per row)
  // and a single two-cell row (image | text) are handled.
  const cells = [...block.children].flatMap((row) => [...row.children]);

  const mediaCell = cells.find((cell) => cell.querySelector('picture, img'));
  let contentCell = cells.find((cell) => cell !== mediaCell && hasTextContent(cell));
  // keep an (empty) text cell so authors can still edit it inline in Universal Editor
  if (!contentCell) contentCell = cells.find((cell) => cell !== mediaCell);

  const content = document.createElement('div');
  content.className = 'hero-vehicle-content';
  if (contentCell) {
    moveInstrumentation(contentCell, content);
    content.append(...contentCell.childNodes);
  }

  const media = document.createElement('div');
  media.className = 'hero-vehicle-media';
  if (mediaCell) {
    const img = mediaCell.querySelector('img');
    if (img) {
      // the vehicle image is above the fold (LCP) -> eager
      const picture = createOptimizedPicture(img.src, img.alt, true, [
        { media: '(min-width: 900px)', width: '1200' },
        { width: '750' },
      ]);
      moveInstrumentation(img, picture.querySelector('img'));
      const oldPicture = img.closest('picture');
      if (oldPicture) moveInstrumentation(oldPicture, picture);
      media.append(picture);
    }
  } else {
    block.classList.add('hero-vehicle-no-media');
  }

  block.replaceChildren(content, ...(media.childElementCount ? [media] : []));
}
