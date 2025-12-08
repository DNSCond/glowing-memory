import { FavicondRedditPost } from "./PostCommentRedditUi";
import { context } from "@devvit/web/client";
import { jsonEncodeIndent } from "anthelpers";
import { HeadersetUi } from "./headerset";
import { createDiv } from "./createElement";
import { type ModNote } from "../../shared/modnote";
import "./switch.js";
import { RelativeTime } from "datetime_global/RelativeTimeChecker";
import { traverseObjectToHTML } from "./createFromJSON";

{
  const { subredditName, username } = context;
  document.querySelectorAll<HTMLElement>('.placeholder-username').forEach(m => m.innerText = username ?? '[Anonymous]');
  document.querySelectorAll<HTMLElement>('.placeholder-subredditName').forEach(m => m.innerText = subredditName);
} const postsDiv = document.getElementById('posts')!;// Datetime_globalV4 = 'D M Y-m-d \\TH:i:s (e)',

fetch('/api/postsList').then(async resp => {
  const json = resp.json(), docu = new DocumentFragment;
  if (!resp.ok) return json.then(m => { throw m });
  for (const post of ((await json).posts)) {
    const ui_post = new FavicondRedditPost(post);
    // @ts-expect-error
    ui_post.addEventListener('linkclick', (event: CustomEvent<string>) => {
      const { detail } = event; event.preventDefault();
      console.log('user wants to navigateTo ' + detail);
    }); docu.append(ui_post);
  }
  postsDiv.append(docu);
});

{
  const input = document.getElementById('userModEval')! as HTMLInputElement,
    output = document.getElementById('u/[output]')! as HTMLOutputElement;
  document.getElementById('evaluateUser')!.addEventListener('click', function (event) {
    event.preventDefault();
    fetch('/api/getModActionsOf?user=' + encodeURIComponent(input.value)).then(async resp => {
      const { result } = await resp.json();
      console.log(jsonEncodeIndent(result));
      const img = Object.assign(document.createElement('img'), { src: result.snooRL });
      img.style.maxWidth = '35%'; const notes = result['modnotes'] as ModNote[];
      Reflect.deleteProperty(result, 'modnotes');
      const list = document.createElement('table');
      list.innerHTML = '<tr><th>date<th>operator<th>affected<th>type';
      list.append(...notes.map(each => {
        return createTR(
          new RelativeTime(each.createdAt),
          createUnameSpan(each.operator.name),
          createUnameSpan(each.user.name),
          each.type,
        );
      }));
      result['createdAt'] = new Date(result['createdAt']);
      output.replaceChildren(
        createDiv(img),
        document.createElement('br'),
        new HeadersetUi(result, []).setHeaderValTypes((new Map).set('headerset-created-at', 'datetime-utc')),
        Object.assign(createDiv(list), { className: 'tablediv' }),
      );
    });
  });
}// MajorParadox

function createTR(...rest: (Node | string | (Node | string)[])[]) {
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

function usernameFormat(username?: string, linked: boolean = false): string {
  if (username === undefined) return '[Favicond_object Undefined]';
  return /^[a-zA-Z0-9\-_]+$/.test(username) ? (linked ? `[u/${username}](https://old.reddit.com/u/${username}/)` : ('u/' + username)) : username;
}

function createUnameSpan(username?: string, linked: boolean = true) {
  if (username === undefined) {
    username = '[Favicond_object Undefined]'
  } else if (typeof username === 'string') {
    if (/^[a-zA-Z0-9\-_]+$/.test(username)) {
      username = `u/${username}`;
    } else {
      username = `${username}`;
    }
  } else {
    username = `${username}`;
    linked = false;
  }
  const textContent = username,
    span = /^u\/[a-zA-Z0-9\-_]+$/.test(username) && linked ? Object.assign(document.createElement('a'), {
      textContent, className: 'createUnameSpan uname-linked',
      href: `https://old.reddit.com/u/${username}/`,
    }) : Object.assign(document.createElement('span'), {
      textContent, className: 'createUnameSpan uname-no-linked',
    });
  Object.assign(span.dataset, { username });
  return span;
}
