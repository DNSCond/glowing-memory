import { FavicondRedditPost } from "./PostCommentRedditUi";
import { context } from "@devvit/web/client";
import "./switch.js";

{
  const { subredditName, username } = context;
  document.querySelectorAll<HTMLElement>('.placeholder-username').forEach(m => m.innerText = username ?? '[Anonymous]');
  document.querySelectorAll<HTMLElement>('.placeholder-subredditName').forEach(m => m.innerText = subredditName);
} const Datetime_globalV4 = 'D M Y-m-d \\TH:i:s (e)', postsDiv = document.getElementById('posts')!;

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



