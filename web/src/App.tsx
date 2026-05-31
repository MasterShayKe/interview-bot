import { useEffect, useState } from "react";
import { fetchSpec, streamChat, type ChatMessage } from "./lib/api.js";
import IntroCard from "./components/IntroCard.js";
import ChatPanel from "./components/ChatPanel.js";
import Composer from "./components/Composer.js";
import SpecDialog from "./components/SpecDialog.js";

function Header() {
  return (
    <header className="flex items-center justify-between py-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.12] bg-white/[0.03] font-display text-lg leading-none text-white">
          S<span className="text-accent">K</span>
        </div>
        <div className="leading-tight">
          <div className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-white/80">
            Shay Kopilevich
          </div>
          <div className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-white/35">
            Interview Agent
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-3 py-1.5">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-pulse-dot rounded-full bg-accent" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
        </span>
        <span className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-white/55">
          Grounded
        </span>
      </div>
    </header>
  );
}

function Footer({ onOpenSpec }: { onOpenSpec: () => void }) {
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
      <span className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-white/25">
        Powered by Claude
      </span>
    </footer>
  );
}

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSpec, setShowSpec] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchSpec()
      .then((s) => setSuggestions(s.persona.suggested_questions))
      .catch(() => setSuggestions([]));
  }, []);

  async function onSend(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    const next: ChatMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages([...next, { role: "assistant", content: "" }]);
    try {
      await streamChat(next, (delta) => {
        setMessages((cur) => {
          const copy = [...cur];
          copy[copy.length - 1] = {
            role: "assistant",
            content: copy[copy.length - 1].content + delta,
          };
          return copy;
        });
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

        <main className="flex flex-1 flex-col">
          {started ? (
            <ChatPanel messages={messages} busy={busy} />
          ) : (
            <IntroCard suggestions={suggestions} onPick={onSend} />
          )}
        </main>

        <div className="sticky bottom-0 z-20 -mx-5 bg-gradient-to-t from-ink via-ink/95 to-transparent px-5 pb-3 pt-8 sm:-mx-8 sm:px-8">
          <Composer busy={busy} onSend={onSend} />
        </div>

        <Footer onOpenSpec={() => setShowSpec(true)} />
      </div>

      {showSpec && <SpecDialog onClose={() => setShowSpec(false)} />}
    </>
  );
}
