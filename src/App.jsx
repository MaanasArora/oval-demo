import Header from './components/Header';
import ScatterPlotPanel from './components/ScatterPlotPanel';
import VariablePanel from './components/VariablePanel';
import DatasetPanel from './components/DatasetPanel';
import StatusBar from './components/StatusBar';
import { useRef, useState } from 'react';
import CsvUploader from './components/CsvUploader';
import { computeVariable as computeVariablePyodide } from './pyodide';
import ScoreExplorer from './components/ScoreExplorer';

export default function App() {
  const [commentEmbeddings, setCommentEmbeddings] = useState([]);
  const [participantEmbeddings, setParticipantEmbeddings] = useState([]);
  const [comments, setComments] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [selectedComment, setSelectedComment] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [scores, setScores] = useState(null);
  const [confidence, setConfidence] = useState(null);
  const [anchors, setAnchors] = useState(new Map());
  const [numParticipants, setNumParticipants] = useState(0);
  const [numVotes, setNumVotes] = useState(0);

  async function computeVariable({ name, anchors, relevanceScoring }) {
    const { comment_scores, participant_scores, confidence } =
      await computeVariablePyodide(name, anchors, relevanceScoring);

    setScores({
      commentScores: comment_scores,
      participantScores: participant_scores,
    });
    setConfidence(confidence);
  }

  function toggleAnchor(commentId) {
    setAnchors((prev) => {
      const next = new Map(prev);

      if (next.has(commentId)) next.delete(commentId);
      else next.set(commentId, 0);

      return next;
    });
  }

  function updateRating(commentId, rating) {
    setAnchors((prev) => {
      const next = new Map(prev);

      next.set(commentId, rating);

      return next;
    });
  }

  const onConversationLoaded = (
    commentEmbeddings,
    participantEmbeddings,
    comments,
    participants,
    numParticipants,
    numVotes
  ) => {
    setCommentEmbeddings(commentEmbeddings);
    setParticipantEmbeddings(participantEmbeddings);
    setComments(comments);
    setParticipants(participants);
    setLoaded(true);
    setSelectedComment(0);
    setNumParticipants(numParticipants);
    setNumVotes(numVotes);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-50">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        {!loaded ? (
          <CsvUploader onLoaded={onConversationLoaded} />
        ) : (
          <DatasetPanel
            comments={comments}
            numParticipants={numParticipants}
            numVotes={numVotes}
            anchors={anchors}
            onToggleAnchor={toggleAnchor}
          />
        )}

        <ScatterPlotPanel
          commentEmbeddings={commentEmbeddings}
          participantEmbeddings={participantEmbeddings}
          comments={comments}
          participants={participants}
          commentScores={scores?.commentScores}
          participantScores={scores?.participantScores}
          onSelectComment={setSelectedComment}
          onSelectParticipant={() => {}}
        />

        {scores ? (
          <ScoreExplorer
            comments={comments}
            commentScores={scores?.commentScores}
            confidence={confidence}
            onSelectComment={setSelectedComment}
            onBack={() => setScores(null)}
          />
        ) : (
          <VariablePanel
            anchors={anchors}
            comments={comments}
            scores={scores?.commentScores}
            onCompute={computeVariable}
            onUpdateRating={updateRating}
          />
        )}
      </div>

      <StatusBar />
    </div>
  );
}
