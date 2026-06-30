import { useEffect, useMemo, useRef, useState } from "react";
import {
  fetchBot,
  streamChat,
  streamFit,
  type ChatMessage,
  type PublicBot,
  type TokenUsage,
} from "./lib/api.js";
import { collectClientContext } from "./lib/device.js";
import BootSequence from "./components/BootSequence.js";
import IntroCard from "./components/IntroCard.js";
import ChatPanel from "./components/ChatPanel.js";
import Composer from "./components/Composer.js";
import SpecDialog from "./components/SpecDialog.js";
import FitDialog from "./components/FitDialog.js";
import { getSessionDuration } from "./lib/device.js";
import { navigate, takePendingAsk } from "./lib/router.js";
import { applyAccent, resetAccent } from "./lib/theme.js";

interface SessionStats {
  messages: number;
  total: number;
  cacheRate: number;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "AI";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

function Header({ bot }: { bot: PublicBot }) {
  const ini = initials(bot.subjectName);
  const image = bot.theme?.logoUrl || bot.theme?.avatarUrl;
  return (
    <header className="flex items-center justify-between py-6">
      <div className="flex items-center gap-3">
        {image ? (
          <img
            src={image}
            alt={bot.subjectName}
            className="h-9 w-9 rounded-lg border border-white/[0.12] object-cover"
          />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.12] bg-white/[0.03] font-display text-lg leading-none text-white">
            {ini[0]}
            <span className="text-accent">{ini[1] ?? ""}</span>
          </div>
        )}
        <div className="leading-tight">
          <div className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-white/80">
            {bot.subjectName}
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
  onOpenPortal,
  stats,
  remaining,
  cap,
}: {
  onOpenSpec: () => void;
  onOpenPortal: () => void;
  stats: SessionStats | null;
  remaining: number | null;
  cap: number;
}) {
  return (
    <footer className="flex items-center justify-between border-t border-white/[0.06] py-5">
      <div className="flex items-center gap-5">
        <button
          onClick={onOpenSpec}
          className="group flex items-center gap-2 font-mono text-[0.68rem] uppercase tracking-[0.15em] text-white/40 transition-colors hover:text-accent"
        >
          <span className="text-accent/60 transition-colors group-hover:text-accent">
            {"</>"}
          </span>
          View the spec
        </button>
        <button
          onClick={onOpenPortal}
          className="group flex items-center gap-2 font-mono text-[0.68rem] uppercase tracking-[0.15em] text-white/40 transition-colors hover:text-accent"
        >
          <span className="text-accent/60 transition-colors group-hover:text-accent">
            ◎
          </span>
          Projects portal
        </button>
      </div>
      <div className="flex flex-col items-end gap-0.5">
        {stats && (
          <span className="font-mono text-[0.58rem] uppercase tracking-[0.1em] text-white/20">
            {stats.messages} msg · {stats.total.toLocaleString()} tokens · {stats.cacheRate}% cached
          </span>
        )}
        {remaining !== null && (
          <span
            className={
              "font-mono text-[0.58rem] uppercase tracking-[0.1em] " +
              (remaining <= 0 ? "text-amber-400/60" : "text-white/25")
            }
            title="Daily token allowance remaining for this agent"
          >
            {remaining <= 0
              ? "daily limit reached"
              : `${remaining.toLocaleString()} / ${cap.toLocaleString()} tokens left today`}
          </span>
        )}
        <span className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-white/25">
          Powered by Claude
        </span>
      </div>
    </footer>
  );
}

function NotFound({ handle }: { handle: string }) {
  return (
    <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center px-5 text-center">
      <div className="font-mono text-[0.62rem] uppercase tracking-[0.26em] text-accent/80">
        404
      </div>
      <h1 className="mt-3 font-display text-4xl text-white">
        No agent at /u/{handle}
      </h1>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/50">
        This handle is not published yet. If it is yours, finish setup and
        publish it from your dashboard.
      </p>
      <button
        onClick={() => navigate("/")}
        className="mt-6 rounded-xl border border-accent/30 bg-accent/[0.06] px-5 py-2.5 text-sm text-white transition-colors hover:bg-accent/[0.12]"
      >
        Back to home
      </button>
    </div>
  );
}

// Collected once synchronously at module init — all synchronous browser APIs.
const initialClientContext = collectClientContext();

export default function App({ handle }: { handle: string }) {
  const [bot, setBot] = useState<PublicBot | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [dynamicSuggestions, setDynamicSuggestions] = useState<string[]>([]);
  const [tokenUsage, setTokenUsage] = useState<Record<number, TokenUsage>>({});
  const [showSpec, setShowSpec] = useState(false);
  const [showFit, setShowFit] = useState(false);
  const [busy, setBusy] = useState(false);
  const [bootDone, setBootDone] = useState(false);

  useEffect(() => {
    fetchBot(handle)
      .then((b) => {
        setBot(b);
        setSuggestions(b.suggestedQuestions);
        setRemaining(b.dailyRemaining);
        applyAccent(b.theme);
      })
      .catch((err) => {
        if ((err as Error).message === "NOT_FOUND") setNotFound(true);
      });
    // Restore the default accent when leaving this bot's page.
    return () => resetAccent();
  }, [handle]);

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
        handle,
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
        onDone: (usage, dr) => {
          setTokenUsage((prev) => ({ ...prev, [assistantIdx]: usage }));
          if (typeof dr === "number") setRemaining(dr);
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
    if (busy || !bot) return;
    setBusy(true);
    setDynamicSuggestions([]);
    const next: ChatMessage[] = [
      ...messages,
      {
        role: "user",
        content: `Analyze ${bot.subjectName}'s fit for a job description I pasted.`,
      },
    ];
    const assistantIdx = next.length;
    setMessages([...next, { role: "assistant", content: "" }]);
    try {
      const ctx = initialClientContext;
      const sessionDurationSeconds = getSessionDuration(ctx.sessionStartedAt);
      await streamFit({
        handle,
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
        onDone: (usage, dr) => {
          setTokenUsage((prev) => ({ ...prev, [assistantIdx]: usage }));
          if (typeof dr === "number") setRemaining(dr);
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

  // A project picked in the portal can request the chat to open with a question.
  const askConsumed = useRef(false);
  useEffect(() => {
    if (askConsumed.current || !bot) return;
    const ask = takePendingAsk();
    if (!ask) return;
    askConsumed.current = true;
    setBootDone(true);
    onSend(ask);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bot]);

  if (notFound) return <NotFound handle={handle} />;

  const started = messages.length > 0;

  return (
    <>
      <div className="bg-atmosphere" aria-hidden />
      <div className="bg-grid" aria-hidden />
      <div className="bg-grain" aria-hidden />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-3xl flex-col px-5 sm:px-8">
        {bot && <Header bot={bot} />}

        <main className={"flex flex-1 flex-col " + (started ? "justify-end" : "")}>
          {!bot ? (
            <div className="flex flex-1 items-center justify-center">
              <span className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-accent/70">
                Loading agent…
              </span>
            </div>
          ) : !bootDone ? (
            <BootSequence
              clientContext={initialClientContext}
              subjectName={bot.subjectName}
              onDone={() => setBootDone(true)}
            />
          ) : started ? (
            <ChatPanel
              subjectName={bot.subjectName}
              messages={messages}
              busy={busy}
              onSend={onSend}
              tokenUsage={tokenUsage}
              dynamicSuggestions={dynamicSuggestions}
            />
          ) : (
            <IntroCard
              subjectName={bot.subjectName}
              targetRole={bot.targetRole}
              suggestions={suggestions}
              onPick={onSend}
              onOpenFit={() => setShowFit(true)}
            />
          )}
        </main>

        {bot && (
          <div className="sticky bottom-0 z-20 -mx-5 bg-gradient-to-t from-ink via-ink/95 to-transparent px-5 pb-3 pt-8 sm:-mx-8 sm:px-8">
            <Composer
              subjectName={bot.subjectName}
              busy={busy}
              onSend={onSend}
              onClear={onClear}
              onFit={() => setShowFit(true)}
            />
          </div>
        )}

        {bot && (
          <Footer
            onOpenSpec={() => setShowSpec(true)}
            onOpenPortal={() => navigate(`/u/${handle}/portal`)}
            stats={sessionStats}
            remaining={remaining}
            cap={bot.dailyCap}
          />
        )}
      </div>

      {showSpec && bot && (
        <SpecDialog bot={bot} onClose={() => setShowSpec(false)} />
      )}
      {showFit && bot && (
        <FitDialog
          subjectName={bot.subjectName}
          onClose={() => setShowFit(false)}
          onAnalyze={onAnalyzeFit}
        />
      )}
    </>
  );
}
