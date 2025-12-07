import { FavicondRedditPost } from "./PostCommentRedditUi";
import { context } from "@devvit/web/client";
import "./switch.js";
import { jsonEncodeIndent } from "anthelpers";
import { HeadersetUi } from "./headerset";

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
  document.getElementById('evaluateUser')!.addEventListener('click', function () {
    fetch('/api/getModActionsOf?user=' + encodeURIComponent(input.value)).then(async resp => {
      const { result } = await resp.json();
      console.log(jsonEncodeIndent(result));
      output.replaceChildren(new HeadersetUi(result, []));
    });
  });
}// MajorParadox
