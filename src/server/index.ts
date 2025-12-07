import express from "express";
import {
  createServer,
  context,
  getServerPort,
  reddit,
  redis,
} from "@devvit/web/server";
import { createPost } from "./post";
import { ResolveSecondsAfter } from "anthelpers";

const app = express();

// Middleware for JSON body parsing
app.use(express.json());
// Middleware for URL-encoded body parsing
app.use(express.urlencoded({ extended: true }));
// Middleware for plain text body parsing
app.use(express.text());

const router = express.Router();

router.get("/api/postsList", async (_req, res): Promise<void> => {
  try {
    const { subredditName } = context;
    const postObjects = await reddit.getNewPosts({ subredditName, limit: 50 }).all(),
      posts: string[] = new Array, expiration = ResolveSecondsAfter(8600);
    for (const post of postObjects) {
      posts.push(post.id);
      await redis.set(post.id, JSON.stringify(post), { expiration });
    }
    res.json({ posts });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: "Failed to Fetch",
      error: String(error),
      pages: []
    });
  }
});

function unpackJSON(json: any) {
  if (typeof json === 'string') {
    return JSON.parse(json);
  } return json;
}

router.get("/api/getPost", async (req, res): Promise<void> => {
  try {
    const postId = req.query['reddit-id'] as string | undefined;
    if (!postId) throw new RangeError('wikipageName is undefined');
    // @ts-expect-error
    let { title, body, createdAt, authorId, bodyHtml, authorName, url } = unpackJSON(await redis.get(postId)) || (await reddit.getPostById(postId));
    res.json({ title, body, createdAt, authorId, bodyHtml, authorName, url });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: "Failed to Fetch",
      error: String(error),
    });
  }
});
async function isModerayor() {
  const user = await reddit.getCurrentUser();
  if (!user) throw new TypeError('CurrentUser is undefined');
  const username = user.username;
  const isMod = !!(await user.getModPermissionsForSubreddit(context.subredditName)).length;
  if (!isMod) throw new RangeError('CurrentUser isnt a mod');
  return { user, username };
}

router.get("/api/currentSubredditName", async (_req, res): Promise<void> => {
  res.status(200).json({ status: "success", currentSubredditName: context.subredditName, });
});

router.get("/api/isModerator", async (_req, res): Promise<void> => {
  try { await isModerayor(); } catch (errorObject) {
    const error = String(errorObject);
    res.status(400).json({ status: "error", isModerator: false, error });
    return;
  }
  res.status(200).json({ status: "success", isModerator: true, error: null });
});

router.post("/internal/menu/create-post", async (_req, res) => {
  //const { subredditName } = req.body; // Ensure you get the subreddit name from the request context
  //if (!subredditName) {res.status(400).json({ showToast: 'Subreddit name missing.' });return;}
  const navigateTo = await createPost('Antboiy\'s Reddit Entrance');
  // await navigateTo.addComment({
  //   text: 'please ignore this post. it was created due to a nessary workarounddue ' +
  //     'to devvit\'s limitations. if i can find a way to not make posts then ill do it'
  // });
  res.json({ navigateTo });
});


router.get("/api/getModActionsOf", async (req, res): Promise<void> => {
  try {
    await isModerayor();
    if (typeof req.query.user !== 'string') {
      const error = String(new TypeError('Malformed Username'));
      res.status(400).json({ status: "error", isModerator: false, error });
      return;
    } const user = await reddit.getUserByUsername(req.query.user);
    if (!user) {
      res.status(404).json({
        status: "error",
        isModerator: true,
        error: String(new RangeError('User not Found')),
      }); return;
    }
    const { id, commentKarma, hasVerifiedEmail, createdAt, linkKarma, isAdmin } = user, userId = id;
    const postKarma = linkKarma, isAdminBoolean = Boolean(isAdmin), snooRL = (await user.getSnoovatarUrl()) || null;
    const modnotes = await reddit.getModNotes({ user: user.username, subreddit: context.subredditName }).all();
    res.status(200).json({
      status: "success",
      result: {
        userId, commentKarma,
        createdAt, postKarma,
        hasVerifiedEmail,
        isAdminBoolean,
        modnotes, snooRL,
      },
      isModerator: true,
      error: null
    });
    return;
  } catch (errorObject) {
    const error = String(errorObject);
    res.status(400).json({ status: "error", isModerator: false, error });
    return;
  }
});

app.use(router);
const server = createServer(app);
server.on("error", (err) => console.error(`server error; ${err.stack}`));
server.listen(getServerPort());
