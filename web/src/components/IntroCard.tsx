interface Props {
  suggestions: string[];
  onPick: (q: string) => void;
}

export default function IntroCard({ suggestions, onPick }: Props) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-xl font-semibold text-slate-900">
        Ask about Shay Kopilevich
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        This is an AI assistant Shay built. Ask it anything about his
        experience, projects, and skills. (It answers only from Shay's verified
        background.)
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {suggestions.map((q) => (
          <button
            key={q}
            onClick={() => onPick(q)}
            className="rounded-full border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
