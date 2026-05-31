import { useEffect, useState } from "react";
import { fetchSpec, streamChat, type ChatMessage } from "./lib/api.js";
import IntroCard from "./components/IntroCard.js";
import ChatPanel from "./components/ChatPanel.js";
import SpecDialog from "./components/SpecDialog.js";

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
        copy[copy.length - 1] = { role: "assistant", content: (err as Error).message };
        return copy;
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-4 py-8">
      {messages.length === 0 && (
        <IntroCard suggestions={suggestions} onPick={onSend} />
      )}
      <ChatPanel messages={messages} busy={busy} onSend={onSend} />
      <button
        onClick={() => setShowSpec(true)}
        className="self-start text-xs text-slate-500 underline"
      >
        View the spec that defines this bot
      </button>
      {showSpec && <SpecDialog onClose={() => setShowSpec(false)} />}
      <p className="mt-auto text-center text-xs text-slate-400">
        Powered by Claude · Built by Shay Kopilevich
      </p>
    </div>
  );
}
