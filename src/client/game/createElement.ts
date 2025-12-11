import { attachNavigateToAchorTag } from "./attachNavigateToAchorTag";
import { Datetime_global, Datetime_global_constructor } from "datetime_global/Datetime_global";
import { RelativeTime, ClockTime } from "datetime_global/RelativeTimeChecker";
import { getISOWeek } from "../isoWeek";

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

export function createDiv(...innerNodes: (HTMLElement | string)[]) {
  const span = document.createElement('div');
  span.className = 'createDiv createdElement';
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

export function insertBetween<RETURN extends Element = HTMLDivElement>(html: HTMLElement, containerTagName: string = 'div', classNames: string[] = []): RETURN {
  const div: RETURN = document.createElement(containerTagName) as unknown as RETURN; html.replaceWith(div);
  div.className = 'insertedDiv ' + classNames.join('\x20'); div.append(html); return div;
}

export function createTR(...rest: (Node | string | (Node | string)[])[]) {
  const tr = document.createElement('tr');
  for (const element of rest) {
    const td = document.createElement('td');
    if (Array.isArray(element)) {
      td.append(...element);
    } else {
      td.append(element);
    } tr.append(td);
  } return tr;
}

export function createBR() {
  return Object.assign(document.createElement('br'), { className: 'createBR' });
}

/*export function usernameFormat(username?: string, linked: boolean = false): string {if (username === undefined) return '[Favicond_object Undefined]';
return /^[a-zA-Z0-9\-_]+$/.test(username) ? (linked ? `[u/${username}](https://old.reddit.com/u/${username}/)` : ('u/' + username)) : username;}*/

export function createUnameSpan(username?: string, linked: boolean = true) {
  const regexp = /^[a-zA-Z0-9\-_]+$/;
  if (username === undefined) {
    username = '[Favicond_object Undefined]';
  } else if (typeof username === 'string') {
    if (regexp.test(username)) {
      username = `u/${username}`;
    } else {
      username = `${username}`;
    }
  } else {
    username = `${username}`;
    linked = false;
  }
  const textContent = username,
    span = regexp.test(username) && linked ? Object.assign(document.createElement('a'), {
      textContent, className: 'createUnameSpan uname-linked',
      href: `https://old.reddit.com/u/${username}/`,
    }) : Object.assign(document.createElement('span'), {
      textContent, className: 'createUnameSpan uname-no-linked',
    });
  Object.assign(span.dataset, { username });
  return span;
}

export function createRnameSpan(subredditName?: string, linked: boolean = true) {
  const regexp = /^[a-zA-Z0-9_]+$/;
  if (subredditName === undefined) {
    subredditName = '[Favicond_object Undefined]'
  } else if (typeof subredditName === 'string') {
    if (regexp.test(subredditName)) {
      subredditName = `u/${subredditName}`;
    } else {
      subredditName = `${subredditName}`;
    }
  } else {
    subredditName = `${subredditName}`;
    linked = false;
  }
  const textContent = subredditName,
    span = regexp.test(subredditName) && linked ? Object.assign(document.createElement('a'), {
      textContent, className: 'createRnameSpan Rname-linked',
      href: `https://old.reddit.com/u/${subredditName}/`,
    }) : Object.assign(document.createElement('span'), {
      textContent, className: 'createRnameSpan Rname-no-linked',
    });
  Object.assign(span.dataset, { subredditName });
  return span;
}

export function createLinkOrTimeElement(href: string | URL, ...innerNodes: (HTMLElement | string)[]) {
  const urlObject = new URL(href, 'https://old.reddit.com'),
    url = urlObject.toString(), a = createLink(url, ...innerNodes).tag;
  if (urlObject.hostname === 'clock.ant.ractoc.com') {
    const date = new Date(urlObject.searchParams.get('t') ?? NaN);
    if (!isNaN(date as unknown as number)) {
      let replacement; const dateTime = date.toISOString(),
        replType = urlObject.searchParams.get('type')?.toLowerCase(),
        formatDefault = urlObject.searchParams.get('format'),
        format = urlObject.searchParams.get('format-custom');
      if (format) {
        replacement = new ClockTime(date);
        replacement.setAttribute('format', format.replaceAll(/o/g, `${getISOWeek(date).year}`));
      } else if (formatDefault) {
        const format = formatDefault.trim().toUpperCase();
        replacement = new ClockTime(date); let resultFormat: string | null = 'D M Y-m-d \\TH:i:s (e)';
        switch (format.replace(/^(?:FORMAT_?)/i, '')) {
          case "TOSTRING": // toString
          case "DATEV1":
            resultFormat = Datetime_global.FORMAT_DATEV1;
            break;
          case "DATETIME_GLOBALV4":
            resultFormat = 'D M Y-m-d \\TH:i:s (e)';
          case "DATETIME_GLOBALV3":
            resultFormat = Datetime_global.FORMAT_DATETIME_GLOBALV3;
            break;
          case "DATETIME_GLOBALV2":
            resultFormat = Datetime_global.FORMAT_DATETIME_GLOBALV2;
            break;
          case "DATETIME_GLOBALV1":
            resultFormat = Datetime_global.FORMAT_DATETIME_GLOBALV1;
            break;
          case "MYSQLI":
            resultFormat = Datetime_global.FORMAT_MYSQLI;
            break;
          case "TOISOSTRING":
          case "TOJSON":
            resultFormat = null;
            {
              const textContent = dateTime;
              replacement = Object.assign(document.createElement("time"), { textContent, dateTime });
            }
            break;
          case "TOUTCSTRING":
            resultFormat = null;
            {
              const textContent = date.toUTCString();
              replacement = Object.assign(document.createElement("time"), { textContent, dateTime });
            }
            break;
          case "TOTIMESTRING":
            resultFormat = 'H:i:s (e)';
            break;
          case "TODATESTRING":
            resultFormat = 'D M m Y';
            break;
          case "OFFSET_FROM_NOW":
            resultFormat = null;
            replacement = new RelativeTime(date);
            break;
        }
        if (resultFormat) {
          if (format.startsWith('FORMAT_')) {
            resultFormat = (Datetime_global[format as keyof Datetime_global_constructor] as string) ?? resultFormat;
          } else resultFormat = resultFormat;
          replacement.setAttribute('format', resultFormat);
        }
      } else switch (replType) {
        case "relative":
          replacement = new RelativeTime(date);//document.createElement("relative-time");
          // replacement.setAttribute('datetime', dateTime);
          break;
        default:
          replacement = Object.assign(document.createElement("time"), { dateTime });
          if (url === a.innerHTML) {
            replacement.innerText = date.toString().slice(0, 33);
          } else {
            replacement.replaceChildren(...a.childNodes);
          }
      }
      replacement.setAttribute('data-href', url); if ('timezone' in replacement)
        replacement.timezone = Datetime_global.hostLocalTimezone();
      a.replaceChildren(replacement);
    } return a;
  }
}

export function replaceLinkTagIfNeeded(a: HTMLAnchorElement) {
  const href = a.getAttribute('href'); if (!href) return a;
  const urlObject = new URL(href, 'https://old.reddit.com'), url = urlObject.toString();
  if (urlObject.hostname === 'clock.ant.ractoc.com') {
    const date = new Date(urlObject.searchParams.get('t') ?? NaN);
    if (!isNaN(date as unknown as number)) {
      let replacement; const dateTime = date.toISOString(),
        replType = urlObject.searchParams.get('type')?.toLowerCase(),
        formatDefault = urlObject.searchParams.get('format'),
        format = urlObject.searchParams.get('format-custom');
      if (format) {
        replacement = new ClockTime(date);
        replacement.setAttribute('format', format.replaceAll(/o/g, `${getISOWeek(date).year}`));
      } else if (formatDefault) {
        const format = formatDefault.trim().toUpperCase();
        replacement = new ClockTime(date); let resultFormat: string | null = 'D M Y-m-d \\TH:i:s (e)';
        switch (format.replace(/^(?:FORMAT_?)/i, '')) {
          case "TOSTRING": // toString
          case "DATEV1":
            resultFormat = Datetime_global.FORMAT_DATEV1;
            break;
          case "DATETIME_GLOBALV4":
            resultFormat = 'D M Y-m-d \\TH:i:s (e)';
          case "DATETIME_GLOBALV3":
            resultFormat = Datetime_global.FORMAT_DATETIME_GLOBALV3;
            break;
          case "DATETIME_GLOBALV2":
            resultFormat = Datetime_global.FORMAT_DATETIME_GLOBALV2;
            break;
          case "DATETIME_GLOBALV1":
            resultFormat = Datetime_global.FORMAT_DATETIME_GLOBALV1;
            break;
          case "MYSQLI":
            resultFormat = Datetime_global.FORMAT_MYSQLI;
            break;
          case "TOISOSTRING":
          case "TOJSON":
            resultFormat = null;
            {
              const textContent = dateTime;
              replacement = Object.assign(document.createElement("time"), { textContent, dateTime });
            }
            break;
          case "TOUTCSTRING":
            resultFormat = null;
            {
              const textContent = date.toUTCString();
              replacement = Object.assign(document.createElement("time"), { textContent, dateTime });
            }
            break;
          case "TOTIMESTRING":
            resultFormat = 'H:i:s (e)';
            break;
          case "TODATESTRING":
            resultFormat = 'D M m Y';
            break;
          case "OFFSET_FROM_NOW":
            resultFormat = null;
            replacement = new RelativeTime(date);
            break;
        }
        if (resultFormat) {
          if (format.startsWith('FORMAT_')) {
            resultFormat = (Datetime_global[format as keyof Datetime_global_constructor] as string) ?? resultFormat;
          } else resultFormat = resultFormat;
          replacement.setAttribute('format', resultFormat);
        }
      } else switch (replType) {
        case "relative":
          replacement = new RelativeTime(date);//document.createElement("relative-time");
          // replacement.setAttribute('datetime', dateTime);
          break;
        default:
          replacement = Object.assign(document.createElement("time"), { dateTime });
          if (url === a.innerHTML) {
            replacement.innerText = date.toString().slice(0, 33);
          } else {
            replacement.replaceChildren(...a.childNodes);
          }
      }
      replacement.setAttribute('data-href', url); if ('timezone' in replacement)
        replacement.timezone = Datetime_global.hostLocalTimezone();
      a.replaceChildren(replacement);
    } else { attachNavigateToAchorTag(a, true) }
    return a;
  }
}

export function createPlaintextCodeblock(code: string) {
  const codeTag = Object.assign(document.createElement('code'), { textContent: `${code}`, className: 'createCodeblock' });
  const preTag = Object.assign(document.createElement('pre'), { className: 'createCodeblock' }); preTag.append(codeTag);
  codeTag.dataset.tagcreationDate = Date(); return preTag;
}
