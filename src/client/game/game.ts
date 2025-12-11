import { FavicondRedditPost } from "./PostCommentRedditUi";
import { context, showToast } from "@devvit/web/client";
import { HeadersetUi } from "./headerset";
import { createDiv, createTR, createUnameSpan } from "./createElement";
import { type ModNote } from "../../shared/modnote";
import { RelativeTime } from "datetime_global/RelativeTimeChecker";
import "./switch.js"; import "./modmail/game";

{
  const { subredditName, username } = context;
  document.querySelectorAll<HTMLElement>('.placeholder-username').forEach(m => m.innerText = username ?? '[Anonymous]');
  document.querySelectorAll<HTMLElement>('.placeholder-subredditName').forEach(m => m.innerText = subredditName);
} const postsDiv = document.getElementById('posts')!;// Datetime_globalV4 = 'D M Y-m-d \\TH:i:s (e)',

fetch('/api/postsList').then(async resp => {
  const json = resp.json(), docu = new DocumentFragment;
  if (!resp.ok) return json.then(m => { throw m });
  const abortController = new AbortController, { signal } = abortController;
  for (const post of ((await json).posts)) {
    const ui_post = new FavicondRedditPost(post);
    // @ts-expect-error
    ui_post.addEventListener('linkclick', (event: CustomEvent<string>) => {
      const { detail } = event; event.preventDefault();
      console.log('user wants to navigateTo ' + detail);
      abortController.abort();
    }, { signal });
    ui_post.addEventListener('postvisitclick', (event) => {
      event.preventDefault(); abortController.abort();
      postsDiv.replaceChildren(ui_post);
      ui_post.loadComments();
    }, { signal });
    docu.append(ui_post);
  }
  postsDiv.append(docu);
});

{
  const input = document.getElementById('userModEval')! as HTMLInputElement,
    output = document.getElementById('u/[output]')! as HTMLOutputElement;
  document.getElementById('evaluateUser')!.addEventListener('click', function (event) {
    event.preventDefault();
    fetch('/api/getModActionsOf?user=' + encodeURIComponent(input.value)).then(async resp => {
      const json = await resp.json(); if (resp.ok) {
        const { result } = json;
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
        const headersetUi = new HeadersetUi(result, []).setHeaderValTypes((new Map<string, string>).set('created-at', 'datetime-utc'));
        output.replaceChildren(
          createDiv(img), document.createElement('br'), headersetUi,
          Object.assign(createDiv(list), { className: 'tablediv' }),
        );
      } else showToast(json.error);
    });

  });
}
