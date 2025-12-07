import { RelativeTime } from "datetime_global/RelativeTimeChecker";
import { createSpan, createLink, createCustomTag, replaceLinkTagIfNeeded, insertBetween } from "./createElement";
import { navigateTo } from "@devvit/web/client";
import { replaceAnchorWith } from "./attachNavigateToAchorTag";

// FavicondRedditUi
export type FavicondRedditUiStatusCodes = 'success' | 'Network-error' | 'error' | 'pending' | 'removed';
// export type FavicondRedditUiStatusObject= 'success' | 'Network-error' | 'pending' | 'removed';
export class FavicondRedditUiStatus<STATUS extends FavicondRedditUiStatusCodes, T = any> {
  public status!: STATUS; public value!: T | undefined;
  constructor(status: STATUS, value: T | undefined = undefined) {
    if (!['success', 'Network-error', 'pending', 'removed'].includes(status))
      throw new RangeError(`status isnt one of FavicondRedditUiStatusCodes, its (${status})`);
    Object.defineProperty(this, 'status', {
      configurable: false,
      enumerable: true,
      writable: false,
      value: status,
    });
    Object.defineProperty(this, 'value', {
      configurable: false,
      enumerable: true,
      writable: false,
      value,
    });
  }
}

const PostStyle = `<style class=global-style>.outerHTML {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  margin-top: 1em;
}

article.post {
  border: 2px solid gray;

  ; > * { margin-left: 1ch; }
  
  margin-top: 0.5ch;
}

a:visited,a:link{color:blue;}a:hover{color:orangered;}a:active{color:black;}</style>

<style class=subreddit-style></style>

<style class="reddit table">table {
  border-collapse: collapse;
  background-color: white;
  min-width: 100%;
}

td, th {
  border: 1px solid #dddddd;
  text-align: left;
  padding: 8px;
}

/*tr:nth-child(even) {
  backround-color: #dddddd;
}*/

div.tablediv {
  overflow: scroll;
}</style>`;

export class FavicondRedditUi extends HTMLElement {
  public type!: 'Post' | 'Comment';
  #fetchResult = Promise.withResolvers<Promise<FavicondRedditUiStatusCodes>>();// = { promise, resolve, reject }
  #status: FavicondRedditUiStatus<FavicondRedditUiStatusCodes> = new FavicondRedditUiStatus('pending');
  static get observedAttributes(): string[] {
    return ['reddit-id'];
  }

  constructor(redditId: string) {
    super();
    this.attachShadow({ mode: 'open' }).innerHTML = PostStyle;
    if (typeof redditId === 'string' && /^t[13]_[a-z0-9]+$/i.test(redditId)) {
      this.setAttribute('reddit-id', redditId); // @ts-expect-error
      this.#fetchResult.resolve(fetch(`/api/getPost?reddit-id=${redditId}`).then(async resp => {
        if (resp.ok) {
          const json = await resp.json();
          const div = document.createElement('div');
          {
            const a = this.createLink(json.url, json.title);
            a.setAttribute('style', 'text-decoration:none;');
            const tag = createCustomTag('h2', a);
            tag.style.marginBottom = '0.5em';
            tag.style.marginTop = '0';
            div.prepend(tag);
          }
          div.innerHTML += `<article class=post>${json.bodyHtml ?? '<p class=no-body>undefined</p>'}</article>`;
          div.querySelector('article.post')!.insertAdjacentElement('beforebegin',
            createSpan('submitted ', new RelativeTime(json.createdAt), ' by ',
              this.createLink(`https://www.reddit.com/u/${json.authorName}`, json.authorName)),
          ); this.shadowRoot!.append(div); div.setAttribute('class', 'outerHTML');
          div.querySelector('article.post')!.querySelectorAll('a')
            .forEach(a => replaceLinkTagIfNeeded(a));
          Array.from(div.querySelectorAll('table'), table => insertBetween(table, 'div', ['tablediv']));
          {
            const details = document.createElement('details');
            const summary = document.createElement('summary');
            const content = div.querySelector('article.post')!;
            summary.append('body');
            content.replaceWith(details); details.append(summary, content);
          } return this.#status = new FavicondRedditUiStatus('success', this);
        } else {
          return this.#status = new FavicondRedditUiStatus('Network-error', this);
        }
      }));
    }
  }

  whenLoaded() {
    return this.#fetchResult.promise;
  }

  async loadComments() {
    const { promise, resolve } = Promise.withResolvers();
    resolve;//()
    return promise;
  }

  createLink(hrefTo: string | URL, ...innerNodes: (HTMLElement | string)[]) {
    const { tag, abortController } = createLink(hrefTo, ...innerNodes);
    abortController.abort(); {
      const abortController = new AbortController,
        { signal } = abortController, a = tag;
      a.classList.add('reddit-post-link');
      a.addEventListener('click', (event) => {
        event.preventDefault(); {
          const href = a.dataset.href as string,
            event = new CustomEvent('linkclick', {
              cancelable: true, bubbles: true,
              composed: true, detail: href,
            }), continueDefault = this.dispatchEvent(event);
          // if (continueDefault) navigateTo(href);
        }
      }, { signal });
    } return tag;
  }
}

export class FavicondRedditPost extends FavicondRedditUi {
  public override type: 'Post' = 'Post';
  static override get observedAttributes(): string[] {
    return super.observedAttributes.concat([]);
  }

  constructor(redditId: string) {
    super(redditId);
    Object.defineProperty(this, 'type', {
      configurable: false,
      enumerable: true,
      writable: false,
    });
  }
}

export class FavicondRedditComment extends FavicondRedditUi {
  public override type: 'Comment' = 'Comment';

  constructor(redditId: string) {
    super(redditId);
    Object.defineProperty(this, 'type', {
      configurable: false,
      enumerable: true,
      writable: false,
    });
  }
}

customElements.define('favicond-reddit-post', FavicondRedditPost);
customElements.define('favicond-reddit-comment', FavicondRedditComment);
