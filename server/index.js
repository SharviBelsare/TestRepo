// Workig endpoints except PR
// server/index.js
import 'dotenv/config';   // load .env at startup
import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// === GitHub setup ===
const GITHUB_API = "https://api.github.com";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

// Safe console log (don’t print whole token)
if (!GITHUB_TOKEN || GITHUB_TOKEN.trim() === "") {
  console.error("GITHUB_TOKEN is missing or empty. Expect 401 errors from GitHub.");
} else {
  console.log("GITHUB_TOKEN loaded (length:", GITHUB_TOKEN.length, ")");
}

const GH_HEADERS = () => {
  const h = {
    "Accept": "application/vnd.github+json",
    "User-Agent": "collavio-sandbox",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (GITHUB_TOKEN && GITHUB_TOKEN.trim() !== "") {
    h["Authorization"] = `token ${GITHUB_TOKEN.trim()}`; // use token var
  }
  return h;
};

// === Routes ===

// A) Get repo metadata
app.get("/api/github/repo", async (req, res) => {
  try {
    const { owner, repo } = req.query;
    const r = await fetch(`${GITHUB_API}/repos/${owner}/${repo}`, { headers: GH_HEADERS() });
    const data = await r.json();
    res.status(r.status).json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// A) Get README (rendered HTML)
app.get("/api/github/readme", async (req, res) => {
  try {
    const { owner, repo } = req.query;
    const r = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/readme`, {
      headers: { ...GH_HEADERS(), "Accept": "application/vnd.github.html+json" }
    });
    const html = await r.text();
    res.status(r.status).send(html);
  } catch (e) { res.status(500).send(e.message); }
});

// B) List commits
app.get("/api/github/commits", async (req, res) => {
  try {
    const { owner, repo, sha } = req.query;
    const url = new URL(`${GITHUB_API}/repos/${owner}/${repo}/commits`);
    if (sha) url.searchParams.set("sha", sha);
    const r = await fetch(url, { headers: GH_HEADERS() });
    const data = await r.json();
    res.status(r.status).json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// C) Create a repository
app.post("/api/github/repos", async (req, res) => {
  try {
    const { name, description, isPrivate } = req.body;
    const r = await fetch(`${GITHUB_API}/user/repos`, {
      method: "POST",
      headers: GH_HEADERS(),
      body: JSON.stringify({
        name,
        description,
        private: !!isPrivate,
        auto_init: true
      })
    });
    const data = await r.json();
    res.status(r.status).json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// D) Merge a PR
// List PRs
app.get("/api/github/prs", async (req, res) => {
    try {
      const { owner, repo, state = "open", per_page = "50", page = "1" } = req.query;
      const url = new URL(`${GITHUB_API}/repos/${owner}/${repo}/pulls`);
      url.searchParams.set("state", state);      // open | closed | all
      url.searchParams.set("per_page", per_page);
      url.searchParams.set("page", page);
      const r = await fetch(url, { headers: GH_HEADERS() });
      const data = await r.json();
      res.status(r.status).json(data);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  
// app.put("/api/github/prs/:number/merge", async (req, res) => {
//   try {
//     const { owner, repo } = req.query;
//     const { number } = req.params;
//     const { commit_title, merge_method } = req.body;
//     const r = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/pulls/${number}/merge`, {
//       method: "PUT",
//       headers: GH_HEADERS(),
//       body: JSON.stringify({
//         commit_title,
//         merge_method: merge_method || "merge"
//       })
//     });
//     const data = await r.json();
//     res.status(r.status).json(data);
//   } catch (e) { res.status(500).json({ error: e.message }); }
// });

app.listen(process.env.PORT || 4000, () =>
  console.log(`GitHub sandbox API on :${process.env.PORT || 4000}`)
);

// Not  Working
// // server/index.js
// import express from "express";
// import fetch from "node-fetch";
// import cors from "cors";

// const app = express();
// app.use(cors());
// app.use(express.json());

// const GITHUB_API = "https://api.github.com";
// const GH_HEADERS = () => ({
//   "Accept": "application/vnd.github+json",
//   "Authorization": `Bearer ${process.env.GITHUB_TOKEN}`, // classic PAT for dev
//   "X-GitHub-Api-Version": "2022-11-28"
// });

// // A) Get repo metadata
// app.get("/api/github/repo", async (req, res) => {
//   try {
//     const { owner, repo } = req.query;
//     const r = await fetch(`${GITHUB_API}/repos/${owner}/${repo}`, { headers: GH_HEADERS() });
//     const data = await r.json();
//     res.status(r.status).json(data);
//   } catch (e) { res.status(500).json({ error: e.message }); }
// });

// // A) Get README (rendered HTML)
// app.get("/api/github/readme", async (req, res) => {
//   try {
//     const { owner, repo } = req.query;
//     const r = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/readme`, {
//       headers: { ...GH_HEADERS(), "Accept": "application/vnd.github.html+json" }
//     });
//     const html = await r.text(); // README HTML
//     res.status(r.status).send(html);
//   } catch (e) { res.status(500).send(e.message); }
// });

// // B) List commits
// app.get("/api/github/commits", async (req, res) => {
//   try {
//     const { owner, repo, sha } = req.query; // sha = branch (optional)
//     const url = new URL(`${GITHUB_API}/repos/${owner}/${repo}/commits`);
//     if (sha) url.searchParams.set("sha", sha);
//     const r = await fetch(url, { headers: GH_HEADERS() });
//     const data = await r.json();
//     res.status(r.status).json(data);
//   } catch (e) { res.status(500).json({ error: e.message }); }
// });

// // C) Create a repository (under the token's user)
// app.post("/api/github/repos", async (req, res) => {
//   try {
//     const { name, description, isPrivate } = req.body;
//     const r = await fetch(`${GITHUB_API}/user/repos`, {
//       method: "POST",
//       headers: GH_HEADERS(),
//       body: JSON.stringify({
//         name,
//         description,
//         private: !!isPrivate,
//         auto_init: true
//       })
//     });
//     const data = await r.json();
//     res.status(r.status).json(data);
//   } catch (e) { res.status(500).json({ error: e.message }); }
// });

// // D) Merge a PR
// app.put("/api/github/prs/:number/merge", async (req, res) => {
//   try {
//     const { owner, repo } = req.query;
//     const { number } = req.params;
//     const { commit_title, merge_method } = req.body; // merge/squash/rebase
//     const r = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/pulls/${number}/merge`, {
//       method: "PUT",
//       headers: GH_HEADERS(),
//       body: JSON.stringify({
//         commit_title,
//         merge_method: merge_method || "merge"
//       })
//     });
//     const data = await r.json();
//     res.status(r.status).json(data);
//   } catch (e) { res.status(500).json({ error: e.message }); }
// });

// app.listen(4000, () => console.log("GitHub sandbox API on :4000"));
