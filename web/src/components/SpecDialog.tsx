import { useEffect, useState } from "react";
import { fetchSpec, type SpecResponse } from "../lib/api.js";

export default function SpecDialog({ onClose }: { onClose: () => void }) {
  const [spec, setSpec] = useState<SpecResponse | null>(null);
  useEffect(() => {
    fetchSpec().then(setSpec).catch(() => setSpec(null));
  }, []);

  return (
    <div
      className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[80vh] w-full max-w-2xl overflow-auto rounded-2xl bg-white p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">How this bot is defined</h2>
          <button onClick={onClose} className="text-slate-500">✕</button>
        </div>
        <p className="mt-1 text-sm text-slate-600">
          This bot is fully declarative: its persona and the only facts it may
          state are defined in a spec. Here it is.
        </p>
        {spec === null ? (
          <p className="mt-4 text-sm text-slate-500">Loading…</p>
        ) : (
          <div className="mt-4 space-y-4 text-sm">
            <pre className="whitespace-pre-wrap rounded-lg bg-slate-50 p-3">
              {JSON.stringify(spec.persona, null, 2)}
            </pre>
            {spec.facts.map((f) => (
              <div key={f.path}>
                <div className="font-mono text-xs text-slate-500">{f.path}</div>
                <pre className="whitespace-pre-wrap rounded-lg bg-slate-50 p-3">
                  {f.content}
                </pre>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
