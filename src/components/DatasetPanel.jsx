import { useState, useMemo } from 'react';

export default function DatasetPanel({
  comments = [],
  anchors = new Set(),
  onToggleAnchor,
  numParticipants,
  numVotes,
}) {
  const [search, setSearch] = useState('');

  const filteredComments = useMemo(() => {
    if (!search) return comments;
    const s = search.toLowerCase();
    return comments.filter((c) => c.content.toLowerCase().includes(s));
  }, [comments, search]);

  return (
    <div className="w-72 bg-white border-r flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="font-semibold text-gray-800">Dataset</div>

        <div className="text-sm text-gray-500 mt-1">
          {comments.length} comments
        </div>

        <div className="text-sm text-gray-500 mt-1">
          {numParticipants} participants
        </div>

        <div className="text-sm text-gray-500 mt-1">
          {numVotes} votes
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search comments..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="
            mt-3 w-full px-3 py-2 text-sm
            border rounded-md
            focus:outline-none focus:ring-2 focus:ring-blue-500
          "
        />
      </div>

      {/* Comments list */}
      <div className="flex-1 overflow-y-auto">
        {filteredComments.length === 0 && (
          <div className="p-4 text-sm text-gray-400">No comments found</div>
        )}

        {filteredComments.map((comment) => {
          const selected = anchors.has(comment.id);

          return (
            <div
              key={comment.id}
              onClick={() => onToggleAnchor(comment.id)}
              className={`
                p-3 border-b cursor-pointer
                hover:bg-gray-50
                transition

                ${selected ? 'bg-blue-50 border-blue-200' : ''}
              `}>
              <div className="flex items-start gap-2">
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={selected}
                  readOnly
                  className="mt-1"
                />

                {/* Content */}
                <div className="text-sm text-gray-800 line-clamp-3">
                  {comment.content}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-3 border-t text-xs text-gray-500">
        {anchors.size} anchors selected
      </div>
    </div>
  );
}
