import React, { useState } from "react";

export default function Github() {
  const [owner, setOwner] = useState("vercel");
  const [repo, setRepo] = useState("next.js");
  const [repoInfo, setRepoInfo] = useState(null);
  const [readmeHtml, setReadmeHtml] = useState("");
  const [commits, setCommits] = useState([]);
  const [newRepoName, setNewRepoName] = useState("");
  const [prNumber, setPrNumber] = useState("");

  // PR picker state (missing in your snippet)
  const [prs, setPrs] = useState([]);
  const [selectedPr, setSelectedPr] = useState("");

  const api = (path, opts) => fetch(`http://localhost:4000${path}`, opts);

  async function loadRepo() {
    const r = await api(`/api/github/repo?owner=${owner}&repo=${repo}`);
    setRepoInfo(await r.json());
  }

  async function loadReadme() {
    const r = await api(`/api/github/readme?owner=${owner}&repo=${repo}`);
    const html = await r.text();
    setReadmeHtml(html);
  }

  async function loadCommits() {
    const r = await api(`/api/github/commits?owner=${owner}&repo=${repo}`);
    setCommits(await r.json());
  }

  async function createRepo() {
    const r = await api(`/api/github/repos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newRepoName,
        description: "Created from Collavio UI",
        isPrivate: false,
      }),
    });
    const data = await r.json();
    alert(r.ok ? `Created: ${data.full_name}` : `Error: ${data.message}`);
  }

  // Simple merge by PR number (your existing flow)
  async function mergePr() {
    if (!prNumber) {
      alert("Enter a PR number to merge");
      return;
    }
    const r = await api(
      `/api/github/prs/${prNumber}/merge?owner=${owner}&repo=${repo}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commit_title: `Merge PR #${prNumber} via Collavio`,
          merge_method: "merge",
        }),
      }
    );
    const data = await r.json();
    alert(r.ok ? `Merged: ${data.sha}` : `Error: ${data.message}`);
  }

  // PR list → select → merge
  async function loadPRs() {
    const r = await api(
      `/api/github/prs?owner=${owner}&repo=${repo}&state=open&per_page=50`
    );
    const data = await r.json();
    if (!r.ok) {
      alert(`Error: ${data.message || "failed to load PRs"}`);
      return;
    }
    setPrs(Array.isArray(data) ? data : []);
    if (Array.isArray(data) && data.length > 0) {
      setSelectedPr(String(data[0].number));
    } else {
      setSelectedPr("");
    }
  }

  async function mergeSelectedPR() {
    if (!selectedPr) {
      alert("Select a PR first");
      return;
    }
    const pr = prs.find((p) => String(p.number) === String(selectedPr));
    const title = pr ? pr.title : `Merge PR #${selectedPr}`;
    const r = await api(
      `/api/github/prs/${selectedPr}/merge?owner=${owner}&repo=${repo}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commit_title: `Merge PR #${selectedPr}: ${title}`,
          merge_method: "merge", // or "squash" | "rebase"
        }),
      }
    );
    const data = await r.json();
    if (r.ok) {
      alert(`Merged! SHA: ${data.sha}`);
      loadPRs(); // refresh list after merge
    } else {
      alert(`Merge failed: ${data.message || JSON.stringify(data)}`);
    }
  }

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">GitHub Sandbox</h1>

      <div className="grid md:grid-cols-3 gap-3 items-end">
        <div>
          <label className="block text-sm font-medium">Owner</label>
          <input
            className="border p-2 w-full"
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Repo</label>
          <input
            className="border p-2 w-full"
            value={repo}
            onChange={(e) => setRepo(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button className="border px-3 py-2" onClick={loadRepo}>
            Load Repo
          </button>
          <button className="border px-3 py-2" onClick={loadReadme}>
            Load README
          </button>
          <button className="border px-3 py-2" onClick={loadCommits}>
            Load Commits
          </button>
        </div>
      </div>

      {/* Repo card */}
      {repoInfo && (
        <div className="border rounded p-4">
          <div className="text-lg font-semibold">{repoInfo.full_name}</div>
          <div className="text-sm text-gray-600">{repoInfo.description}</div>
          <div className="mt-2 text-sm">
            ⭐ {repoInfo.stargazers_count} • 🍴 {repoInfo.forks_count} • 🐛 Issues{" "}
            {repoInfo.open_issues_count}
          </div>
          <a
            className="text-blue-600 text-sm"
            href={repoInfo.html_url}
            target="_blank"
            rel="noreferrer"
          >
            Open on GitHub
          </a>
        </div>
      )}

      {/* README (rendered HTML) */}
      {readmeHtml && (
        <div className="border rounded p-4">
          <div className="text-lg font-semibold mb-2">README</div>
          <div dangerouslySetInnerHTML={{ __html: readmeHtml }} />
        </div>
      )}

      {/* Commits */}
      {Array.isArray(commits) && commits.length > 0 && (
        <div className="border rounded p-4">
          <div className="text-lg font-semibold mb-2">Recent commits</div>
          <ul className="space-y-2">
            {commits.slice(0, 15).map((c) => (
              <li key={c.sha} className="text-sm">
                <span className="font-medium">
                  {c.commit?.author?.name}
                </span>
                : {c.commit?.message}
                <div className="text-gray-500">
                  {c.sha?.slice(0, 7)} • {c.commit?.author?.date}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Create repo */}
      <div className="border rounded p-4">
        <div className="text-lg font-semibold mb-2">Create a new repository</div>
        <div className="flex gap-2">
          <input
            className="border p-2 w-full"
            placeholder="my-new-repo"
            value={newRepoName}
            onChange={(e) => setNewRepoName(e.target.value)}
          />
          <button className="border px-3 py-2" onClick={createRepo}>
            Create
          </button>
        </div>
      </div>

      {/* Merge PR by number */}
      <div className="border rounded p-4">
        <div className="text-lg font-semibold mb-2">Merge PR by number</div>
        <div className="flex gap-2">
          <input
            className="border p-2 w-full"
            placeholder="PR number (e.g., 42)"
            value={prNumber}
            onChange={(e) => setPrNumber(e.target.value)}
          />
          <button className="border px-3 py-2" onClick={mergePr}>
            Merge
          </button>
        </div>
      </div>

      {/* PR picker (list → select → merge) */}
      <div className="border rounded p-4">
        <div className="text-lg font-semibold mb-2">Select a PR to merge</div>

        {prs.length === 0 ? (
          <>
            <div className="text-sm text-gray-600">
              No PRs loaded yet. Click “Load Open PRs”.
            </div>
            <div className="mt-3">
              <button className="border px-3 py-2" onClick={loadPRs}>
                Load Open PRs
              </button>
            </div>
          </>
        ) : (
          <>
            <select
              className="border p-2 w-full"
              value={selectedPr}
              onChange={(e) => setSelectedPr(e.target.value)}
            >
              {prs.map((pr) => (
                <option key={pr.number} value={pr.number}>
                  #{pr.number} — {pr.title} (by {pr.user?.login})
                </option>
              ))}
            </select>

            <ul className="mt-3 space-y-2 text-sm">
              {prs.slice(0, 10).map((pr) => (
                <li key={pr.number} className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">#{pr.number}</span> {pr.title}
                    <span className="ml-2 text-gray-500">
                      • {pr.head?.ref} → {pr.base?.ref}
                    </span>
                  </div>
                  <a
                    className="text-blue-600"
                    href={pr.html_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View
                  </a>
                </li>
              ))}
            </ul>

            <div className="mt-3">
              <button className="border px-3 py-2" onClick={mergeSelectedPR}>
                Merge selected PR
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
