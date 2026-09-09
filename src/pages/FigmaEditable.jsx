// API Integration
import React, { useState } from "react";

function FigmaAPIEmbed() {
  const [fileId, setFileId] = useState("");
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  const accessToken = "YOUR_FIGMA_PERSONAL_ACCESS_TOKEN"; // ⚠️ Don't expose in production, use a backend proxy

  const fetchFigmaImages = async () => {
    if (!fileId) return;
    setLoading(true);

    try {
      // Step 1: Get file data
      const fileResponse = await fetch(
        `https://api.figma.com/v1/files/${fileId}`,
        {
          headers: { "X-Figma-Token": accessToken },
        }
      );
      const fileData = await fileResponse.json();

      // Extract all top-level frame IDs
      const frameIds = fileData.document.children
        .flatMap((page) =>
          page.children.filter((node) => node.type === "FRAME")
        )
        .map((frame) => frame.id);

      // Step 2: Request image URLs for those frames
      const imageResponse = await fetch(
        `https://api.figma.com/v1/images/${fileId}?ids=${frameIds.join(",")}&format=png`,
        {
          headers: { "X-Figma-Token": accessToken },
        }
      );
      const imageData = await imageResponse.json();

      // Save images
      setImages(Object.values(imageData.images));
    } catch (err) {
      console.error("Error fetching Figma data:", err);
    }

    setLoading(false);
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold mb-2">Figma API Example</h2>

      {/* Input for file ID */}
      <input
        type="text"
        placeholder="Enter Figma file ID"
        value={fileId}
        onChange={(e) => setFileId(e.target.value)}
        className="border p-2 w-full rounded mb-2"
      />

      <button
        onClick={fetchFigmaImages}
        className="bg-blue-600 text-white px-4 py-2 rounded"
        disabled={loading}
      >
        {loading ? "Loading..." : "Fetch Frames"}
      </button>

      {/* Show images */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        {images.map((url, i) => (
          <img
            key={i}
            src={url}
            alt={`Figma frame ${i}`}
            className="border rounded shadow"
          />
        ))}
      </div>
    </div>
  );
}

export default FigmaAPIEmbed;
