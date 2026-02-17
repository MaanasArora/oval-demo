import { useState } from 'react';

export default function VariablePanel({
  anchors,
  comments,
  scores,
  onCompute,
  onUpdateRating,
}) {
  const [name, setName] = useState('New Variable');
  const [loading, setLoading] = useState(false);

  async function handleCompute() {
    const anchorsWithRatings = Array.from(anchors.entries());

    setLoading(true);

    await onCompute({
      name,
      anchors: Object.fromEntries(anchorsWithRatings),
    });

    setLoading(false);
  }

  const anchorComments = comments.filter((c) => anchors.has(c.id));

  return (
    <div className="w-80 bg-white border-l flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="font-semibold">Variable</div>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-3 w-full border rounded px-2 py-1"
        />
      </div>

      {/* Anchor list */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="text-sm font-medium mb-2">Anchors ({anchors.size})</div>

        {anchorComments.map((comment) => {
          const rating = anchors.get(comment.id) ?? 0;

          return (
            <div key={comment.id} className="mb-4">
              <div className="text-sm mb-1">{comment.content}</div>

              {/* SLIDER */}
              <input
                type="range"
                min="-2"
                max="2"
                step="1"
                value={rating}
                onChange={(e) =>
                  onUpdateRating(comment.id, Number(e.target.value))
                }
                className="w-full"
              />

              <div className="text-xs text-gray-500">Rating: {rating}</div>
            </div>
          );
        })}
      </div>

      {/* Compute */}
      <div className="p-4 border-t">
        <button
          onClick={handleCompute}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded">
          {loading ? 'Computing...' : 'Compute Variable'}
        </button>
      </div>
    </div>
  );
}
