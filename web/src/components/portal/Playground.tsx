import { useCallback, useEffect, useRef, useState } from "react";
import { runPlayground, type PlaygroundEvent } from "../../lib/api.js";

interface Props {
  open: boolean;
  onClose: () => void;
}

const PRESET_PERSONAS = [
  "a witty math tutor",
  "a terse research assistant",
  "a hype-man for Shay",
];

const EXAMPLE_TASKS = [
  "What is (144 + 56) * 3?",
  "How many repos does Shay have?",
  "Count the words in: 'The quick brown fox jumps over the lazy dog'",
];

const TOOLS = [
  { name: "calculator", label: "calculator", desc: "arithmetic +−×÷" },
  { name: "word_count", label: "word_count", desc: "words & chars" },
  { name: "github_lookup", label: "github_lookup", desc: "live GitHub stats" },
];

type Line =
  | { kind: "cmd"; text: string }
  | { kind: "text"; text: string }
  | { kind: "tool_call"; name: string; input: unknown }
  | { kind: "tool_result"; name: string; output: string }
  | { kind: "done"; inputTokens: number; outputTokens: number }
  | { kind: "error"; message: string };

function formatInput(input: unknown): string {
  try {
    const s = JSON.stringify(input);
    return s.length > 80 ? s.slice(0, 77) + "…}" : s;
  } catch {
    return String(input);
  }
}

function TranscriptLine({ line }: { line: Line }) {
  if (line.kind === "cmd") {
    return (
      <div className="flex gap-2">
        <span className="select-none font-bold text-accent">›</span>
        <span className="text-white/60">{line.text}</span>
      </div>
    );
  }
  if (line.kind === "text") {
    return (
      <div className="pl-4 text-white/85 leading-relaxed whitespace-pre-wrap">
        {line.text}
      </div>
    );
  }
  if (line.kind === "tool_call") {
    return (
      <div className="pl-4">
        <span className="text-[#ffbd2e]">▸ </span>
        <span className="text-[#ffbd2e]">{line.name}</span>
        <span className="text-white/40">(</span>
        <span className="text-white/60">{formatInput(line.input)}</span>
        <span className="text-white/40">)</span>
      </div>
    );
  }
  if (line.kind === "tool_result") {
    return (
      <div className="pl-6 text-[#27c93f]">
        <span className="text-white/30">⮑ </span>
        {line.output}
      </div>
    );
  }
  if (line.kind === "done") {
    return (
      <div className="mt-1 pl-4 font-mono text-[0.65rem] text-white/25">
        ✓ done · {line.inputTokens + line.outputTokens} tokens
      </div>
    );
  }
  if (line.kind === "error") {
    return (
      <div className="pl-4 text-[#ff5f56]">
        ✗ {line.message}
      </div>
    );
  }
  return null;
}

export default function Playground({ open, onClose }: Props) {
  const [persona, setPersona] = useState(PRESET_PERSONAS[0]);
  const [customPersona, setCustomPersona] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [selectedTools, setSelectedTools] = useState<string[]>(["calculator"]);
  const [task, setTask] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [running, setRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  // Reset when reopened
  useEffect(() => {
    if (open) {
      setLines([]);
      setHasRun(false);
      setTask("");
      setSelectedTools(["calculator"]);
      setPersona(PRESET_PERSONAS[0]);
      setUseCustom(false);
      setCustomPersona("");
    }
  }, [open]);

  const toggleTool = useCallback((name: string) => {
    setSelectedTools((prev) => {
      if (prev.includes(name)) return prev.filter((t) => t !== name);
      if (prev.length >= 2) return prev; // cap at 2
      return [...prev, name];
    });
  }, []);

  const handleRun = useCallback(async () => {
    if (running) return;
    const effectivePersona = useCustom ? customPersona.trim() || PRESET_PERSONAS[0] : persona;
    const trimmedTask = task.trim();
    if (!trimmedTask) return;

    setRunning(true);
    setHasRun(true);
    setLines([
      { kind: "cmd", text: `run --persona="${effectivePersona}" --tools=[${selectedTools.join(",")}]` },
      { kind: "cmd", text: trimmedTask },
    ]);

    await runPlayground(
      { persona: effectivePersona, toolNames: selectedTools, task: trimmedTask },
      (e: PlaygroundEvent) => {
        if (e.type === "text") {
          setLines((prev) => [...prev, { kind: "text", text: e.text }]);
        } else if (e.type === "tool_call") {
          setLines((prev) => [...prev, { kind: "tool_call", name: e.name, input: e.input }]);
        } else if (e.type === "tool_result") {
          setLines((prev) => [...prev, { kind: "tool_result", name: e.name, output: e.output }]);
        } else if (e.type === "done") {
          setLines((prev) => [
            ...prev,
            { kind: "done", inputTokens: e.usage.inputTokens, outputTokens: e.usage.outputTokens },
          ]);
        } else if (e.type === "error") {
          setLines((prev) => [...prev, { kind: "error", message: e.message }]);
        }
      },
    );

    setRunning(false);
  }, [running, persona, customPersona, useCustom, selectedTools, task]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleRun();
      }
    },
    [handleRun],
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="flex w-full max-w-2xl flex-col rounded-2xl border border-accent/25 bg-[#0c0913] shadow-[0_0_60px_-12px_rgba(168,85,247,0.5)] overflow-hidden max-h-[90vh]">

        {/* Chrome */}
        <div className="flex h-9 shrink-0 items-center gap-2 border-b border-white/[0.08] bg-white/[0.025] px-3.5">
          <span className="h-[11px] w-[11px] rounded-full bg-[#ff5f56]" />
          <span className="h-[11px] w-[11px] rounded-full bg-[#ffbd2e]" />
          <span className="h-[11px] w-[11px] rounded-full bg-[#27c93f]" />
          <span className="ml-2 font-mono text-[0.68rem] font-semibold text-white/45">
            playground — build-a-bot
          </span>
          <span className="ml-auto flex items-center gap-1.5 font-mono text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-[#27c93f]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#27c93f] shadow-[0_0_8px_#27c93f]" />
            sandboxed
          </span>
          <button
            onClick={onClose}
            aria-label="Close playground"
            className="ml-3 rounded-md p-1 text-white/40 transition-colors hover:text-accent"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {!hasRun ? (
            /* Configurator */
            <div className="p-5 font-mono text-[0.78rem]">
              <div className="mb-4 text-white/30">
                # configure your mini-agent, then hit Run
              </div>

              {/* Persona */}
              <div className="mb-5">
                <div className="mb-2 text-white/50 uppercase tracking-[0.12em] text-[0.65rem]">
                  persona
                </div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {PRESET_PERSONAS.map((p) => (
                    <button
                      key={p}
                      onClick={() => { setPersona(p); setUseCustom(false); }}
                      className={
                        "rounded-lg border px-3 py-1.5 text-[0.7rem] font-semibold transition-colors " +
                        (!useCustom && persona === p
                          ? "border-accent/70 bg-accent/[0.15] text-violet-200"
                          : "border-white/[0.12] bg-white/[0.03] text-white/50 hover:border-accent/40 hover:text-white/75")
                      }
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => setUseCustom(true)}
                    className={
                      "rounded-lg border px-3 py-1.5 text-[0.7rem] font-semibold transition-colors " +
                      (useCustom
                        ? "border-accent/70 bg-accent/[0.15] text-violet-200"
                        : "border-white/[0.12] bg-white/[0.03] text-white/50 hover:border-accent/40 hover:text-white/75")
                    }
                  >
                    custom…
                  </button>
                </div>
                {useCustom && (
                  <input
                    type="text"
                    value={customPersona}
                    onChange={(e) => setCustomPersona(e.target.value)}
                    maxLength={200}
                    placeholder="describe the agent's personality…"
                    autoFocus
                    className="w-full rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 py-2 text-white/80 placeholder-white/25 outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20"
                  />
                )}
              </div>

              {/* Tools */}
              <div className="mb-5">
                <div className="mb-2 text-white/50 uppercase tracking-[0.12em] text-[0.65rem]">
                  tools <span className="text-white/25 normal-case tracking-normal">(pick up to 2)</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {TOOLS.map((tool) => {
                    const active = selectedTools.includes(tool.name);
                    const disabled = !active && selectedTools.length >= 2;
                    return (
                      <button
                        key={tool.name}
                        onClick={() => !disabled && toggleTool(tool.name)}
                        disabled={disabled}
                        className={
                          "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[0.7rem] font-semibold transition-colors " +
                          (active
                            ? "border-[#27c93f]/50 bg-[#27c93f]/[0.08] text-[#27c93f]"
                            : disabled
                            ? "border-white/[0.06] bg-transparent text-white/25 cursor-not-allowed"
                            : "border-white/[0.12] bg-white/[0.03] text-white/50 hover:border-white/25 hover:text-white/75")
                        }
                      >
                        <span
                          className={
                            "h-1.5 w-1.5 rounded-full " +
                            (active ? "bg-[#27c93f]" : "bg-white/20")
                          }
                        />
                        {tool.label}
                        <span className={active ? "text-[#27c93f]/60" : "text-white/25"}>
                          · {tool.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Task */}
              <div className="mb-5">
                <div className="mb-2 text-white/50 uppercase tracking-[0.12em] text-[0.65rem]">
                  task
                </div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {EXAMPLE_TASKS.map((ex) => (
                    <button
                      key={ex}
                      onClick={() => setTask(ex)}
                      className="rounded-md border border-white/[0.1] bg-white/[0.03] px-2.5 py-1 text-[0.65rem] text-white/40 transition-colors hover:border-accent/30 hover:text-white/60"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
                <textarea
                  value={task}
                  onChange={(e) => setTask(e.target.value)}
                  onKeyDown={handleKeyDown}
                  maxLength={600}
                  rows={3}
                  placeholder="what should your agent do?  (⌘↵ to run)"
                  className="w-full resize-none rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 py-2 text-white/80 placeholder-white/25 outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20 leading-relaxed"
                />
                <div className="text-right text-[0.6rem] text-white/20 mt-1">
                  {task.length}/600
                </div>
              </div>

              {/* Run */}
              <button
                onClick={handleRun}
                disabled={!task.trim() || running}
                className="w-full rounded-xl border border-accent/40 bg-accent/[0.12] py-2.5 font-semibold text-violet-200 transition-all hover:bg-accent/[0.2] hover:border-accent/60 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {running ? "running…" : "▶ Run agent"}
              </button>

              <div className="mt-3 text-center text-[0.6rem] text-white/20">
                capped at 4 iterations · claude-haiku-4-5 · sandboxed tools only
              </div>
            </div>
          ) : (
            /* Transcript */
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 font-mono text-[0.78rem] leading-relaxed space-y-1"
            >
              {lines.map((line, i) => (
                <TranscriptLine key={i} line={line} />
              ))}
              {running && (
                <div className="flex gap-2 pl-4">
                  <span className="animate-pulse text-accent">_</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer — shown after run */}
        {hasRun && (
          <div className="shrink-0 border-t border-white/[0.08] bg-[#0b0814] px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => { setHasRun(false); setLines([]); setTask(""); }}
              disabled={running}
              className="font-mono text-[0.68rem] text-white/35 transition-colors hover:text-accent disabled:opacity-40"
            >
              ← reconfigure
            </button>
            <button
              onClick={handleRun}
              disabled={running}
              className="flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/[0.08] px-3 py-1.5 font-mono text-[0.7rem] font-semibold text-violet-200 transition-colors hover:border-accent/50 hover:bg-accent/[0.14] disabled:opacity-40"
            >
              {running ? "running…" : "▶ run again"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
