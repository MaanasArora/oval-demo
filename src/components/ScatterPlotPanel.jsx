import ScatterPlot from './ScatterPlot';

export default function ScatterPlotPanel(props) {
  return (
    <div className="flex-1">
      <ScatterPlot {...props} />
    </div>
  );
}
