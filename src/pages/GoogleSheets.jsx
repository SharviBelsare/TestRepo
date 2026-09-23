import React, { useState } from "react";

function decodeHtmlEntities(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function extractGid(url) {
  const match = url.match(/[?#&]gid=(\d+)/);
  return match ? match[1] : null;
}

function extractSrc(input) {
  const decoded = decodeHtmlEntities(input.trim());
  const iframeMatch = decoded.match(/src=["']([^"']+)["']/i);
  return iframeMatch ? iframeMatch[1] : decoded;
}

function toSheetsEmbedUrl(input, mode) {
  const trimmed = input.trim();
  if (!trimmed) return { error: "Paste a Google Sheet URL first." };

  const rawUrl = extractSrc(trimmed);

  const publishedMatch = rawUrl.match(
    /docs\.google\.com\/spreadsheets\/d\/e\/([a-zA-Z0-9-_]+)/
  );
  const idMatch = rawUrl.match(
    /docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/
  );
  const gid = extractGid(rawUrl);

  if (publishedMatch) {
    const params = new URLSearchParams({ widget: "true", headers: "false" });
    if (gid) params.set("gid", gid);
    return {
      url: `https://docs.google.com/spreadsheets/d/e/${publishedMatch[1]}/pubhtml?${params}`,
    };
  }

  if (idMatch && idMatch[1] !== "e") {
    const id = idMatch[1];
    if (mode === "editor") {
      const params = new URLSearchParams({ rm: "minimal", widget: "true" });
      if (gid) params.set("gid", gid);
      return { url: `https://docs.google.com/spreadsheets/d/${id}/edit?${params}` };
    }

    const params = new URLSearchParams({ widget: "true", headers: "false" });
    if (gid) params.set("gid", gid);
    return { url: `https://docs.google.com/spreadsheets/d/${id}/preview?${params}` };
  }

  if (/docs\.google\.com\/spreadsheets\//.test(rawUrl)) {
    return { url: rawUrl };
  }

  return { error: "That doesn't look like a Google Sheets URL or embed code." };
}

function toPublishedEmbedUrl(input) {
  const trimmed = input.trim();
  if (!trimmed) return { error: "Paste the Publish to web embed code or URL first." };

  const rawUrl = extractSrc(trimmed);
  const publishedMatch = rawUrl.match(
    /docs\.google\.com\/spreadsheets\/d\/e\/([a-zA-Z0-9-_]+)/
  );

  if (publishedMatch) {
    try {
      const parsed = new URL(rawUrl);
      if (!parsed.searchParams.has("widget")) parsed.searchParams.set("widget", "true");
      if (!parsed.searchParams.has("headers")) parsed.searchParams.set("headers", "false");
      return { url: parsed.toString() };
    } catch {
      return { url: rawUrl };
    }
  }

  if (/docs\.google\.com\/spreadsheets\//.test(rawUrl)) {
    return { url: rawUrl };
  }

  return { error: "That doesn't look like a Publish to web embed. Copy the iframe from File → Share → Publish to web → Embed." };
}

export default function GoogleSheets() {
  const [sheetUrl, setSheetUrl] = useState("");
  const [embedCode, setEmbedCode] = useState("");
  const [resolvedUrl, setResolvedUrl] = useState("");
  const [mode, setMode] = useState("preview");
  const [error, setError] = useState("");
  const [activeSource, setActiveSource] = useState("url");

  const loadFromUrl = (e) => {
    e.preventDefault();
    const result = toSheetsEmbedUrl(sheetUrl, mode);
    if (result.error) {
      setError(result.error);
      setResolvedUrl("");
      return;
    }
    setError("");
    setActiveSource("url");
    setResolvedUrl(result.url);
  };

  const loadFromEmbed = (e) => {
    e.preventDefault();
    const result = toPublishedEmbedUrl(embedCode);
    if (result.error) {
      setError(result.error);
      setResolvedUrl("");
      return;
    }
    setError("");
    setActiveSource("embed");
    setResolvedUrl(result.url);
  };

  const handleModeChange = (nextMode) => {
    setMode(nextMode);
    if (activeSource !== "url" || !sheetUrl.trim() || !resolvedUrl) return;
    const result = toSheetsEmbedUrl(sheetUrl, nextMode);
    if (result.url) {
      setError("");
      setResolvedUrl(result.url);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-2">Google Sheets Embed</h2>
      <p className="text-sm text-gray-600 mb-4">
        Use a regular sheet URL, or paste the iframe from File → Share → Publish to the web → Embed.
      </p>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <form onSubmit={loadFromUrl} className="border rounded p-4 space-y-3">
          <h3 className="font-semibold">Option 1: Sheet URL</h3>
          <label className="block text-sm font-medium" htmlFor="sheet-url">
            Share or edit URL
          </label>
          <input
            id="sheet-url"
            type="url"
            value={sheetUrl}
            onChange={(e) => setSheetUrl(e.target.value)}
            placeholder="https://docs.google.com/spreadsheets/d/..."
            className="w-full border border-gray-300 rounded px-3 py-2"
            required
          />
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Load from URL
            </button>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">View:</span>
              <button
                type="button"
                onClick={() => handleModeChange("preview")}
                className={`border px-3 py-1 rounded ${
                  mode === "preview" ? "bg-gray-900 text-white" : "bg-white"
                }`}
              >
                Preview
              </button>
              <button
                type="button"
                onClick={() => handleModeChange("editor")}
                className={`border px-3 py-1 rounded ${
                  mode === "editor" ? "bg-gray-900 text-white" : "bg-white"
                }`}
              >
                Editor
              </button>
            </div>
          </div>
        </form>

        <form onSubmit={loadFromEmbed} className="border rounded p-4 space-y-3">
          <h3 className="font-semibold">Option 2: Publish to web embed</h3>
          <label className="block text-sm font-medium" htmlFor="embed-code">
            Embed iframe or published URL
          </label>
          <textarea
            id="embed-code"
            value={embedCode}
            onChange={(e) => setEmbedCode(e.target.value)}
            placeholder='<iframe src="https://docs.google.com/spreadsheets/d/e/.../pubhtml?widget=true&headers=false"></iframe>'
            className="w-full border border-gray-300 rounded px-3 py-2 h-24 font-mono text-sm"
            required
          />
          <button
            type="submit"
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Load from Embed
          </button>
        </form>
      </div>

      {error && (
        <div className="border rounded p-3 mb-4 bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      {resolvedUrl && (
        <div className="space-y-2">
          <div className="text-xs text-gray-500 break-all">
            Embed URL: <code>{resolvedUrl}</code>
          </div>
          <div className="border rounded overflow-hidden" style={{ height: "70vh" }}>
            <iframe
              src={resolvedUrl}
              title="Google Sheet"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  );
}
