import { attachNavigateToAchorTag } from "./attachNavigateToAchorTag";
export function createParagraph(...innerNodes: (HTMLElement | string)[]) {
  const paragraph = document.createElement('p');
  paragraph.className = 'createParagraph createdElement';
  paragraph.append(...innerNodes);
  return paragraph;
}

export function createSpan(...innerNodes: (HTMLElement | string)[]) {
  const span = document.createElement('span');
  span.className = 'createSpan createdElement';
  span.append(...innerNodes);
  return span;
}

export function createCustomTag(tagName: string, ...innerNodes: (HTMLElement | string)[]) {
  const span = document.createElement(tagName);
  span.className = 'createCustomTag createdElement';
  span.append(...innerNodes);
  return span;
}

export function createLink(hrefTo: string | URL, ...innerNodes: (HTMLElement | string)[]) {
  const anchor = document.createElement('a');
  anchor.href = `${hrefTo}`; anchor.append(...innerNodes);
  anchor.className = 'createAnchor createdElement';
  return attachNavigateToAchorTag(anchor, false);
}

export function addClassList(tag: HTMLElement, classList: string[]) {
  tag.className += Array.from(classList).join(' '); return tag;
}
