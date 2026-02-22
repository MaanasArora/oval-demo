import { useState } from 'react';
import { CommentScatterPlot, ParticipantScatterPlot } from './ScatterPlot';

export default function ScatterPlotPanel({
  commentEmbeddings,
  participantEmbeddings,
  comments,
  participants,
  commentScores,
  participantScores,
  onSelectComment,
  onSelectParticipant,
}) {
  const [selectedTab, setSelectedTab] = useState('comments');

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex border-b">
        <button
          className={`px-4 py-2 -mb-px ${
            selectedTab === 'comments'
              ? 'border-1 border-blue-500 text-blue-500'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setSelectedTab('comments')}>
          Comments
        </button>
        <button
          className={`px-4 py-2 -mb-px ${
            selectedTab === 'participants'
              ? 'border-1 border-blue-500 text-blue-500'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setSelectedTab('participants')}>
          Participants
        </button>
      </div>
      <div className="flex-1">
        {selectedTab === 'comments' ? (
          <CommentScatterPlot
            embeddings={commentEmbeddings}
            comments={comments}
            commentScores={commentScores}
            onSelectComment={onSelectComment}
          />
        ) : (
          <ParticipantScatterPlot
            embeddings={participantEmbeddings}
            participants={participants}
            participantScores={participantScores}
            onSelectParticipant={onSelectParticipant}
          />
        )}
      </div>
    </div>
  );
}
