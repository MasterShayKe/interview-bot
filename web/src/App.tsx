import { useEffect, useMemo, useState } from "react";
import { fetchSpec, streamChat, streamFit, type ChatMessage, type TokenUsage } from "./lib/api.js";
import { collectClientContext } from "./lib/device.js";
import BootSequence from "./components/BootSequence.js";
import IntroCard from "./components/IntroCard.js";
import ChatPanel from "./components/ChatPanel.js";
import Composer from "./components/Composer.js";
import SpecDialog from "./components/SpecDialog.js";
import FitDialog from "./components/FitDialog.js";
import { getSessionDuration } from "./lib/device.js";

interface SessionStats {
  messages: number;
  total: number;
  cacheRate: number;
}

function Header() {
  return (
    <header className="flex items-center justify-between py-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.12] bg-white/[0.03] font-display text-lg leading-none text-white">
          S<span className="text-accent">K</span>
        </div>
        <div className="leading-tight">
          <div className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-white/80">
            Shay Kopilevich&nbsp;🇮🇱
          </div>
          <div className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-white/35">
            Interview Agent
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 rounded-full border border-accent/20 bg-accent/[0.06] px-3 py-1.5">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent/50" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-accent shadow-[0_0_8px_1px] shadow-accent/70" />
        </span>
        <span className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-accent/90">
          Grounded
        </span>
      </div>
    </header>
  );
}

function Footer({
  onOpenSpec,
  stats,
}: {
  onOpenSpec: () => void;
  stats: SessionStats | null;
}) {
  return (
    <footer className="flex items-center justify-between border-t border-white/[0.06] py-5">
      <button
        onClick={onOpenSpec}
        className="group flex items-center gap-2 font-mono text-[0.68rem] uppercase tracking-[0.15em] text-white/40 transition-colors hover:text-accent"
      >
        <span className="text-accent/60 transition-colors group-hover:text-accent">
          {"</>"}
        </span>
        View the spec
      </button>
      <div className="flex flex-col items-end gap-0.5">
        {stats && (
          <span className="font-mono text-[0.58rem] uppercase tracking-[0.1em] text-white/20">
            {stats.messages} msg · {stats.total.toLocaleString()} tokens · {stats.cacheRate}% cached
          </span>
        )}
        <span className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-white/25">
          Powered by Claude
        </span>
      </div>
    </footer>
  );
}

// Collected once synchronously at module init — all synchronous browser APIs
const initialClientContext = collectClientContext();

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [dynamicSuggestions, setDynamicSuggestions] = useState<string[]>([]);
  const [tokenUsage, setTokenUsage] = useState<Record<number, TokenUsage>>({});
  const [showSpec, setShowSpec] = useState(false);
  const [showFit, setShowFit] = useState(false);
  const [busy, setBusy] = useState(false);
  const [bootDone, setBootDone] = useState(false);

  useEffect(() => {
    fetchSpec()
      .then((s) => setSuggestions(s.persona.suggested_questions))
      .catch(() => setSuggestions([]));
  }, []);

  const sessionStats = useMemo<SessionStats | null>(() => {
    const vals = Object.values(tokenUsage);
    if (!vals.length) return null;
    const total = vals.reduce(
      (sum, u) => sum + u.inputTokens + u.outputTokens + u.cacheCreationTokens + u.cacheReadTokens,
      0,
    );
    const cached = vals.reduce((sum, u) => sum + u.cacheReadTokens, 0);
    return {
      messages: vals.length,
      total,
      cacheRate: total > 0 ? Math.round((cached / total) * 100) : 0,
    };
  }, [tokenUsage]);

  function onClear() {
    setMessages([]);
    setDynamicSuggestions([]);
    setTokenUsage({});
  }

  async function onSend(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    setDynamicSuggestions([]);
    const next: ChatMessage[] = [...messages, { role: "user", content: trimmed }];
    const assistantIdx = next.length;
    setMessages([...next, { role: "assistant", content: "" }]);
    try {
      const ctx = initialClientContext;
      const sessionDurationSeconds = getSessionDuration(ctx.sessionStartedAt);
      await streamChat({
        messages: next,
        clientContext: ctx,
        sessionDurationSeconds,
        onDelta: (delta) => {
          setMessages((cur) => {
            const copy = [...cur];
            copy[copy.length - 1] = {
              role: "assistant",
              content: copy[copy.length - 1].content + delta,
            };
            return copy;
          });
        },
        onDone: (usage) => {
          setTokenUsage((prev) => ({ ...prev, [assistantIdx]: usage }));
        },
        onSuggestions: (questions) => {
          setDynamicSuggestions(questions);
        },
      });
    } catch (err) {
      setMessages((cur) => {
        const copy = [...cur];
        copy[copy.length - 1] = {
          role: "assistant",
          content: (err as Error).message,
        };
        return copy;
      });
    } finally {
      setBusy(false);
    }
  }

  async function onAnalyzeFit(jobDescription: string) {
    if (busy) return;
    setBusy(true);
    setDynamicSuggestions([]);
    const next: ChatMessage[] = [
      ...messages,
      { role: "user", content: "Analyze Shay's fit for a job description I pasted." },
    ];
    const assistantIdx = next.length;
    setMessages([...next, { role: "assistant", content: "" }]);
    try {
      const ctx = initialClientContext;
      const sessionDurationSeconds = getSessionDuration(ctx.sessionStartedAt);
      await streamFit({
        jobDescription,
        clientContext: ctx,
        sessionDurationSeconds,
        onDelta: (delta) => {
          setMessages((cur) => {
            const copy = [...cur];
            copy[copy.length - 1] = {
              role: "assistant",
              content: copy[copy.length - 1].content + delta,
            };
            return copy;
          });
        },
        onDone: (usage) => {
          setTokenUsage((prev) => ({ ...prev, [assistantIdx]: usage }));
        },
      });
    } catch (err) {
      setMessages((cur) => {
        const copy = [...cur];
        copy[copy.length - 1] = {
          role: "assistant",
          content: (err as Error).message,
        };
        return copy;
      });
    } finally {
      setBusy(false);
    }
  }

  const started = messages.length > 0;

  return (
    <>
      <div className="bg-atmosphere" aria-hidden />
      <div className="bg-grid" aria-hidden />
      <div className="bg-grain" aria-hidden />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-3xl flex-col px-5 sm:px-8">
        <Header />

        <main className={"flex flex-1 flex-col " + (started ? "justify-end" : "")}>
          {!bootDone ? (
            <BootSequence
              clientContext={initialClientContext}
              onDone={() => setBootDone(true)}
            />
          ) : started ? (
            <ChatPanel
              messages={messages}
              busy={busy}
              onSend={onSend}
              tokenUsage={tokenUsage}
              dynamicSuggestions={dynamicSuggestions}
            />
          ) : (
            <IntroCard
              suggestions={suggestions}
              onPick={onSend}
              onOpenFit={() => setShowFit(true)}
            />
          )}
        </main>

        <div className="sticky bottom-0 z-20 -mx-5 bg-gradient-to-t from-ink via-ink/95 to-transparent px-5 pb-3 pt-8 sm:-mx-8 sm:px-8">
          <Composer
            busy={busy}
            onSend={onSend}
            onClear={onClear}
            onFit={() => setShowFit(true)}
          />
        </div>

        <Footer onOpenSpec={() => setShowSpec(true)} stats={sessionStats} />
      </div>

      {showSpec && <SpecDialog onClose={() => setShowSpec(false)} />}
      {showFit && (
        <FitDialog
          onClose={() => setShowFit(false)}
          onAnalyze={onAnalyzeFit}
        />
      )}
    </>
  );
}
