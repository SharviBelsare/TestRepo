import React, { useState } from "react";

function FigmaEmbed() {
  const [embedCode, setEmbedCode] = useState("");
  const [src, setSrc] = useState("");

  const handleEmbed = () => {
    if (embedCode.includes("<iframe")) {
      // Extract src from iframe code
      const match = embedCode.match(/src="([^"]+)"/);
      if (match) {
        setSrc(match[1]);
      }
    } else if (embedCode.startsWith("https://")) {
      // If user pastes only the embed link
      setSrc(embedCode);
    } else {
      alert("Please paste a valid Figma embed code or embed URL.");
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold mb-2">Embed Figma / FigJam</h2>

      {/* Input box */}
      <textarea
        placeholder="Paste your Figma embed code or embed link"
        value={embedCode}
        onChange={(e) => setEmbedCode(e.target.value)}
        className="border p-2 w-full rounded mb-2 h-24"
      />

      {/* Button */}
      <button
        onClick={handleEmbed}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Show Embed
      </button>

      {/* Embed preview */}
      {src && (
        <div className="mt-4">
          <iframe
            style={{ border: "1px solid #ccc" }}
            width="100%"
            height="500"
            src={src}
            allowFullScreen
          />
        </div>
      )}
    </div>
  );
}

export default FigmaEmbed;
