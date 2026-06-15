interface Props {
  about: string[];
}

export default function AboutTile({ about }: Props) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6">
      <h3 className="mb-3 font-mono text-[0.66rem] uppercase tracking-[0.18em] text-accent/80">
        Outside of work
      </h3>
      <ul className="space-y-2">
        {about.map((line, i) => (
          <li key={i} className="text-[0.82rem] leading-relaxed text-white/65">
            {line}
          </li>
        ))}
      </ul>
    </div>
  );
}
