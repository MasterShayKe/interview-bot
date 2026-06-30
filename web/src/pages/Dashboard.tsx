import { useEffect, useState } from "react";
import {
  fetchMe,
  fetchMyBot,
  updateMyBot,
  addKnowledge,
  updateKnowledge,
  deleteKnowledge,
  reorderKnowledge,
  logout,
  fetchUsage,
  type OwnerBot,
  type KnowledgeItem,
  type KnowledgeKind,
  type UsageSummary,
} from "../lib/api.js";
import { navigate } from "../lib/router.js";
import { applyAccent, resetAccent, fileToResizedDataUrl } from "../lib/theme.js";

const KINDS: KnowledgeKind[] = [
  "experience",
  "project",
  "cv",
  "personal",
  "custom",
];

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-mono text-[0.62rem] uppercase tracking-[0.16em] text-white/45">
        {label}
      </span>
      {children}
      {hint && <span className="mt-1 block text-[0.72rem] text-white/30">{hint}</span>}
    </label>
  );
}

const inputCls =
  "w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/85 placeholder:text-white/25 focus:border-accent/40 focus:outline-none";

// --- knowledge editor row -------------------------------------------------

function KnowledgeRow({
  item,
  first,
  last,
  onSaved,
  onDeleted,
  onMove,
}: {
  item: KnowledgeItem;
  first: boolean;
  last: boolean;
  onSaved: (it: KnowledgeItem) => void;
  onDeleted: (id: string) => void;
  onMove: (id: string, dir: -1 | 1) => void;
}) {
  const [kind, setKind] = useState<KnowledgeKind>(item.kind);
  const [title, setTitle] = useState(item.title);
  const [body, setBody] = useState(item.body);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const dirty = kind !== item.kind || title !== item.title || body !== item.body;

  async function save() {
    setSaving(true);
    try {
      const { item: updated } = await updateKnowledge(item.id, { kind, title, body });
      onSaved(updated);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02]">
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="rounded-md border border-accent/25 bg-accent/[0.06] px-2 py-0.5 font-mono text-[0.58rem] uppercase tracking-wider text-accent/80">
          {item.kind}
        </span>
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex-1 truncate text-left text-sm text-white/80 hover:text-white"
        >
          {item.title || <span className="text-white/30">Untitled</span>}
        </button>
        <div className="flex items-center gap-1">
          <button
            disabled={first}
            onClick={() => onMove(item.id, -1)}
            className="px-1.5 text-white/40 enabled:hover:text-accent disabled:opacity-20"
            aria-label="Move up"
          >
            ↑
          </button>
          <button
            disabled={last}
            onClick={() => onMove(item.id, 1)}
            className="px-1.5 text-white/40 enabled:hover:text-accent disabled:opacity-20"
            aria-label="Move down"
          >
            ↓
          </button>
          <button
            onClick={() => setOpen((o) => !o)}
            className="px-2 font-mono text-[0.6rem] uppercase tracking-wider text-white/40 hover:text-accent"
          >
            {open ? "close" : "edit"}
          </button>
        </div>
      </div>

      {open && (
        <div className="space-y-3 border-t border-white/[0.07] px-4 py-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Type">
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value as KnowledgeKind)}
                className={inputCls}
              >
                {KINDS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Title">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={inputCls}
                placeholder="e.g. Senior Engineer at Acme"
              />
            </Field>
          </div>
          <Field label="Details (Markdown)">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={7}
              dir="auto"
              className={inputCls + " resize-y font-mono text-[0.8rem] leading-relaxed"}
              placeholder="What you did, the impact, and the stack."
            />
          </Field>
          <div className="flex items-center justify-between">
            <button
              onClick={() => onDeleted(item.id)}
              className="text-[0.78rem] text-red-300/60 hover:text-red-300"
            >
              Delete
            </button>
            <button
              onClick={save}
              disabled={!dirty || saving}
              className="rounded-lg bg-accent px-4 py-2 text-[0.8rem] font-medium text-ink transition-all disabled:bg-white/10 disabled:text-white/30"
            >
              {saving ? "Saving…" : "Save item"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- main page ------------------------------------------------------------

export default function Dashboard() {
  const [bot, setBot] = useState<OwnerBot | null>(null);
  const [knowledge, setKnowledge] = useState<KnowledgeItem[]>([]);
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMe()
      .then((me) => {
        if (!me) {
          navigate("/login");
          return null;
        }
        setIsAdmin(Boolean(me.isAdmin));
        return fetchMyBot();
      })
      .then((res) => {
        if (!res) return;
        setBot(res.bot);
        setKnowledge(res.knowledge);
        fetchUsage().then(setUsage).catch(() => {});
      })
      .catch(() => setError("Could not load your dashboard."))
      .finally(() => setLoaded(true));
  }, []);

  function flash(msg: string) {
    setNotice(msg);
    setError(null);
    window.setTimeout(() => setNotice(null), 2500);
  }

  async function saveProfile(patch: Partial<OwnerBot>) {
    setError(null);
    try {
      const { bot: updated } = await updateMyBot(patch);
      setBot(updated);
      flash("Saved.");
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function onAdd(kind: KnowledgeKind) {
    const { item } = await addKnowledge({ kind, title: "", body: "" });
    setKnowledge((k) => [...k, item]);
  }

  async function onDelete(id: string) {
    await deleteKnowledge(id);
    setKnowledge((k) => k.filter((it) => it.id !== id));
  }

  async function onMove(id: string, dir: -1 | 1) {
    const idx = knowledge.findIndex((k) => k.id === id);
    const swap = idx + dir;
    if (idx < 0 || swap < 0 || swap >= knowledge.length) return;
    const next = [...knowledge];
    [next[idx], next[swap]] = [next[swap], next[idx]];
    setKnowledge(next);
    const { knowledge: saved } = await reorderKnowledge(next.map((k) => k.id));
    setKnowledge(saved);
  }

  if (!loaded) return null;
  if (!bot) {
    return (
      <div className="flex min-h-screen items-center justify-center text-white/50">
        {error ?? "No bot found."}
      </div>
    );
  }

  const published = bot.status === "published";

  return (
    <div className="relative min-h-screen">
      <div className="bg-atmosphere" aria-hidden />
      <div className="relative z-10 mx-auto w-full max-w-3xl px-5 py-8 sm:px-8">
        <header className="flex items-center justify-between border-b border-white/[0.06] pb-5">
          <div>
            <div className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-accent/80">
              Dashboard
            </div>
            <h1 className="mt-1 font-display text-2xl text-white">
              {bot.displayName || "Your interview agent"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <button
                onClick={() => navigate("/admin")}
                className="font-mono text-[0.64rem] uppercase tracking-[0.14em] text-accent/80 hover:text-accent"
              >
                Admin →
              </button>
            )}
            {bot.handle && published && (
              <button
                onClick={() => navigate(`/u/${bot.handle}`)}
                className="font-mono text-[0.64rem] uppercase tracking-[0.14em] text-accent/80 hover:text-accent"
              >
                View live →
              </button>
            )}
            <button
              onClick={async () => {
                await logout();
                navigate("/");
              }}
              className="font-mono text-[0.64rem] uppercase tracking-[0.14em] text-white/40 hover:text-white"
            >
              Log out
            </button>
          </div>
        </header>

        {notice && (
          <div className="mt-4 rounded-lg border border-accent/25 bg-accent/[0.06] px-4 py-2 text-sm text-accent/90">
            {notice}
          </div>
        )}
        {error && (
          <div className="mt-4 rounded-lg border border-red-400/30 bg-red-400/[0.06] px-4 py-2 text-sm text-red-200/80">
            {error}
          </div>
        )}

        {/* Publish + handle */}
        <PublishCard bot={bot} onSave={saveProfile} />

        {/* Share link */}
        {published && bot.handle && <ShareCard handle={bot.handle} />}

        {/* Usage analytics */}
        {usage && <AnalyticsCard usage={usage} />}

        {/* Profile */}
        <ProfileForm bot={bot} onSave={saveProfile} />

        {/* Knowledge */}
        <section className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl text-white">Knowledge</h2>
            <div className="flex gap-2">
              <button
                onClick={() => onAdd("experience")}
                className="rounded-lg border border-white/12 bg-white/[0.03] px-3 py-1.5 text-[0.78rem] text-white/70 hover:border-accent/40 hover:text-white"
              >
                + Experience
              </button>
              <button
                onClick={() => onAdd("project")}
                className="rounded-lg border border-white/12 bg-white/[0.03] px-3 py-1.5 text-[0.78rem] text-white/70 hover:border-accent/40 hover:text-white"
              >
                + Project
              </button>
            </div>
          </div>
          <p className="mt-1 text-[0.8rem] text-white/40">
            These are the only facts your agent can state. Reorder to control
            priority.
          </p>

          <div className="mt-4 space-y-2.5">
            {knowledge.length === 0 && (
              <div className="rounded-xl border border-dashed border-white/12 px-4 py-8 text-center text-sm text-white/40">
                No knowledge yet. Add your experience and projects above.
              </div>
            )}
            {knowledge.map((item, i) => (
              <KnowledgeRow
                key={item.id}
                item={item}
                first={i === 0}
                last={i === knowledge.length - 1}
                onSaved={(u) =>
                  setKnowledge((k) => k.map((it) => (it.id === u.id ? u : it)))
                }
                onDeleted={onDelete}
                onMove={onMove}
              />
            ))}
          </div>
        </section>

        <div className="h-16" />
      </div>
    </div>
  );
}

// --- share card -----------------------------------------------------------

function ShareCard({ handle }: { handle: string }) {
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/u/${handle}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // clipboard may be blocked; fall through to the visual cue anyway
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <section className="mt-6 rounded-2xl border border-accent/20 bg-accent/[0.04] p-5">
      <div className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-accent/80">
        Your shareable link
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <code className="flex-1 truncate rounded-lg border border-white/10 bg-black/40 px-3 py-2 font-mono text-[0.82rem] text-white/80">
          {url}
        </code>
        <button
          onClick={copy}
          className="rounded-lg bg-accent px-4 py-2 text-[0.8rem] font-medium text-ink transition-all hover:shadow-[0_0_22px_-8px] hover:shadow-accent"
        >
          {copied ? "Copied ✓" : "Copy link"}
        </button>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg border border-white/12 bg-white/[0.03] px-4 py-2 text-[0.8rem] text-white/70 hover:border-accent/40 hover:text-white"
        >
          Open
        </a>
      </div>
      <p className="mt-2 text-[0.78rem] text-white/35">
        Put this on your CV, LinkedIn, or email signature.
      </p>
    </section>
  );
}

// --- analytics card -------------------------------------------------------

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-black/20 p-3.5">
      <div className="font-mono text-[0.58rem] uppercase tracking-wider text-white/40">
        {label}
      </div>
      <div className="mt-1 font-display text-xl text-white">{value}</div>
    </div>
  );
}

function compact(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "k";
  return String(n);
}

function AnalyticsCard({ usage }: { usage: UsageSummary }) {
  const pct = usage.cap > 0 ? Math.min(100, (usage.today / usage.cap) * 100) : 0;
  const peak = Math.max(1, ...usage.perDay.map((d) => d.tokens));
  return (
    <section className="mt-6 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
      <h2 className="font-display text-xl text-white">Usage</h2>

      {/* Today vs cap */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-[0.8rem]">
          <span className="text-white/55">Today</span>
          <span className="font-mono text-white/70">
            {usage.today.toLocaleString()} / {usage.cap.toLocaleString()} tokens
          </span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className={
              "h-full rounded-full " +
              (pct >= 100 ? "bg-amber-400/80" : "bg-accent")
            }
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-1 text-[0.72rem] text-white/35">
          {pct >= 100
            ? "Daily limit reached - resets tomorrow."
            : `${Math.round(usage.cap - usage.today).toLocaleString()} tokens left today`}
        </div>
      </div>

      {/* Totals */}
      <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <Stat label="Chats today" value={String(usage.todayRequests)} />
        <Stat label="Tokens 7d" value={compact(usage.last7)} />
        <Stat label="Tokens 30d" value={compact(usage.last30)} />
        <Stat label="Chats all-time" value={String(usage.allRequests)} />
      </div>

      {/* 14-day sparkline */}
      {usage.perDay.length > 0 && (
        <div className="mt-5">
          <div className="font-mono text-[0.58rem] uppercase tracking-wider text-white/40">
            Last 14 days
          </div>
          <div className="mt-2 flex h-16 items-end gap-1">
            {usage.perDay.map((d) => (
              <div
                key={d.day}
                title={`${d.day}: ${d.tokens.toLocaleString()} tokens · ${d.requests} chats`}
                className="flex-1 rounded-t bg-accent/40 transition-colors hover:bg-accent/70"
                style={{ height: `${Math.max(4, (d.tokens / peak) * 100)}%` }}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

// --- publish card ---------------------------------------------------------

function PublishCard({
  bot,
  onSave,
}: {
  bot: OwnerBot;
  onSave: (patch: Partial<OwnerBot>) => Promise<void>;
}) {
  const [handle, setHandle] = useState(bot.handle ?? "");
  const published = bot.status === "published";

  return (
    <section className="mt-6 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex-1">
          <Field label="Public handle" hint="Your agent will live at /u/<handle>.">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-white/40">/u/</span>
              <input
                value={handle}
                onChange={(e) => setHandle(e.target.value.toLowerCase())}
                placeholder="your-name"
                className={inputCls}
              />
            </div>
          </Field>
        </div>
        <button
          onClick={() => onSave({ handle })}
          className="rounded-lg border border-white/12 bg-white/[0.03] px-4 py-2 text-sm text-white/80 hover:border-accent/40"
        >
          Save handle
        </button>
        <button
          onClick={() =>
            onSave({ status: published ? "draft" : "published", handle })
          }
          className={
            "rounded-lg px-4 py-2 text-sm font-medium transition-all " +
            (published
              ? "border border-white/12 bg-white/[0.03] text-white/70 hover:text-white"
              : "bg-accent text-ink hover:shadow-[0_0_24px_-8px] hover:shadow-accent")
          }
        >
          {published ? "Unpublish" : "Publish"}
        </button>
      </div>
      <div className="mt-3 flex items-center gap-2 text-[0.78rem]">
        <span
          className={
            "h-2 w-2 rounded-full " + (published ? "bg-accent" : "bg-white/30")
          }
        />
        <span className="text-white/50">
          {published ? "Live and public" : "Draft - only you can see it"}
        </span>
      </div>
    </section>
  );
}

// --- profile form ---------------------------------------------------------

function ProfileForm({
  bot,
  onSave,
}: {
  bot: OwnerBot;
  onSave: (patch: Partial<OwnerBot>) => Promise<void>;
}) {
  const [form, setForm] = useState({
    displayName: bot.displayName,
    subjectName: bot.subjectName,
    targetRole: bot.targetRole,
    contactEmail: bot.contactEmail,
    tone: bot.tone,
    languageRule: bot.languageRule,
    pSubject: bot.pronouns.subject,
    pObject: bot.pronouns.object,
    pPossessive: bot.pronouns.possessive,
    suggested: bot.suggestedQuestions.join("\n"),
    accent: bot.theme.accent ?? "#C6F24E",
  });
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(bot.theme.avatarUrl);
  const [logoUrl, setLogoUrl] = useState<string | undefined>(bot.theme.logoUrl);
  const [imgError, setImgError] = useState<string | null>(null);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  // Live-preview the accent across the editor; restore default on unmount.
  useEffect(() => {
    applyAccent({ accent: form.accent });
  }, [form.accent]);
  useEffect(() => () => resetAccent(), []);

  async function pickImage(
    file: File | undefined,
    setter: (v: string | undefined) => void,
  ) {
    if (!file) return;
    setImgError(null);
    try {
      setter(await fileToResizedDataUrl(file, 256));
    } catch (e) {
      setImgError((e as Error).message);
    }
  }

  function save() {
    onSave({
      displayName: form.displayName,
      subjectName: form.subjectName,
      targetRole: form.targetRole,
      contactEmail: form.contactEmail,
      tone: form.tone,
      languageRule: form.languageRule,
      pronouns: {
        subject: form.pSubject,
        object: form.pObject,
        possessive: form.pPossessive,
      },
      suggestedQuestions: form.suggested
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      theme: { ...bot.theme, accent: form.accent, avatarUrl, logoUrl },
    });
  }

  return (
    <section className="mt-6 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
      <h2 className="font-display text-xl text-white">Profile</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Agent name" hint="Shown in the header.">
          <input
            className={inputCls}
            value={form.displayName}
            onChange={(e) => set("displayName", e.target.value)}
          />
        </Field>
        <Field label="Your name" hint="The person represented.">
          <input
            className={inputCls}
            value={form.subjectName}
            onChange={(e) => set("subjectName", e.target.value)}
          />
        </Field>
        <Field label="Target role">
          <input
            className={inputCls}
            value={form.targetRole}
            onChange={(e) => set("targetRole", e.target.value)}
          />
        </Field>
        <Field label="Contact email">
          <input
            className={inputCls}
            value={form.contactEmail}
            onChange={(e) => set("contactEmail", e.target.value)}
          />
        </Field>
        <Field label="Tone">
          <input
            className={inputCls}
            value={form.tone}
            onChange={(e) => set("tone", e.target.value)}
          />
        </Field>
        <Field label="Language rule">
          <input
            className={inputCls}
            value={form.languageRule}
            onChange={(e) => set("languageRule", e.target.value)}
          />
        </Field>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Field label="Pronoun (subject)" hint="he / she / they">
          <input
            className={inputCls}
            value={form.pSubject}
            onChange={(e) => set("pSubject", e.target.value)}
          />
        </Field>
        <Field label="Pronoun (object)" hint="him / her / them">
          <input
            className={inputCls}
            value={form.pObject}
            onChange={(e) => set("pObject", e.target.value)}
          />
        </Field>
        <Field label="Pronoun (possessive)" hint="his / her / their">
          <input
            className={inputCls}
            value={form.pPossessive}
            onChange={(e) => set("pPossessive", e.target.value)}
          />
        </Field>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Suggested questions" hint="One per line.">
          <textarea
            rows={4}
            className={inputCls + " resize-y"}
            value={form.suggested}
            onChange={(e) => set("suggested", e.target.value)}
          />
        </Field>
        <Field label="Accent color" hint="Applied to your public page.">
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={form.accent}
              onChange={(e) => set("accent", e.target.value)}
              className="h-10 w-14 cursor-pointer rounded-lg border border-white/10 bg-transparent"
            />
            <input
              className={inputCls}
              value={form.accent}
              onChange={(e) => set("accent", e.target.value)}
            />
          </div>
        </Field>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <ImagePicker
          label="Avatar / profile picture"
          hint="Square works best. Shown in your agent's header."
          value={avatarUrl}
          rounded="rounded-full"
          onPick={(f) => pickImage(f, setAvatarUrl)}
          onClear={() => setAvatarUrl(undefined)}
        />
        <ImagePicker
          label="Logo (optional)"
          hint="Overrides the avatar in the header if set."
          value={logoUrl}
          rounded="rounded-lg"
          onPick={(f) => pickImage(f, setLogoUrl)}
          onClear={() => setLogoUrl(undefined)}
        />
      </div>
      {imgError && (
        <p className="mt-2 text-[0.78rem] text-red-300/70">{imgError}</p>
      )}

      <div className="mt-5 flex justify-end">
        <button
          onClick={save}
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-ink transition-all hover:shadow-[0_0_24px_-8px] hover:shadow-accent"
        >
          Save profile
        </button>
      </div>
    </section>
  );
}

function ImagePicker({
  label,
  hint,
  value,
  rounded,
  onPick,
  onClear,
}: {
  label: string;
  hint: string;
  value: string | undefined;
  rounded: string;
  onPick: (file: File | undefined) => void;
  onClear: () => void;
}) {
  return (
    <Field label={label} hint={hint}>
      <div className="flex items-center gap-3">
        <div
          className={
            "flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden border border-white/10 bg-black/30 " +
            rounded
          }
        >
          {value ? (
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="font-mono text-[0.6rem] text-white/30">none</span>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="cursor-pointer rounded-lg border border-white/12 bg-white/[0.03] px-3 py-1.5 text-[0.78rem] text-white/70 transition-colors hover:border-accent/40 hover:text-white">
            {value ? "Replace" : "Upload"}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => onPick(e.target.files?.[0])}
            />
          </label>
          {value && (
            <button
              type="button"
              onClick={onClear}
              className="text-left text-[0.74rem] text-white/35 hover:text-red-300"
            >
              Remove
            </button>
          )}
        </div>
      </div>
    </Field>
  );
}
