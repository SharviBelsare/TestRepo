import React, { useState } from "react";

export default function Notion() {
    const apiBase = "http://localhost:4000";
    const api = (path, opts) => fetch(`${apiBase}${path}`, opts);

    const [pageTitle, setPageTitle] = useState("New Collavio Page");
    const [parentPageId, setParentPageId] = useState("");
    const [createdPage, setCreatedPage] = useState(null);

    const [appendText, setAppendText] = useState("Hello from Collavio 👋");
    const [targetPageId, setTargetPageId] = useState("");
    const [result, setResult] = useState(null);
    const [err, setErr] = useState("");
    const [loading, setLoading] = useState(false);

    // add this helper
    function extractNotionId(input) {
        if (!input) return "";
        const m = input.match(
            /([0-9a-fA-F]{32}|[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/
        );
        if (!m) return "";
        const id = m[0].replace(/-/g, "");
        return id;
    }

    async function createStandalonePage() {
        setErr("");
        setLoading(true);
        try {
            const pid = extractNotionId(parentPageId);
            if (!pid) throw new Error("Parent Page ID is required (share that page with the integration).");

            const payload = {
                parent: { type: "page_id", page_id: pid },   // << required for internal integration
                properties: {
                    title: [{ type: "text", text: { content: pageTitle || "Untitled" } }],
                },
                children: [
                    {
                        object: "block",
                        type: "heading_1",
                        heading_1: { rich_text: [{ type: "text", text: { content: pageTitle || "Untitled" } }] },
                    },
                ],
            };

            const r = await api("/api/notion/pages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await r.json();
            if (!r.ok) throw new Error(data?.message || data?.error || "Failed to create page");
            setCreatedPage(data);
            setTargetPageId(data.id);
        } catch (e) {
            setErr(e.message);
        } finally {
            setLoading(false);
        }
    }


    async function createStandalonePage() {
        setErr("");
        setLoading(true);
        try {
            const parent = parentPageId
                ? { type: "page_id", page_id: parentPageId }
                : { type: "workspace", workspace: true };

            const payload = {
                parent,
                properties: {
                    title: [
                        {
                            type: "text",
                            text: { content: pageTitle },
                        },
                    ],
                },
                children: [
                    {
                        object: "block",
                        type: "heading_1",
                        heading_1: {
                            rich_text: [{ type: "text", text: { content: pageTitle } }],
                        },
                    },
                ],
            };

            const r = await api("/api/notion/pages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await r.json();
            if (!r.ok) throw new Error(data.message || "Failed to create page");
            setCreatedPage(data);
            setTargetPageId(data.id);
        } catch (e) {
            setErr(e.message);
        } finally {
            setLoading(false);
        }
    }

    async function appendContent() {
        setErr("");
        setLoading(true);
        try {
            const body = {
                children: [
                    {
                        object: "block",
                        type: "paragraph",
                        paragraph: {
                            rich_text: [{ type: "text", text: { content: appendText } }],
                        },
                    },
                ],
            };
            const r = await api(`/api/notion/blocks/${encodeURIComponent(targetPageId)}/append`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const data = await r.json();
            if (!r.ok) throw new Error(data.message || "Failed to append");
            setResult(data);
        } catch (e) {
            setErr(e.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="p-4 max-w-4xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold">🧱 Notion — Simple Page Sandbox</h1>

            {/* Create standalone page */}
            <div className="border rounded p-4 space-y-3">
                <h2 className="text-lg font-semibold">Create Standalone Page</h2>
                <div className="grid md:grid-cols-3 gap-3">
                    <div>
                        <label className="block text-sm font-medium">Page Title</label>
                        <input
                            className="border p-2 w-full"
                            value={pageTitle}
                            onChange={(e) => setPageTitle(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Parent Page ID (optional)</label>
                        <input
                            className="border p-2 w-full"
                            value={parentPageId}
                            onChange={(e) => setParentPageId(e.target.value)}
                            placeholder="Leave blank for root workspace"
                        />
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={createStandalonePage}
                            className="border px-4 py-2 w-full"
                            disabled={loading}
                        >
                            {loading ? "Creating..." : "Create Page"}
                        </button>
                    </div>
                </div>

                {createdPage && (
                    <div className="mt-3 text-sm">
                        ✅ Page created: <code>{createdPage.id}</code>
                    </div>
                )}
            </div>

            {/* Append content */}
            <div className="border rounded p-4 space-y-3">
                <h2 className="text-lg font-semibold">Add Paragraph to Page</h2>
                <div className="grid md:grid-cols-3 gap-3">
                    <div>
                        <label className="block text-sm font-medium">Target Page ID</label>
                        <input
                            className="border p-2 w-full"
                            value={targetPageId}
                            onChange={(e) => setTargetPageId(e.target.value)}
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium">Paragraph Text</label>
                        <input
                            className="border p-2 w-full"
                            value={appendText}
                            onChange={(e) => setAppendText(e.target.value)}
                        />
                    </div>
                </div>
                <button
                    onClick={appendContent}
                    className="border px-4 py-2 mt-3"
                    disabled={loading || !targetPageId}
                >
                    {loading ? "Appending..." : "Append Paragraph"}
                </button>

                {result && (
                    <div className="mt-3 text-sm">
                        ✅ {result.results?.length || 0} block(s) appended successfully.
                    </div>
                )}
            </div>

            {err && (
                <div className="border rounded p-3 bg-red-50 text-red-700 text-sm">
                    ⚠️ {err}
                </div>
            )}
        </div>
    );
}



// import React, { useEffect, useMemo, useState } from "react";

// /**
//  * Notion feasibility checker
//  * Mirrors your GitHub page patterns:
//  * - Identity check (/api/notion/me)
//  * - List databases (/api/notion/databases)
//  * - Query database (/api/notion/query?database_id=...)
//  * - Read page (/api/notion/pages/:page_id)
//  * - Read blocks (/api/notion/blocks?block_id=...)
//  * - Create page (/api/notion/pages POST)
//  * - Append paragraph block (/api/notion/blocks/:block_id/append POST)
//  *
//  * Assumes your BE is at http://localhost:4000
//  */

// export default function Notion() {
//   const apiBase = "http://localhost:4000";
//   const api = (path, opts) => fetch(`${apiBase}${path}`, opts);

//   // Identity / health
//   const [me, setMe] = useState(null);

//   // Databases & query
//   const [databases, setDatabases] = useState([]);
//   const [databaseId, setDatabaseId] = useState("");
//   const [queryJson, setQueryJson] = useState(
//     JSON.stringify(
//       {
//         // Example Notion "filter" (optional) — keep as string for easy editing
//         filter: {
//           or: [
//             // { property: "Status", status: { equals: "In Progress" } }
//           ],
//         },
//         sorts: [
//           // { property: "Created time", direction: "descending" }
//         ],
//         page_size: 10,
//       },
//       null,
//       2
//     )
//   );
//   const [queryResult, setQueryResult] = useState(null);

//   // Page & Blocks
//   const [pageId, setPageId] = useState("");
//   const [page, setPage] = useState(null);
//   const [blocks, setBlocks] = useState([]);

//   // Create Page
//   const [newPageTitle, setNewPageTitle] = useState("");
//   const [newPageDbId, setNewPageDbId] = useState("");
//   const [newPagePropsJson, setNewPagePropsJson] = useState(
//     JSON.stringify(
//       {
//         // Example Notion "properties" for database page creation
//         // "Name": { "title": [{ "text": { "content": "Hello from Collavio" } }] },
//         // "Status": { "status": { "name": "Backlog" } }
//       },
//       null,
//       2
//     )
//   );

//   // Append Block
//   const [appendBlockParentId, setAppendBlockParentId] = useState("");
//   const [appendText, setAppendText] = useState("This is a test paragraph from Collavio.");
//   const [loading, setLoading] = useState(false);
//   const [err, setErr] = useState("");

//   const busy = loading ? "opacity-60 pointer-events-none" : "";

//   // Helpers
//   function safeJsonParse(txt, fallback = {}) {
//     try {
//       if (!txt?.trim()) return fallback;
//       return JSON.parse(txt);
//     } catch (e) {
//       throw new Error(`Invalid JSON:\n${e.message}`);
//     }
//   }

//   function propertyToString(props = {}) {
//     // Best-effort extraction for common property types
//     const out = [];
//     for (const [key, val] of Object.entries(props)) {
//       if (!val) continue;
//       if (val.type === "title") {
//         const t = (val.title || [])
//           .map((t) => t?.plain_text || t?.text?.content || "")
//           .join("");
//         out.push(`${key}: ${t}`);
//       } else if (val.type === "rich_text") {
//         const t = (val.rich_text || [])
//           .map((t) => t?.plain_text || t?.text?.content || "")
//           .join("");
//         out.push(`${key}: ${t}`);
//       } else if (val.type === "select") {
//         out.push(`${key}: ${val.select?.name || ""}`);
//       } else if (val.type === "status") {
//         out.push(`${key}: ${val.status?.name || ""}`);
//       } else if (val.type === "multi_select") {
//         out.push(`${key}: ${(val.multi_select || []).map((s) => s.name).join(", ")}`);
//       } else if (val.type === "people") {
//         out.push(`${key}: ${(val.people || []).map((p) => p.name || p.id).join(", ")}`);
//       } else if (val.type === "date") {
//         out.push(`${key}: ${val.date?.start || ""} ${val.date?.end ? "→ " + val.date.end : ""}`);
//       } else if (val.type === "number") {
//         out.push(`${key}: ${val.number}`);
//       } else if (val.type === "checkbox") {
//         out.push(`${key}: ${val.checkbox ? "✅" : "❌"}`);
//       } else if (val.type === "url") {
//         out.push(`${key}: ${val.url || ""}`);
//       } else if (val.type === "email") {
//         out.push(`${key}: ${val.email || ""}`);
//       } else if (val.type === "phone_number") {
//         out.push(`${key}: ${val.phone_number || ""}`);
//       } else if (val.type === "files") {
//         out.push(`${key}: ${(val.files || []).map((f) => f.name).join(", ")}`);
//       } else {
//         out.push(`${key}: [${val.type}]`);
//       }
//     }
//     return out.join(" • ");
//   }

//   function richTextToString(rt = []) {
//     return (rt || []).map((n) => n?.plain_text || n?.text?.content || "").join("");
//   }

//   // Actions
//   async function loadMe() {
//     setErr("");
//     setLoading(true);
//     try {
//       const r = await api(`/api/notion/me`);
//       const data = await r.json();
//       if (!r.ok) throw new Error(data?.message || "Failed to load identity");
//       setMe(data);
//     } catch (e) {
//       setErr(e.message);
//     } finally {
//       setLoading(false);
//     }
//   }

//   async function loadDatabases() {
//     setErr("");
//     setLoading(true);
//     try {
//       const r = await api(`/api/notion/databases`);
//       const data = await r.json();
//       if (!r.ok) throw new Error(data?.message || "Failed to list databases");
//       setDatabases(Array.isArray(data?.results) ? data.results : data);
//       if (Array.isArray(data?.results) && data.results[0]?.id) {
//         setDatabaseId((id) => id || data.results[0].id);
//         setNewPageDbId((id) => id || data.results[0].id);
//       }
//     } catch (e) {
//       setErr(e.message);
//     } finally {
//       setLoading(false);
//     }
//   }

//   async function runQuery() {
//     setErr("");
//     setLoading(true);
//     try {
//       const body = safeJsonParse(queryJson, {});
//       const r = await api(`/api/notion/query?database_id=${encodeURIComponent(databaseId)}`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(body),
//       });
//       const data = await r.json();
//       if (!r.ok) throw new Error(data?.message || "Query failed");
//       setQueryResult(data);
//     } catch (e) {
//       setErr(e.message);
//     } finally {
//       setLoading(false);
//     }
//   }

//   async function loadPage() {
//     setErr("");
//     setLoading(true);
//     try {
//       const r = await api(`/api/notion/pages/${pageId}`);
//       const data = await r.json();
//       if (!r.ok) throw new Error(data?.message || "Failed to load page");
//       setPage(data);
//     } catch (e) {
//       setErr(e.message);
//     } finally {
//       setLoading(false);
//     }
//   }

//   async function loadBlocks() {
//     setErr("");
//     setLoading(true);
//     try {
//       const r = await api(`/api/notion/blocks?block_id=${encodeURIComponent(pageId || appendBlockParentId)}`);
//       const data = await r.json();
//       if (!r.ok) throw new Error(data?.message || "Failed to load blocks");
//       setBlocks(Array.isArray(data?.results) ? data.results : data);
//     } catch (e) {
//       setErr(e.message);
//     } finally {
//       setLoading(false);
//     }
//   }

//   async function createPage() {
//     setErr("");
//     setLoading(true);
//     try {
//       const props = safeJsonParse(newPagePropsJson, {});
//       const payload = {
//         parent: { database_id: newPageDbId },
//         properties: {
//           // Name/Title is commonly required; we set it unless user already passed one
//           Name: props?.Name || {
//             title: [{ text: { content: newPageTitle || "Untitled from Collavio" } }],
//           },
//           ...props,
//         },
//       };
//       const r = await api(`/api/notion/pages`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload),
//       });
//       const data = await r.json();
//       if (!r.ok) throw new Error(data?.message || "Failed to create page");
//       alert(`Created page: ${data?.id || "OK"}`);
//       setPageId(data?.id || "");
//       setPage(data);
//     } catch (e) {
//       setErr(e.message);
//     } finally {
//       setLoading(false);
//     }
//   }

//   async function appendParagraph() {
//     setErr("");
//     setLoading(true);
//     try {
//       const body = {
//         children: [
//           {
//             object: "block",
//             type: "paragraph",
//             paragraph: {
//               rich_text: [{ type: "text", text: { content: appendText } }],
//             },
//           },
//         ],
//       };
//       const r = await api(`/api/notion/blocks/${encodeURIComponent(appendBlockParentId)}/append`, {
//         method: "PATCH",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(body),
//       });
//       const data = await r.json();
//       if (!r.ok) throw new Error(data?.message || "Failed to append block");
//       alert("Paragraph appended");
//       // Optionally refresh blocks:
//       if (appendBlockParentId) await loadBlocks();
//     } catch (e) {
//       setErr(e.message);
//     } finally {
//       setLoading(false);
//     }
//   }

//   // Auto-check identity on first mount (nice DX)
//   useEffect(() => {
//     loadMe().catch(() => {});
//   }, []);

//   const identityLabel = useMemo(() => {
//     if (!me) return "—";
//     const bot = me?.bot || me;
//     const name = bot?.owner?.user?.name || bot?.name || bot?.id || "Notion Bot";
//     return name;
//   }, [me]);

//   return (
//     <div className="p-4 max-w-6xl mx-auto space-y-6">
//       <h1 className="text-2xl font-bold">Notion Sandbox</h1>

//       {/* Top bar */}
//       <div className={`grid md:grid-cols-3 gap-3 items-end ${busy}`}>
//         <div className="border rounded p-3">
//           <div className="text-sm text-gray-600">Integration Identity</div>
//           <div className="text-base font-semibold">{identityLabel}</div>
//           <div className="text-xs text-gray-500 break-all">{me?.bot?.id || me?.id || ""}</div>
//           <button className="mt-2 border px-3 py-2 text-sm" onClick={loadMe}>
//             Re-check Identity
//           </button>
//         </div>

//         <div className="border rounded p-3">
//           <div className="text-sm font-medium mb-1">Database ID</div>
//           <input
//             className="border p-2 w-full"
//             placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
//             value={databaseId}
//             onChange={(e) => setDatabaseId(e.target.value)}
//           />
//           <div className="mt-2 flex gap-2">
//             <button className="border px-3 py-2 text-sm" onClick={loadDatabases}>
//               List Databases
//             </button>
//             <button className="border px-3 py-2 text-sm" onClick={runQuery} disabled={!databaseId}>
//               Query Database
//             </button>
//           </div>
//         </div>

//         <div className="border rounded p-3">
//           <div className="text-sm font-medium mb-1">Page / Block Parent ID</div>
//           <input
//             className="border p-2 w-full"
//             placeholder="Page ID (for read/blocks) or Parent Block ID (for append)"
//             value={pageId}
//             onChange={(e) => setPageId(e.target.value)}
//           />
//           <div className="mt-2 grid grid-cols-2 gap-2">
//             <button className="border px-3 py-2 text-sm" onClick={loadPage} disabled={!pageId}>
//               Load Page
//             </button>
//             <button
//               className="border px-3 py-2 text-sm"
//               onClick={() => {
//                 setAppendBlockParentId(pageId);
//                 loadBlocks();
//               }}
//               disabled={!pageId}
//             >
//               Load Blocks
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Query JSON editor */}
//       <div className={`border rounded p-4 ${busy}`}>
//         <div className="text-lg font-semibold mb-2">Database Query (JSON payload)</div>
//         <textarea
//           className="border p-2 w-full font-mono text-sm min-h-[140px]"
//           value={queryJson}
//           onChange={(e) => setQueryJson(e.target.value)}
//           spellCheck={false}
//         />
//         <div className="text-xs text-gray-600 mt-1">
//           Tip: Paste your Notion <code>filter</code>/<code>sorts</code>/<code>page_size</code> here.
//         </div>
//       </div>

//       {/* Create Page */}
//       <div className={`border rounded p-4 ${busy}`}>
//         <div className="text-lg font-semibold mb-2">Create a Page in a Database</div>
//         <div className="grid md:grid-cols-3 gap-3">
//           <div>
//             <label className="block text-sm font-medium mb-1">Database ID</label>
//             <input
//               className="border p-2 w-full"
//               value={newPageDbId}
//               onChange={(e) => setNewPageDbId(e.target.value)}
//               placeholder="database_id"
//             />
//           </div>
//           <div>
//             <label className="block text-sm font-medium mb-1">Title</label>
//             <input
//               className="border p-2 w-full"
//               value={newPageTitle}
//               onChange={(e) => setNewPageTitle(e.target.value)}
//               placeholder="New page title"
//             />
//           </div>
//           <div className="flex items-end">
//             <button className="border px-3 py-2 w-full" onClick={createPage} disabled={!newPageDbId}>
//               Create Page
//             </button>
//           </div>
//         </div>
//         <div className="mt-3">
//           <label className="block text-sm font-medium mb-1">Properties (JSON)</label>
//           <textarea
//             className="border p-2 w-full font-mono text-sm min-h-[120px]"
//             value={newPagePropsJson}
//             onChange={(e) => setNewPagePropsJson(e.target.value)}
//             spellCheck={false}
//           />
//           <div className="text-xs text-gray-600 mt-1">
//             If you leave <code>Name</code> undefined, a default title is added.
//           </div>
//         </div>
//       </div>

//       {/* Append Paragraph */}
//       <div className={`border rounded p-4 ${busy}`}>
//         <div className="text-lg font-semibold mb-2">Append Paragraph Block</div>
//         <div className="grid md:grid-cols-3 gap-3 items-end">
//           <div>
//             <label className="block text-sm font-medium mb-1">Parent Page/Block ID</label>
//             <input
//               className="border p-2 w-full"
//               value={appendBlockParentId}
//               onChange={(e) => setAppendBlockParentId(e.target.value)}
//               placeholder="page_or_block_id"
//             />
//           </div>
//           <div className="md:col-span-2">
//             <label className="block text-sm font-medium mb-1">Text</label>
//             <input
//               className="border p-2 w-full"
//               value={appendText}
//               onChange={(e) => setAppendText(e.target.value)}
//               placeholder="Paragraph to append"
//             />
//           </div>
//         </div>
//         <div className="mt-3">
//           <button className="border px-3 py-2" onClick={appendParagraph} disabled={!appendBlockParentId}>
//             Append
//           </button>
//         </div>
//       </div>

//       {/* Databases list */}
//       {Array.isArray(databases) && databases.length > 0 && (
//         <div className="border rounded p-4">
//           <div className="text-lg font-semibold mb-2">Databases</div>
//           <ul className="space-y-2">
//             {databases.slice(0, 20).map((db) => {
//               const title =
//                 db?.title?.map((t) => t?.plain_text || t?.text?.content || "").join("") || "Untitled DB";
//               return (
//                 <li key={db.id} className="text-sm flex items-start justify-between gap-2">
//                   <div>
//                     <div className="font-medium">{title}</div>
//                     <div className="text-gray-500">{db.id}</div>
//                   </div>
//                   <div className="flex gap-2">
//                     <button
//                       className="border px-2 py-1 text-xs"
//                       onClick={() => {
//                         setDatabaseId(db.id);
//                         setNewPageDbId(db.id);
//                       }}
//                     >
//                       Use for Query
//                     </button>
//                   </div>
//                 </li>
//               );
//             })}
//           </ul>
//         </div>
//       )}

//       {/* Query results */}
//       {queryResult && (
//         <div className="border rounded p-4">
//           <div className="text-lg font-semibold mb-2">Query Results</div>
//           <ul className="space-y-2">
//             {(queryResult.results || []).map((row) => {
//               const titleProp =
//                 row?.properties?.Name ||
//                 row?.properties?.Title ||
//                 row?.properties?.name ||
//                 row?.properties?.title;
//               const titleText = titleProp?.title
//                 ? titleProp.title.map((t) => t.plain_text || t?.text?.content || "").join("")
//                 : "[no title]";
//               return (
//                 <li key={row.id} className="text-sm">
//                   <div className="font-medium">{titleText}</div>
//                   <div className="text-gray-500">{row.id}</div>
//                   <div className="text-gray-700">{propertyToString(row.properties)}</div>
//                 </li>
//               );
//             })}
//           </ul>
//         </div>
//       )}

//       {/* Page card */}
//       {page && (
//         <div className="border rounded p-4">
//           <div className="text-lg font-semibold mb-2">Page</div>
//           <div className="text-sm">
//             <div className="font-medium">{page?.id}</div>
//             {"properties" in page && (
//               <div className="text-gray-700 mt-1">{propertyToString(page.properties)}</div>
//             )}
//           </div>
//         </div>
//       )}

//       {/* Blocks */}
//       {Array.isArray(blocks) && blocks.length > 0 && (
//         <div className="border rounded p-4">
//           <div className="text-lg font-semibold mb-2">Blocks</div>
//           <ul className="space-y-2 text-sm">
//             {blocks.map((b) => {
//               const t =
//                 b?.[b.type]?.rich_text
//                   ? richTextToString(b[b.type].rich_text)
//                   : b?.[b.type]?.text
//                   ? richTextToString(b[b.type].text)
//                   : "";
//               return (
//                 <li key={b.id} className="flex items-start justify-between gap-2">
//                   <div>
//                     <div className="font-medium">{b.type}</div>
//                     {t && <div className="text-gray-700">{t}</div>}
//                     <div className="text-gray-500">{b.id}</div>
//                   </div>
//                 </li>
//               );
//             })}
//           </ul>
//         </div>
//       )}

//       {/* Error */}
//       {err && (
//         <div className="border rounded p-4 bg-red-50 text-red-700">
//           <div className="font-semibold">Error</div>
//           <div className="text-sm whitespace-pre-wrap">{err}</div>
//         </div>
//       )}
//     </div>
//   );
// }
