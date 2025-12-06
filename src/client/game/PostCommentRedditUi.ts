import { RelativeTime } from "datetime_global/RelativeTimeChecker";
import { createSpan, createLink, createCustomTag } from "./createElement";
import { attachNavigateToAchorTag } from "./attachNavigateToAchorTag";

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

export class FavicondRedditUi extends HTMLElement {
  public type!: 'Post' | 'Comment';
  #fetchResult = Promise.withResolvers<Promise<FavicondRedditUiStatusCodes>>();// = { promise, resolve, reject }
  #status: FavicondRedditUiStatus<FavicondRedditUiStatusCodes> = new FavicondRedditUiStatus('pending');
  static get observedAttributes(): string[] {
    return ['reddit-id'];
  }

  constructor(redditId: string) {
    super();
    this.attachShadow({ mode: 'open' }).innerHTML =
      '<style class=global-style>.outerHTML{margin-top:1em}article.post{border:2px solid gray;>*{margin-left:1ch}}a:visited'
      + ',a:link{color:blue;}a:hover{color:orangered;}a:active{color:black;}</style><style class=subreddit-style></style>';
    if (typeof redditId === 'string' && /^t[13]_[a-z0-9]+$/i.test(redditId)) {
      this.setAttribute('reddit-id', redditId);
      // @ts-expect-error
      this.#fetchResult.resolve(fetch(`/api/getPost?reddit-id=${redditId}`).then(async resp => {
        if (resp.ok) {
          const json = await resp.json();
          const div = document.createElement('div');
          {
            const a = createLink(json.url, json.title).tag;
            a.setAttribute('style', 'text-decoration:none;');
            const tag = createCustomTag('h2', a);
            tag.style.marginBottom = '0.5em';
            tag.style.marginTop = '0';
            div.prepend(tag);
          }
          div.innerHTML += `<article class=post>${json.bodyHtml ?? '<p class=no-body>undefined</p>'}</article>`;
          div.querySelector('article.post')!.insertAdjacentElement('beforebegin',
            createSpan('submitted ', new RelativeTime(json.createdAt), ' by ',
              createLink(`https://www.reddit.com/u/${json.authorName}`, json.authorName).tag),
          ); this.shadowRoot!.append(div); div.setAttribute('class', 'outerHTML');
          div.querySelector('article.post')!.querySelectorAll('a')
            .forEach(a => attachNavigateToAchorTag(a, true));
          return this.#status = new FavicondRedditUiStatus('success', this);
        } else {
          return this.#status = new FavicondRedditUiStatus('Network-error', this);
        }
      }));
    }
  }

  whenLoaded() {
    return this.#fetchResult.promise;
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
