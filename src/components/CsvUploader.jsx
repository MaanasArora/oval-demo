import { useState, useCallback } from 'react';
import { initPyodide, pyodide } from '../pyodide';
import { loadH5adFile, toCSVBlobs } from '../lib/h5adLoader';

export default function CsvUploader({ onLoaded }) {
  const [format, setFormat] = useState('csv'); // 'csv' | 'h5ad'
  const [commentsFile, setCommentsFile] = useState(null);
  const [votesFile, setVotesFile] = useState(null);
  const [h5adFile, setH5adFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const isReady = format === 'csv' ? commentsFile && votesFile : h5adFile;

  const handleLoad = useCallback(async () => {
    if (!isReady) return;
    setLoading(true);

    try {
      await initPyodide();

      if (format === 'h5ad') {
        const buffer = await h5adFile.arrayBuffer();
        const parsed = await loadH5adFile(buffer);
        const { commentsBlob, votesBlob } = toCSVBlobs(parsed);
        pyodide.FS.writeFile('/comments.csv', new Uint8Array(await commentsBlob.arrayBuffer()));
        pyodide.FS.writeFile('/votes.csv', new Uint8Array(await votesBlob.arrayBuffer()));
      } else {
        const commentsBuffer = await commentsFile.arrayBuffer();
        pyodide.FS.writeFile('/comments.csv', new Uint8Array(commentsBuffer));
        const votesBuffer = await votesFile.arrayBuffer();
        pyodide.FS.writeFile('/votes.csv', new Uint8Array(votesBuffer));
      }

      const jsonProxy = await pyodide.runPythonAsync(`
import numpy as np
from oval.io import read_polis
from oval.decomposition import decompose_votes

conversation = read_polis(
    "/comments.csv",
    "/votes.csv",
)

embeddings, _ = decompose_votes(conversation.votes_matrix.transpose(), num_components=2)

comments_list = [
    {
        "id": comment.id,
        "content": comment.content,
        "vote_proportion": np.array(
          np.isnan(conversation.votes_matrix[:, i]), dtype=float
        ).mean(),
    }
    for i, comment in enumerate(conversation.comments)
]

json = {
    "embeddings": embeddings.tolist(),
    "comments": comments_list,
    "num_participants": len(conversation.users),
    "num_votes": len(conversation.votes_matrix.nonzero()[0]),
}
json
`);
      const {embeddings, comments, num_participants, num_votes} = jsonProxy.toJs();
      jsonProxy.destroy();

      onLoaded(embeddings, comments, num_participants, num_votes);
    } catch (err) {
      console.error(err);
      alert('Error loading file. Check console.');
    } finally {
      setLoading(false);
    }
  }, [format, commentsFile, votesFile, h5adFile, isReady]);

  const fileInputClass =
    'border-dashed border-2 border-gray-300 rounded p-4 text-center cursor-pointer hover:border-blue-400';

  return (
    <div className="flex flex-col gap-4 p-4 w-80 bg-white border-r">
      <h2 className="text-lg font-semibold mb-2">Load Conversation</h2>

      <div className="flex gap-2">
        <button
          onClick={() => setFormat('csv')}
          className={`flex-1 py-1 px-2 rounded text-sm font-medium border ${
            format === 'csv'
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
          }`}>
          Polis CSV
        </button>
        <button
          onClick={() => setFormat('h5ad')}
          className={`flex-1 py-1 px-2 rounded text-sm font-medium border ${
            format === 'h5ad'
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
          }`}>
          H5AD
        </button>
      </div>

      {format === 'csv' ? (
        <>
          <label className={fileInputClass}>
            {commentsFile ? commentsFile.name : 'Drag or click to upload comments.csv'}
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => setCommentsFile(e.target.files[0])}
            />
          </label>

          <label className={fileInputClass}>
            {votesFile ? votesFile.name : 'Drag or click to upload participant-votes.csv'}
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => setVotesFile(e.target.files[0])}
            />
          </label>
        </>
      ) : (
        <label className={fileInputClass}>
          {h5adFile ? h5adFile.name : 'Drag or click to upload .h5ad file'}
          <input
            type="file"
            accept=".h5ad,.h5"
            className="hidden"
            onChange={(e) => setH5adFile(e.target.files[0])}
          />
        </label>
      )}

      <button
        onClick={handleLoad}
        disabled={!isReady || loading}
        className={`mt-2 px-4 py-2 rounded text-white font-medium
          ${
            isReady && !loading
              ? 'bg-blue-600 hover:bg-blue-700'
              : 'bg-gray-400 cursor-not-allowed'
          }`}>
        {loading ? 'Loading...' : 'Load Conversation'}
      </button>

      <p className="text-xs text-gray-500 mt-2">
        {format === 'csv'
          ? 'Upload the comments.csv and participant-votes.csv exported from Polis.'
          : 'Upload an .h5ad file exported from Polis or oval.'}
      </p>
    </div>
  );
}
