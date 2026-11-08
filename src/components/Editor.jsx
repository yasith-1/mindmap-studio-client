export default function Editor({ value, onChange, charCount }) {
  return (
    <section className="pane" id="pane-edit">
      <div className="pane-head">
        Markdown <span className="count">{charCount} chars</span>
      </div>
      <textarea
        id="editor"
        spellCheck="false"
        autoComplete="off"
        placeholder="# Paste a README or type Markdown…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </section>
  );
}
