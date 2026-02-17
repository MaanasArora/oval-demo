import Plotly from 'plotly.js-basic-dist';

import plotComponentFactory from 'react-plotly.js/factory';
const Plot = plotComponentFactory.default(Plotly);

function wrapText(text, maxLen = 80) {
  const words = text.split(' ');
  let lines = [];
  let line = '';

  for (const word of words) {
    if ((line + word).length > maxLen) {
      lines.push(line);
      line = word;
    } else {
      line += (line ? ' ' : '') + word;
    }
  }

  if (line) lines.push(line);

  return lines.join('<br>');
}

export default function ScatterPlot({
  embeddings,
  comments,
  scores,
  onSelectComment,
}) {
  if (!embeddings || embeddings.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 h-full">
        No data loaded
      </div>
    );
  }

  const x = embeddings.map((e) => e[0]);
  const y = embeddings.map((e) => e[1]);

  const text = comments.map((c) => wrapText(c.content));

  const color = scores
    ? Object.entries(scores).map(
        ([id, score]) => (comments.findIndex((c) => c.id === id), score)
      )
    : embeddings.map(() => 0);

  function handleClick(event) {
    const point = event.points[0];
    const index = point.pointIndex;

    onSelectComment(index);
  }

  return (
    <Plot
      data={[
        {
          x,
          y,
          text,
          mode: 'markers',
          type: 'scattergl',
          marker: {
            size: 8,
            color,
            colorscale: 'RdBu',
            showscale: false,
            colorbar: {
              title: 'Score',
            },
          },
          customdata: comments.map((c) => scores?.[c.id] ?? 0),
          hovertemplate:
            '<b>Comment</b><br>' +
            '%{text}<br><br>' +
            '<b>Score:</b> %{customdata:.2f}' +
            '<extra></extra>',
        },
      ]}
      layout={{
        autosize: true,
        margin: {
          l: 40,
          r: 10,
          t: 10,
          b: 40,
        },
        xaxis: {
          title: 'Dimension 1',
        },
        yaxis: {
          title: 'Dimension 2',
        },
      }}
      style={{
        width: '100%',
        height: '100%',
      }}
      useResizeHandler={true}
      onClick={handleClick}
    />
  );
}
