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
  const [embeddings, setEmbeddings] = useState([]);
  const [comments, setComments] = useState([]);
  const [selectedComment, setSelectedComment] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [scores, setScores] = useState(null);
  const [anchors, setAnchors] = useState(new Map());

  async function computeVariable({ name, anchors }) {
    const scores = await computeVariablePyodide(name, anchors);

    setScores(scores);
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

  const onConversationLoaded = (embeddings, comments) => {
    setEmbeddings(embeddings);
    setComments(comments);
    setLoaded(true);
    setSelectedComment(0);
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
            anchors={anchors}
            onToggleAnchor={toggleAnchor}
          />
        )}

        <ScatterPlotPanel
          embeddings={embeddings}
          comments={comments}
          scores={scores}
          onSelectComment={setSelectedComment}
        />

        {scores ? (
          <ScoreExplorer
            comments={comments}
            scores={scores}
            onSelectComment={setSelectedComment}
          />
        ) : (
          <VariablePanel
            anchors={anchors}
            comments={comments}
            scores={scores}
            onCompute={computeVariable}
            onUpdateRating={updateRating}
          />
        )}
      </div>

      <StatusBar />
    </div>
  );
}
