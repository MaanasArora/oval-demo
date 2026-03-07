import { useState, useCallback } from 'react';
import { initPyodide, pyodide } from '../pyodide';
import { loadH5adFile } from '../lib/h5adLoader';

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

      let jsonProxy;

      if (format === 'h5ad') {
        const buffer = await h5adFile.arrayBuffer();
        const parsed = await loadH5adFile(buffer);

        // Pass parsed data to Pyodide — bypass read_polis() which requires author-id
        pyodide.globals.set('_h5ad_comment_texts', parsed.comments.map(c => c.body));
        pyodide.globals.set('_h5ad_n_obs', parsed.participantIds.length);
        pyodide.globals.set('_h5ad_n_var', parsed.commentIds.length);
        pyodide.globals.set('_h5ad_votes_flat', parsed.votesMatrix.flat().map(v => v === null ? NaN : v));

        jsonProxy = await pyodide.runPythonAsync(`
import numpy as np
from oval.conversation import Conversation, Comment, User
from oval.decomposition import decompose_votes

comment_texts = list(_h5ad_comment_texts)
n_obs = int(_h5ad_n_obs)
n_var = int(_h5ad_n_var)

users = [User(id=i) for i in range(n_obs)]
comments = [Comment(id=i, author=users[0], content=str(comment_texts[i])) for i in range(n_var)]
votes_matrix = np.array(list(_h5ad_votes_flat), dtype=float).reshape(n_obs, n_var)
conversation = Conversation(comments=comments, users=users, votes_matrix=votes_matrix)

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
      } else {
        const commentsBuffer = await commentsFile.arrayBuffer();
        pyodide.FS.writeFile('/comments.csv', new Uint8Array(commentsBuffer));
        const votesBuffer = await votesFile.arrayBuffer();
        pyodide.FS.writeFile('/votes.csv', new Uint8Array(votesBuffer));

        jsonProxy = await pyodide.runPythonAsync(`
import numpy as np
from oval.io import read_polis
from oval.decomposition import decompose_votes

conversation = read_polis(
    "/comments.csv",
    "/votes.csv",
)

comment_embeddings, _ = decompose_votes(conversation.votes_matrix.transpose(), num_components=2)
participant_embeddings, _ = decompose_votes(conversation.votes_matrix, num_components=2)

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

participants_list = [
    {
        "id": participant.id,
        "num_votes": np.count_nonzero(conversation.votes_matrix[i, :]),
    }
    for i, participant in enumerate(conversation.users)
]

json = {
    "comment_embeddings": comment_embeddings.tolist(),
    "participant_embeddings": participant_embeddings.tolist(),
    "comments": comments_list,
    "participants": participants_list,
    "num_participants": len(conversation.users),
    "num_votes": len(conversation.votes_matrix.nonzero()[0]),
}
json
`);
      const {
        comment_embeddings,
        participant_embeddings,
        comments,
        participants,
        num_participants,
        num_votes,
      } = jsonProxy.toJs();
      jsonProxy.destroy();

      onLoaded(
        comment_embeddings,
        participant_embeddings,
        comments,
        participants,
        num_participants,
        num_votes
      );
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
