import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  fetchSpec,
  fetchProjects,
  fetchProfile,
  fetchGitHub,
  streamChat,
  streamFit,
  type ChatMessage,
  type TokenUsage,
  type Project,
  type ProfileResponse,
  type GitHubSummary,
} from "./lib/api.js";
import { collectClientContext, getSessionDuration } from "./lib/device.js";
import BootSequence from "./components/BootSequence.js";
import SpecDialog from "./components/SpecDialog.js";
import FitDialog from "./components/FitDialog.js";
import HeroTile from "./components/portal/HeroTile.js";
import ProjectGrid from "./components/portal/ProjectGrid.js";
import GitHubTile from "./components/portal/GitHubTile.js";
import ProjectDetailDrawer from "./components/portal/ProjectDetailDrawer.js";
import ExperienceTimeline from "./components/portal/ExperienceTimeline.js";
import AboutTile from "./components/portal/AboutTile.js";
import PartnersTile from "./components/portal/PartnersTile.js";
import GuidePanel from "./components/portal/GuidePanel.js";

const GITHUB_URL = "https://github.com/MasterShayKe";

function TopBar() {
  return (
    <header className="flex items-center justify-between py-5">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.12] bg-white/[0.03] font-display text-lg leading-none text-white">
          S<span className="text-accent">K</span>
        </div>
        <div className="leading-tight">
          <div className="text-[0.95rem] font-semibold text-white">
            Shay Kopilevich
          </div>
          <div className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-white/40">
            Builder of AI agents &amp; systems
          </div>
        </div>
      </div>
      <a
        href={GITHUB_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 rounded-full border border-accent/25 bg-accent/[0.06] px-3.5 py-1.5 font-mono text-[0.7rem] text-white/70 transition-colors hover:border-accent/50 hover:text-accent"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.5.5.09.66-.22.66-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.1-1.47-1.1-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.6 9.6 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.94.36.31.68.92.68 1.85v2.74c0 .27.16.58.67.48A10 10 0 0 0 22 12c0-5.52-4.48-10-10-10z" />
        </svg>
        github.com/MasterShayKe
      </a>
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

  const [projects, setProjects] = useState<Project[]>([]);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [github, setGithub] = useState<GitHubSummary | null>(null);
  const [openProject, setOpenProject] = useState<Project | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);

  useEffect(() => {
    fetchSpec()
      .then((s) => setSuggestions(s.persona.suggested_questions))
      .catch(() => setSuggestions([]));

    fetchProjects()
      .then(setProjects)
      .catch((err) => setDataError((err as Error).message));
    fetchProfile()
      .then(setProfile)
      .catch((err) => setDataError((err as Error).message));
    fetchGitHub()
      .then(setGithub)
      .catch(() => setGithub({ login: "MasterShayKe", available: false, publicRepos: 0, totalStars: 0, languages: [], recent: [] }));
  }, []);

  function onClear() {
    setMessages([]);
    setDynamicSuggestions([]);
    setTokenUsage({});
  }

  async function onSend(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setGuideOpen(true);
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
        onTool: (tool) => {
          if (tool.name === "focusProject" && tool.projectId) {
            const p = projects.find((proj) => proj.id === tool.projectId);
            if (p) setOpenProject(p);
          }
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
    setGuideOpen(true);
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

  const handleCloseProject = useCallback(() => setOpenProject(null), []);

  const guideSheetRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (guideOpen) guideSheetRef.current?.focus();
  }, [guideOpen]);

  const guideProps = useMemo(
    () => ({
      messages,
      busy,
      onSend,
      onClear,
      onFit: () => setShowFit(true),
      tokenUsage,
      dynamicSuggestions,
      suggestions,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [messages, busy, tokenUsage, dynamicSuggestions, suggestions],
  );

  return (
    <>
      <div className="bg-atmosphere" aria-hidden />
      <div className="bg-grid" aria-hidden />
      <div className="bg-grain" aria-hidden />

      {!bootDone ? (
        <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-3xl flex-col px-5 sm:px-8">
          <BootSequence
            clientContext={initialClientContext}
            onDone={() => setBootDone(true)}
          />
        </div>
      ) : (
        <div className="relative z-10 mx-auto w-full max-w-6xl px-5 sm:px-7">
          <TopBar />

          {dataError && (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/[0.06] px-4 py-3 font-mono text-[0.75rem] text-red-300">
              Couldn't load portfolio data ({dataError}). The guide still works.
            </div>
          )}

          <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1.35fr_1fr]">
            {/* LEFT: content column */}
            <div className="flex flex-col gap-4">
              {profile && <HeroTile hero={profile.hero} stats={profile.stats} />}

              <ProjectGrid
                projects={projects}
                onOpen={setOpenProject}
                trailing={<GitHubTile data={github} />}
              />

              {profile && <ExperienceTimeline experience={profile.experience} />}

              {profile && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <AboutTile about={profile.about} />
                  <PartnersTile partners={profile.partners} />
                </div>
              )}
            </div>

            {/* RIGHT: sticky guide (desktop only) */}
            <div className="hidden lg:block">
              <GuidePanel {...guideProps} variant="sticky" />
            </div>
          </div>

          <Footer onOpenSpec={() => setShowSpec(true)} />
        </div>
      )}

      {/* Mobile: floating launch button + full-screen guide sheet */}
      {bootDone && !guideOpen && (
        <button
          onClick={() => setGuideOpen(true)}
          className="fixed bottom-5 right-5 z-30 flex items-center gap-2 rounded-full border border-accent/40 bg-accent px-5 py-3 font-mono text-[0.75rem] font-semibold text-white shadow-[0_0_30px_-6px_rgba(168,85,247,0.8)] lg:hidden"
        >
          <span className="h-2 w-2 rounded-full bg-white/90" />
          Ask the guide
        </button>
      )}

      {bootDone && guideOpen && (
        <div
          ref={guideSheetRef}
          tabIndex={-1}
          aria-modal="true"
          role="dialog"
          aria-label="Guide"
          className="fixed inset-0 z-40 flex flex-col bg-black/70 p-3 backdrop-blur-sm focus:outline-none lg:hidden"
        >
          <GuidePanel
            {...guideProps}
            variant="sheet"
            onClose={() => setGuideOpen(false)}
          />
        </div>
      )}

      {openProject && (
        <ProjectDetailDrawer project={openProject} onClose={handleCloseProject} />
      )}

      {showSpec && <SpecDialog onClose={() => setShowSpec(false)} />}
      {showFit && (
        <FitDialog onClose={() => setShowFit(false)} onAnalyze={onAnalyzeFit} />
      )}
    </>
  );
}
