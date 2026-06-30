import { useEffect, useRef, useState } from "react";
import {
  fetchMe,
  onboardingChat,
  extractKnowledge,
  acceptKnowledge,
  type ChatMessage,
  type ProposedItem,
  type MeResponse,
} from "../lib/api.js";
import { navigate } from "../lib/router.js";
import Markdown from "../components/Markdown.js";

function Bubble({ m }: { m: ChatMessage }) {
  if (m.role === "user") {
    return (
      <div className="flex justify-end">
        <div
          dir="auto"
          className="max-w-[82%] rounded-2xl rounded-br-md border border-accent/20 bg-accent/[0.08] px-4 py-2.5 text-[0.95rem] leading-relaxed text-white"
        >
          {m.content}
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-3.5">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-accent/25 bg-accent/[0.08] font-mono text-accent">
        ◆
      </div>
      <div dir="auto" className="min-w-0 flex-1 pt-0.5">
        {m.content ? (
          <Markdown>{m.content}</Markdown>
        ) : (
          <span className="font-mono text-sm text-white/40">…</span>
        )}
      </div>
    </div>
  );
}

const KIND_LABEL: Record<string, string> = {
  experience: "experience",
  project: "project",
  cv: "summary",
  personal: "personal",
  custom: "custom",
};

export default function Onboarding() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [checked, setChecked] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [proposals, setProposals] = useState<ProposedItem[] | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [savedCount, setSavedCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    fetchMe()
      .then((res) => {
        if (!res) {
          navigate("/login");
          return;
        }
        setMe(res);
      })
      .catch(() => navigate("/login"))
      .finally(() => setChecked(true));
  }, []);

  // Kick off the interviewer's opening message once we know who's here.
  useEffect(() => {
    if (!me || started.current) return;
    started.current = true;
    void runTurn([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, proposals]);

  async function runTurn(history: ChatMessage[]) {
    setBusy(true);
    setError(null);
    setMessages([...history, { role: "assistant", content: "" }]);
    try {
      await onboardingChat({
        messages: history,
        onDelta: (delta) =>
          setMessages((cur) => {
            const copy = [...cur];
            copy[copy.length - 1] = {
              role: "assistant",
              content: copy[copy.length - 1].content + delta,
            };
            return copy;
          }),
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    const history: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(history);
    await runTurn(history);
  }

  async function build() {
    setBusy(true);
    setError(null);
    try {
      const items = await extractKnowledge(messages);
      setProposals(items);
      setSelected(new Set(items.map((_, i) => i)));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function accept() {
    if (!proposals) return;
    const chosen = proposals.filter((_, i) => selected.has(i));
    if (!chosen.length) return;
    setBusy(true);
    try {
      await acceptKnowledge(chosen);
      setSavedCount(chosen.length);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const userTurns = messages.filter((m) => m.role === "user").length;
  const canBuild = userTurns >= 2 && !busy && !proposals;

  if (!checked || !me) return null;

  return (
    <div className="relative min-h-screen">
      <div className="bg-atmosphere" aria-hidden />
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-2xl flex-col px-5 sm:px-8">
        <header className="flex items-center justify-between border-b border-white/[0.06] py-5">
          <div>
            <div className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-accent/80">
              Onboarding
            </div>
            <h1 className="mt-1 font-display text-2xl text-white">
              Build your interview agent
            </h1>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="font-mono text-[0.64rem] uppercase tracking-[0.14em] text-white/40 hover:text-accent"
          >
            Skip to editor →
          </button>
        </header>

        <main className="flex flex-1 flex-col gap-6 py-6">
          {messages.map((m, i) => (
            <Bubble key={i} m={m} />
          ))}

          {error && (
            <div className="rounded-lg border border-red-400/30 bg-red-400/[0.06] px-4 py-2 text-sm text-red-200/80">
              {error}
            </div>
          )}

          {/* Proposed knowledge review */}
          {proposals && savedCount === null && (
            <div className="rounded-2xl border border-accent/20 bg-accent/[0.04] p-4">
              <div className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-accent/80">
                Proposed knowledge - review and add
              </div>
              {proposals.length === 0 && (
                <p className="mt-2 text-sm text-white/50">
                  Not enough yet - tell me a bit more about your roles and
                  projects, then build again.
                </p>
              )}
              <div className="mt-3 space-y-2">
                {proposals.map((it, i) => (
                  <label
                    key={i}
                    className="flex cursor-pointer gap-3 rounded-xl border border-white/[0.08] bg-black/30 p-3"
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(i)}
                      onChange={(e) =>
                        setSelected((s) => {
                          const n = new Set(s);
                          e.target.checked ? n.add(i) : n.delete(i);
                          return n;
                        })
                      }
                      className="mt-1 h-4 w-4 accent-[#C6F24E]"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="rounded border border-accent/25 bg-accent/[0.06] px-1.5 py-0.5 font-mono text-[0.55rem] uppercase tracking-wider text-accent/80">
                          {KIND_LABEL[it.kind] ?? it.kind}
                        </span>
                        <span className="truncate text-sm text-white/85">
                          {it.title}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-3 text-[0.82rem] leading-relaxed text-white/55">
                        {it.body}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
              {proposals.length > 0 && (
                <div className="mt-4 flex items-center justify-between">
                  <button
                    onClick={() => setProposals(null)}
                    className="text-[0.78rem] text-white/40 hover:text-white"
                  >
                    Keep chatting
                  </button>
                  <button
                    onClick={accept}
                    disabled={busy || selected.size === 0}
                    className="rounded-lg bg-accent px-4 py-2 text-[0.8rem] font-medium text-ink transition-all disabled:bg-white/10 disabled:text-white/30"
                  >
                    {busy ? "Adding…" : `Add ${selected.size} to my bot`}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Saved confirmation */}
          {savedCount !== null && (
            <div className="rounded-2xl border border-accent/25 bg-accent/[0.06] p-5 text-center">
              <div className="font-display text-xl text-white">
                Added {savedCount} item{savedCount === 1 ? "" : "s"} to your agent.
              </div>
              <p className="mt-1.5 text-sm text-white/55">
                Open the editor to review, set a handle, and publish.
              </p>
              <button
                onClick={() => navigate("/dashboard")}
                className="mt-4 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-ink"
              >
                Go to the editor →
              </button>
            </div>
          )}

          <div ref={endRef} />
        </main>

        {/* Composer */}
        {savedCount === null && (
          <div className="sticky bottom-0 z-20 -mx-5 bg-gradient-to-t from-ink via-ink/95 to-transparent px-5 pb-4 pt-6 sm:-mx-8 sm:px-8">
            {canBuild && (
              <div className="mb-2 flex justify-center">
                <button
                  onClick={build}
                  className="rounded-full border border-accent/30 bg-accent/[0.08] px-4 py-1.5 text-[0.8rem] font-medium text-accent transition-all hover:bg-accent/[0.14]"
                >
                  ✦ Build my knowledge base
                </button>
              </div>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
              className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-1.5 pl-5 focus-within:border-accent/40"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                dir="auto"
                disabled={busy}
                placeholder="Type your answer…"
                className="min-w-0 flex-1 bg-transparent py-2.5 text-[0.95rem] text-white placeholder:text-white/30 focus:outline-none"
              />
              <button
                type="submit"
                disabled={busy || !input.trim()}
                className="rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-ink transition-all disabled:bg-white/10 disabled:text-white/30"
              >
                Send
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
