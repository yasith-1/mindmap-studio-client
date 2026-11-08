import { PlusIcon, MinusIcon, FitIcon } from './Icons.jsx';

const TYPES = [
  { id: 'mindmap', label: 'Mind map' },
  { id: 'tree', label: 'Tree' },
  { id: 'flow', label: 'Flowchart' },
  { id: 'concept', label: 'Concept' },
];

export default function MindMap({
  mindmapRef,
  diagramRef,
  nodeCount,
  diagramType,
  onTypeChange,
  onZoomIn,
  onZoomOut,
  onFit,
}) {
  const mapActive = diagramType === 'mindmap';
  return (
    <section className="pane" id="pane-map">
      <div className="pane-head">
        <div className="diagram-types" role="group" aria-label="Diagram type">
          {TYPES.map((t) => (
            <button
              key={t.id}
              className={diagramType === t.id ? 'active' : ''}
              aria-pressed={diagramType === t.id}
              onClick={() => onTypeChange(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <span className="count">{nodeCount} nodes</span>
      </div>
      <div className="canvas-wrap">
        {/* markmap and the d3 diagrams live on separate stacked canvases so
            markmap is never torn down (which broke its auto-fit). */}
        <svg ref={mindmapRef} id="mindmap" className={mapActive ? '' : 'inactive'} />
        <svg ref={diagramRef} id="diagram" className={mapActive ? 'inactive' : ''} />
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
