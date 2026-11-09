import { PlusIcon, MinusIcon, FitIcon } from './Icons.jsx';

export const TYPES = [
  { id: 'mindmap', label: 'Mind map' },
  { id: 'tree', label: 'Tree' },
  { id: 'flow', label: 'Flowchart' },
  { id: 'concept', label: 'Concept' },
];

/** Human label for a diagram type id (e.g. 'flow' → 'Flowchart'). */
export const typeLabel = (id) => TYPES.find((t) => t.id === id)?.label ?? id;

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
    <section
      id="pane-map"
      className="pane flex min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-line bg-surface"
    >
      <div className="flex items-center gap-2 border-b border-line px-3 py-[9px] text-[0.72rem] font-semibold uppercase tracking-[0.04em] text-muted max-[480px]:flex-wrap">
        <div
          className="flex gap-[3px] rounded-[9px] border border-line bg-panel p-[3px] max-[480px]:flex-1 max-[480px]:justify-between"
          role="group"
          aria-label="Diagram type"
        >
          {TYPES.map((t) => {
            const active = diagramType === t.id;
            return (
              <button
                key={t.id}
                className={`cursor-pointer rounded-md border-0 bg-transparent px-2.5 py-[3px] text-[0.68rem] font-semibold normal-case tracking-[0.03em] pointer-coarse:min-h-8 max-[480px]:px-2 ${
                  active
                    ? 'bg-surface text-accent shadow-[0_1px_2px_rgba(0,0,0,0.08)]'
                    : 'text-muted hover:text-fg'
                }`}
                aria-pressed={active}
                onClick={() => onTypeChange(t.id)}
              >
                {t.label}
              </button>
            );
          })}
        </div>
        <span className="ml-auto font-mono normal-case tracking-normal">{nodeCount} nodes</span>
      </div>
      <div className="canvas-wrap relative min-h-0 flex-1">
        {/* markmap and the d3 diagrams live on separate stacked canvases so
            markmap is never torn down (which broke its auto-fit). */}
        <svg ref={mindmapRef} id="mindmap" className={mapActive ? '' : 'inactive'} />
        <svg ref={diagramRef} id="diagram" className={mapActive ? 'inactive' : ''} />
        <div className="absolute bottom-3 right-3 flex flex-col gap-1.5">
          <button
            className="flex size-[34px] cursor-pointer items-center justify-center rounded-[9px] border border-line bg-surface p-0 text-fg shadow-[0_1px_3px_rgba(0,0,0,0.08)] hover:border-accent pointer-coarse:size-11"
            onClick={onZoomIn}
            aria-label="Zoom in"
            title="Zoom in"
          >
            <PlusIcon width="16" height="16" />
          </button>
          <button
            className="flex size-[34px] cursor-pointer items-center justify-center rounded-[9px] border border-line bg-surface p-0 text-fg shadow-[0_1px_3px_rgba(0,0,0,0.08)] hover:border-accent pointer-coarse:size-11"
            onClick={onZoomOut}
            aria-label="Zoom out"
            title="Zoom out"
          >
            <MinusIcon width="16" height="16" />
          </button>
          <button
            className="flex size-[34px] cursor-pointer items-center justify-center rounded-[9px] border border-line bg-surface p-0 text-fg shadow-[0_1px_3px_rgba(0,0,0,0.08)] hover:border-accent pointer-coarse:size-11"
            onClick={onFit}
            aria-label="Fit to screen"
            title="Fit to screen"
          >
            <FitIcon width="16" height="16" />
          </button>
        </div>
      </div>
    </section>
  );
}
