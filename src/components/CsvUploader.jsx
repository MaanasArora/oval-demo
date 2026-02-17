import { useState, useCallback } from 'react';
import { initPyodide, pyodide } from '../pyodide';

export default function CsvUploader({ onLoaded }) {
  const [commentsFile, setCommentsFile] = useState(null);
  const [votesFile, setVotesFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLoad = useCallback(async () => {
    if (!commentsFile || !votesFile) return;
    setLoading(true);

    try {
      await initPyodide();

      // Write comments file
      const commentsBuffer = await commentsFile.arrayBuffer();
      pyodide.FS.writeFile('/comments.csv', new Uint8Array(commentsBuffer));

      // Write votes file
      const votesBuffer = await votesFile.arrayBuffer();
      pyodide.FS.writeFile('/votes.csv', new Uint8Array(votesBuffer));

      // Load conversation
      const jsonProxy = await pyodide.runPythonAsync(`
from oval.io import read_polis
from oval.decomposition import decompose_votes

conversation = read_polis(
    "/comments.csv",
    "/votes.csv",
)

embeddings, _ = decompose_votes(conversation.votes_matrix.transpose(), num_components=20)

comments_list = [
    {
        "id": comment.id,
        "content": comment.content,
    }
    for comment in conversation.comments
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

      onLoaded(embeddings, comments, num_participants, num_votes)
    } catch (err) {
      console.error(err);
      alert('Error loading CSVs. Check console.');
    } finally {
      setLoading(false);
    }
  }, [commentsFile, votesFile]);

  const fileInputClass =
    'border-dashed border-2 border-gray-300 rounded p-4 text-center cursor-pointer hover:border-blue-400';

  return (
    <div className="flex flex-col gap-4 p-4 w-80 bg-white border-r">
      <h2 className="text-lg font-semibold mb-2">Upload Polis CSVs</h2>

      <label className={fileInputClass}>
        {commentsFile
          ? commentsFile.name
          : 'Drag or click to upload comments.csv'}
        <input
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => setCommentsFile(e.target.files[0])}
        />
      </label>

      <label className={fileInputClass}>
        {votesFile
          ? votesFile.name
          : 'Drag or click to upload participant-votes.csv'}
        <input
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => setVotesFile(e.target.files[0])}
        />
      </label>
      <button
        onClick={handleLoad}
        disabled={!commentsFile || !votesFile || loading}
        className={`mt-2 px-4 py-2 rounded text-white font-medium 
          ${
            commentsFile && votesFile && !loading
              ? 'bg-blue-600 hover:bg-blue-700'
              : 'bg-gray-400 cursor-not-allowed'
          }`}>
        {loading ? 'Loading...' : 'Load Conversation'}
      </button>

      <p className="text-xs text-gray-500 mt-2">
        Upload the comments.csv and participant-votes.csv exported from Polis.
      </p>
    </div>
  );
}
