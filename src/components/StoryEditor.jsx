import { useRef, useState } from 'react';

/*
  Supported syntax (markdown-like):
    # Heading         → <h2>
    ## Subheading     → <h3>
    - bullet          → <ul><li>
    > quote           → <blockquote>
    ---               → <hr> divider
    blank line        → paragraph break
    plain text        → <p>
*/

const FORMATS = [
  { label: 'H1',   prefix: '# ',   title: 'Heading' },
  { label: 'H2',   prefix: '## ',  title: 'Subheading' },
  { label: '•',    prefix: '- ',   title: 'Bullet point' },
  { label: '"',    prefix: '> ',   title: 'Quote / pull quote' },
  { label: '—',    prefix: '---',  title: 'Divider line', block: true },
];

export default function StoryEditor({ value, onChange, error, placeholder, rows = 7 }) {
  const ref = useRef(null);
  const [guideOpen, setGuideOpen] = useState(false);

  const base = `w-full border rounded-xl px-4 py-3 text-sm text-[#111827] bg-white outline-none
    focus:border-[#0F4C3A] transition-colors placeholder:text-[#9ca3af] resize-y font-mono
    leading-relaxed`;
  const cls = `${base} ${error ? 'border-red-400' : 'border-[#d1d5db]'}`;

  function insertFormat(prefix, block) {
    const el = ref.current;
    if (!el) return;
    el.focus();

    const text  = el.value;
    const start = el.selectionStart;

    // Find true start and end of the current line
    const lineStart  = text.lastIndexOf('\n', start - 1) + 1;
    const lineEndIdx = text.indexOf('\n', start);
    const lineEnd    = lineEndIdx === -1 ? text.length : lineEndIdx;
    const currentLine = text.slice(lineStart, lineEnd);

    // Use execCommand so the action is recorded in the browser's native undo stack.
    // React will stay in sync because onChange(el.value) is called right after,
    // and on re-render React sees value === el.value and skips the DOM write.
    if (block) {
      // Insert prefix as its own line before the current line
      el.setSelectionRange(lineStart, lineStart);
      document.execCommand('insertText', false, prefix + '\n');
      onChange(el.value);
      const newPos = lineStart + prefix.length + 1;
      setTimeout(() => el.setSelectionRange(newPos, newPos), 0);
    } else if (currentLine.startsWith(prefix)) {
      // Toggle off — remove the prefix from the line start
      el.setSelectionRange(lineStart, lineStart + prefix.length);
      document.execCommand('insertText', false, '');
      onChange(el.value);
      const newPos = Math.max(lineStart, start - prefix.length);
      setTimeout(() => el.setSelectionRange(newPos, newPos), 0);
    } else {
      // Add prefix at line start, leave rest of line intact
      el.setSelectionRange(lineStart, lineStart);
      document.execCommand('insertText', false, prefix);
      onChange(el.value);
      const newPos = start + prefix.length;
      setTimeout(() => el.setSelectionRange(newPos, newPos), 0);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      {/* Toolbar */}
      <div className="flex items-center gap-1 flex-wrap">
        {FORMATS.map(f => (
          <button
            key={f.label}
            type="button"
            title={f.title}
            onClick={() => insertFormat(f.prefix, f.block)}
            className="h-7 min-w-[28px] px-2 rounded-lg border border-[#d1d5db] bg-white text-xs font-bold text-[#374151]
              hover:border-[#0F4C3A] hover:text-[#0F4C3A] hover:bg-[#0F4C3A]/5 transition-colors"
          >
            {f.label}
          </button>
        ))}

        <button
          type="button"
          onClick={() => setGuideOpen(o => !o)}
          className="ml-auto h-7 px-2 rounded-lg border border-dashed border-[#d1d5db] text-[10px] text-[#9ca3af]
            hover:border-[#0F4C3A] hover:text-[#0F4C3A] transition-colors"
        >
          {guideOpen ? 'Hide guide' : 'Format guide'}
        </button>
      </div>

      {/* Collapsible guide */}
      {guideOpen && (
        <div className="text-[11px] text-[#6b7280] bg-[#f9fafb] border border-[#e5e7eb] rounded-xl px-4 py-3 space-y-1">
          <p className="font-bold text-[#374151] mb-1.5">Formatting guide</p>
          <p><code className="bg-white px-1 rounded text-[10px] border border-[#e5e7eb]"># Title</code> &nbsp;Big heading</p>
          <p><code className="bg-white px-1 rounded text-[10px] border border-[#e5e7eb]">## Subtitle</code> &nbsp;Subheading</p>
          <p><code className="bg-white px-1 rounded text-[10px] border border-[#e5e7eb]">- Item</code> &nbsp;Bullet point</p>
          <p><code className="bg-white px-1 rounded text-[10px] border border-[#e5e7eb]">{`> Text`}</code> &nbsp;Pull quote</p>
          <p><code className="bg-white px-1 rounded text-[10px] border border-[#e5e7eb]">---</code> &nbsp;Divider line</p>
          <p className="pt-1 text-[10px]">Blank lines between paragraphs create separate sections. You can also just paste plain text.</p>
        </div>
      )}

      {/* Textarea — onChange also fires on Ctrl+Z/Ctrl+Y so React stays in sync with native undo */}
      <textarea
        ref={ref}
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder || 'Write the story behind this frame...\n\nTip: Use # for headings, - for bullet points, > for quotes.'}
        className={cls}
      />
    </div>
  );
}
