import React, { useState } from 'react';

function Miropage() {
  const [miroLink, setMiroLink] = useState('');
  const [embedLink, setEmbedLink] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setEmbedLink(miroLink);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Miro Board Embed</h2>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="mb-6">
        <label className="block mb-2 font-medium">
          Paste your public Miro board link:
        </label>
        <input
          type="url"
          value={miroLink}
          onChange={(e) => setMiroLink(e.target.value)}
          placeholder="https://miro.com/app/board/..."
          className="w-full border border-gray-300 rounded px-3 py-2 mb-3"
          required
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Load Board
        </button>
      </form>

      {/* Miro Board Embed */}
      {embedLink && (
        <div className="border rounded overflow-hidden" style={{ height: '600px' }}>
          <iframe
            src={embedLink}
            frameBorder="0"
            allowFullScreen
            style={{ width: '100%', height: '100%' }}
            title="Miro Board"
          ></iframe>
        </div>
      )}
    </div>
  );
}

export default Miropage;
