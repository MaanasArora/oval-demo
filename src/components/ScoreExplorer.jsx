import { useState } from 'react';

function ScoreBar({ score, maxScore }) {
  const percent = (Math.abs(score) / maxScore) * 100;

  const color =
    score > 0 ? 'bg-blue-500' : score < 0 ? 'bg-red-500' : 'bg-gray-300';

  return (
    <div className="w-full h-2 bg-gray-200 rounded mt-2">
      <div
        className={`h-2 rounded ${color}`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

export default function ScoreExplorer({
  comments,
  confidence,
  commentScores,
  onSelectComment,
  onBack,
}) {
  const [sortOrder, setSortOrder] = useState('desc');

  if (!commentScores) {
    return (
      <div className="w-80 bg-white border-l p-4">
        <div className="text-gray-400 text-sm">No scores yet</div>
      </div>
    );
  }

  const scoredComments = comments
    .map((comment) => ({
      ...comment,

      score: commentScores[comment.id],
    }))
    .sort((a, b) =>
      sortOrder === 'desc' ? b.score - a.score : a.score - b.score
    );

  const maxScore = Math.max(...scoredComments.map((c) => Math.abs(c.score)));

  return (
    <div className="w-80 bg-white border-l flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div
          onClick={onBack}
          className="text-sm text-blue-600 cursor-pointer mb-2">
          ← Back to Variable
        </div>
        <div className="font-semibold mb-2">Explore Variable</div>

        <button
          onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
          className="
            text-sm px-3 py-1
            bg-gray-100 rounded
          ">
          Sort:
          {sortOrder === 'desc' ? ' High → Low' : ' Low → High'}
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {scoredComments.map((comment) => (
          <div
            key={comment.id}
            onClick={() => onSelectComment(comment.id)}
            className="
              p-3 border-b cursor-pointer
              hover:bg-blue-50
            ">
            <div className="text-sm">{comment.content}</div>

            <div className="flex items-center gap-2 mt-1">
              <span
                className={`
    text-xs px-2 py-1 rounded

    ${
      comment.score > 0
        ? 'bg-blue-100 text-blue-700'
        : comment.score < 0
        ? 'bg-red-100 text-red-700'
        : 'bg-gray-100 text-gray-600'
    }
  `}>
                {comment.score > 0 ? '+' : ''}
                {comment.score.toFixed(2)}
              </span>

              <ScoreBar score={comment.score} maxScore={maxScore} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
