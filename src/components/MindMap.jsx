import { PlusIcon, MinusIcon, FitIcon } from './Icons.jsx';

export default function MindMap({ svgRef, nodeCount, onZoomIn, onZoomOut, onFit }) {
  return (
    <section className="pane" id="pane-map">
      <div className="pane-head">
        Mind map <span className="count">{nodeCount} nodes</span>
      </div>
      <div className="canvas-wrap">
        <svg ref={svgRef} id="mindmap" />
        <div className="zoom">
          <button onClick={onZoomIn} aria-label="Zoom in" title="Zoom in">
            <PlusIcon width="16" height="16" />
          </button>
          <button onClick={onZoomOut} aria-label="Zoom out" title="Zoom out">
            <MinusIcon width="16" height="16" />
          </button>
          <button onClick={onFit} aria-label="Fit to screen" title="Fit to screen">
            <FitIcon width="16" height="16" />
          </button>
        </div>
      </div>
    </section>
  );
}
