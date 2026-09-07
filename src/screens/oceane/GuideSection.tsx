import { Screen, BackHeader } from '../../components/Screen';
import { sectionById, type Block } from '../../oceane/guide';

/** Une partie du document, rendue depuis ses blocs. */
function BlockView({ block }: { block: Block }) {
  switch (block.t) {
    case 'h':
      return (
        <h2 className="mb-2 mt-6 text-[17px] font-bold tracking-[-0.01em] first:mt-0">
          {block.text}
        </h2>
      );
    case 'p':
      return <p className="mb-3 text-[15px] leading-6 text-ink-2">{block.text}</p>;
    case 'ul':
      return (
        <ul className="mb-3 space-y-2">
          {block.items.map((it, i) => (
            <li key={i} className="flex gap-2.5 text-[15px] leading-6 text-ink-2">
              <span className="mt-[10px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              {it}
            </li>
          ))}
        </ul>
      );
    case 'ol':
      return (
        <ol className="mb-3 space-y-2.5">
          {block.items.map((it, i) => (
            <li key={i} className="flex gap-3 text-[15px] leading-6 text-ink-2">
              <span className="tnum mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-dim text-[12px] font-bold text-accent">
                {i + 1}
              </span>
              {it}
            </li>
          ))}
        </ol>
      );
    case 'kv':
      return (
        <div className="mb-3 rounded-[var(--radius-card)] bg-raised px-4">
          {block.rows.map(([k, v], i) => (
            <div key={i} className="border-b border-sep py-3 last:border-b-0">
              <p className="text-[14px] font-bold">{k}</p>
              <p className="mt-0.5 text-[14px] leading-5.5 text-ink-2">{v}</p>
            </div>
          ))}
        </div>
      );
    case 'note': {
      const tone =
        block.tone === 'warn'
          ? 'border-negative/35 bg-raised'
          : block.tone === 'good'
            ? 'border-transparent bg-accent-dim'
            : 'border-transparent bg-raised';
      const label =
        block.tone === 'warn' ? 'text-negative' : block.tone === 'good' ? 'text-accent' : 'text-ink-3';
      return (
        <div className={`mb-3 rounded-[var(--radius-card)] border p-4 ${tone}`}>
          {block.title && (
            <p className={`mb-1 text-[11px] font-bold uppercase tracking-wide ${label}`}>
              {block.title}
            </p>
          )}
          <p className="text-[14px] leading-5.5 text-ink-2">{block.text}</p>
        </div>
      );
    }
    case 'table':
      return (
        <div className="mb-3 overflow-x-auto rounded-[var(--radius-card)] bg-raised">
          <table className="w-full min-w-[420px] border-collapse text-left">
            <thead>
              <tr>
                {block.head.map((h) => (
                  <th
                    key={h}
                    className="border-b border-sep px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-ink-3"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td
                      key={j}
                      className={`border-b border-sep px-3 py-2.5 align-top text-[13px] leading-5 last:border-b-0 ${
                        j === 0 ? 'font-semibold text-ink' : 'text-ink-2'
                      }`}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
  }
}

export function OceaneGuideSection({ sectionId }: { sectionId: string }) {
  const section = sectionById(sectionId);
  if (!section) return <Screen>{null}</Screen>;

  return (
    <Screen bottomPadding={48}>
      <BackHeader title={section.title} />
      <p className="mb-5 text-[14px] leading-5.5 text-ink-3">{section.when}</p>
      {section.blocks.map((b, i) => (
        <BlockView key={i} block={b} />
      ))}
    </Screen>
  );
}
