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


// === Notion setup ===
const NOTION_API = "https://api.notion.com/v1";
const NOTION_VERSION = "2022-06-28";
const NOTION_TOKEN = process.env.NOTION_TOKEN;

if (!NOTION_TOKEN || NOTION_TOKEN.trim() === "") {
  console.error("NOTION_TOKEN is missing or empty. Notion calls will fail.");
} else {
  console.log("NOTION_TOKEN loaded (length:", NOTION_TOKEN.length, ")");
}

const NOTION_HEADERS = () => {
  if (!NOTION_TOKEN || NOTION_TOKEN.trim() === "") {
    throw new Error("NOTION_TOKEN missing");
  }
  return {
    "Authorization": `Bearer ${NOTION_TOKEN.trim()}`,
    "Notion-Version": NOTION_VERSION,
    "Content-Type": "application/json",
  };
};

// Create a standalone page (NOT inside database)
app.post("/api/notion/pages", async (req, res) => {
  try {
    const r = await fetch(`${NOTION_API}/pages`, {
      method: "POST",
      headers: NOTION_HEADERS(),
      body: JSON.stringify(req.body),
    });
    const data = await r.json();
    res.status(r.status).json(data);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Append paragraph/content blocks to any page
app.patch("/api/notion/blocks/:block_id/append", async (req, res) => {
  try {
    const r = await fetch(`${NOTION_API}/blocks/${req.params.block_id}/children`, {
      method: "PATCH",
      headers: NOTION_HEADERS(),
      body: JSON.stringify(req.body),
    });
    const data = await r.json();
    res.status(r.status).json(data);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});


// // A) Identity (bot)
// app.get("/api/notion/me", async (req, res) => {
//   try {
//     const r = await fetch(`${NOTION_API}/users/me`, { headers: NOTION_HEADERS() });
//     const data = await r.json();
//     res.status(r.status).json(data);
//   } catch (e) {
//     res.status(500).json({ message: e.message });
//   }
// });

// // B) List databases (via /search with database filter)
// app.get("/api/notion/databases", async (req, res) => {
//   try {
//     const r = await fetch(`${NOTION_API}/search`, {
//       method: "POST",
//       headers: NOTION_HEADERS(),
//       body: JSON.stringify({
//         filter: { value: "database", property: "object" },
//         page_size: 50,
//       }),
//     });
//     const data = await r.json();
//     res.status(r.status).json(data);
//   } catch (e) {
//     res.status(500).json({ message: e.message });
//   }
// });

// // C) Query a database
// // POST /api/notion/query?database_id=xxxxx
// // Body: { filter, sorts, start_cursor, page_size }
// app.post("/api/notion/query", async (req, res) => {
//   const { database_id } = req.query;
//   if (!database_id) return res.status(400).json({ message: "database_id is required" });
//   try {
//     const r = await fetch(`${NOTION_API}/databases/${database_id}/query`, {
//       method: "POST",
//       headers: NOTION_HEADERS(),
//       body: JSON.stringify(req.body || {}),
//     });
//     const data = await r.json();
//     res.status(r.status).json(data);
//   } catch (e) {
//     res.status(500).json({ message: e.message });
//   }
// });

// // D) Get a page by ID
// app.get("/api/notion/pages/:page_id", async (req, res) => {
//   try {
//     const r = await fetch(`${NOTION_API}/pages/${req.params.page_id}`, { headers: NOTION_HEADERS() });
//     const data = await r.json();
//     res.status(r.status).json(data);
//   } catch (e) {
//     res.status(500).json({ message: e.message });
//   }
// });

// // E) Get children blocks for a page/block
// // GET /api/notion/blocks?block_id=xxxxx
// app.get("/api/notion/blocks", async (req, res) => {
//   const { block_id, page_size = "50", start_cursor } = req.query;
//   if (!block_id) return res.status(400).json({ message: "block_id is required" });
//   const url = new URL(`${NOTION_API}/blocks/${block_id}/children`);
//   url.searchParams.set("page_size", page_size);
//   if (start_cursor) url.searchParams.set("start_cursor", start_cursor);
//   try {
//     const r = await fetch(url, { headers: NOTION_HEADERS() });
//     const data = await r.json();
//     res.status(r.status).json(data);
//   } catch (e) {
//     res.status(500).json({ message: e.message });
//   }
// });

// // F) Create a page (usually into a database via parent.database_id)
// app.post("/api/notion/pages", async (req, res) => {
//   try {
//     const r = await fetch(`${NOTION_API}/pages`, {
//       method: "POST",
//       headers: NOTION_HEADERS(),
//       body: JSON.stringify(req.body || {}),
//     });
//     const data = await r.json();
//     res.status(r.status).json(data);
//   } catch (e) {
//     res.status(500).json({ message: e.message });
//   }
// });

// // G) Append children to a block/page
// // PATCH /api/notion/blocks/:block_id/append
// // Body: { children: [ {object:'block', type:'paragraph', paragraph:{rich_text:[...]}} ] }
// app.patch("/api/notion/blocks/:block_id/append", async (req, res) => {
//   try {
//     const r = await fetch(`${NOTION_API}/blocks/${req.params.block_id}/children`, {
//       method: "PATCH",
//       headers: NOTION_HEADERS(),
//       body: JSON.stringify(req.body || {}),
//     });
//     const data = await r.json();
//     res.status(r.status).json(data);
//   } catch (e) {
//     res.status(500).json({ message: e.message });
//   }
// });


app.listen(process.env.PORT || 4000, () =>
  console.log(`GitHub & Notion sandbox API on :${process.env.PORT || 4000}`)
);
