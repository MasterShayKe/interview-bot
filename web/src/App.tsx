import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
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
import { useReveal } from "./lib/useReveal.js";
import BootSequence from "./components/BootSequence.js";
import SpecDialog from "./components/SpecDialog.js";
import FitDialog from "./components/FitDialog.js";
import GitHubStat from "./components/portal/GitHubStat.js";
import ProjectGrid from "./components/portal/ProjectGrid.js";
import ProjectConstellation from "./components/constellation/ProjectConstellation.js";
import ProjectDetailDrawer from "./components/portal/ProjectDetailDrawer.js";
import ExperienceTimeline from "./components/portal/ExperienceTimeline.js";
import FooterBand from "./components/portal/FooterBand.js";
import PlaygroundCTA from "./components/portal/PlaygroundCTA.js";
import GuidePanel from "./components/portal/GuidePanel.js";
import GuideDock from "./components/portal/GuideDock.js";
import Playground from "./components/portal/Playground.js";

function TopBar({ github }: { github: GitHubSummary | null }) {
  return (
    <header className="flex items-center justify-between gap-3 py-5">
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
      <GitHubStat data={github} />
    </header>
  );
}

function SectionHeading({
  eyebrow,
  title,
  sub,
}: {
  eyebrow: string;
  title: string;
  sub?: string;
}) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2.5 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-accent/75">
        <span className="h-px w-6 bg-accent/50" />
        {eyebrow}
      </div>
      <h2 className="mt-2 font-display text-[1.9rem] leading-tight text-white sm:text-[2.2rem]">
        {title}
      </h2>
      {sub && (
        <p className="mt-1.5 max-w-2xl text-[0.88rem] leading-relaxed text-white/55">
          {sub}
        </p>
      )}
    </div>
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
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [playgroundOpen, setPlaygroundOpen] = useState(false);

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
      .catch(() =>
        setGithub({
          login: "MasterShayKe",
          available: false,
          publicRepos: 0,
          totalStars: 0,
          languages: [],
          recent: [],
        }),
      );
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
            if (p) {
              // Fly the constellation camera to this node AND open the drawer.
              setFocusedId(p.id);
              setOpenProject(p);
            }
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

  const handleCloseProject = useCallback(() => {
    setOpenProject(null);
    // Release the camera focus so the constellation re-centers + auto-rotates.
    setFocusedId(null);
  }, []);

  // Anchor below the immersive constellation; the "scroll to explore" cue and
  // guided reveals scroll here.
  const revealAnchorRef = useRef<HTMLDivElement>(null);
  const handleEnter = useCallback(() => {
    revealAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handleConstellationSelect = useCallback((p: Project) => {
    setFocusedId(p.id);
    setOpenProject(p);
  }, []);

  const guideSheetRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!guideOpen) return;
    guideSheetRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setGuideOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
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

  const playgroundReveal = useReveal<HTMLDivElement>();
  const experienceReveal = useReveal<HTMLElement>();
  const footerReveal = useReveal<HTMLDivElement>();

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
        <div className="relative z-10">
          {/* Immersive first viewport: the 3D project constellation. Owns the
              full screen; everything else reveals below the anchor. */}
          <ProjectConstellation
            projects={projects}
            focusedId={focusedId}
            onSelect={handleConstellationSelect}
            onEnter={handleEnter}
          />

          {/* The rest of the page, revealed on scroll. */}
          <div
            ref={revealAnchorRef}
            className="mx-auto w-full max-w-5xl px-5 pb-28 pt-4 sm:px-7"
          >
            <TopBar github={github} />

            {dataError && (
              <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/[0.06] px-4 py-3 font-mono text-[0.75rem] text-red-300">
                Couldn't load portfolio data ({dataError}). The guide still works.
              </div>
            )}

            {/* Projects recap — the grid stays available below the fold too. */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "0px 0px -10% 0px" }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="mt-8"
            >
              <SectionHeading
                eyebrow="Selected work"
                title="Projects"
                sub="Seven systems I've designed, built, and shipped — click any to dive in, or ask the guide to walk you through one."
              />
              <ProjectGrid projects={projects} onOpen={handleConstellationSelect} />
            </motion.section>

            {/* Playground CTA */}
            <div
              ref={playgroundReveal.ref}
              className={"mt-12 " + playgroundReveal.className}
              style={playgroundReveal.style}
            >
              <PlaygroundCTA onOpen={() => setPlaygroundOpen(true)} />
            </div>

            {/* Experience — the second focal section */}
            {profile && (
              <section
                ref={experienceReveal.ref}
                className={"mt-12 " + experienceReveal.className}
                style={experienceReveal.style}
              >
                <ExperienceTimeline experience={profile.experience} />
              </section>
            )}

            {/* Slim footer band */}
            {profile && (
              <div
                ref={footerReveal.ref}
                className={footerReveal.className}
                style={footerReveal.style}
              >
                <FooterBand
                  partners={profile.partners}
                  about={profile.about}
                  onOpenSpec={() => setShowSpec(true)}
                  onOpenFit={() => setShowFit(true)}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Persistent guide launcher (all breakpoints) */}
      {bootDone && (
        <GuideDock
          onOpen={() => setGuideOpen(true)}
          hidden={guideOpen}
          active={busy || messages.length > 0}
        />
      )}

      {/* Guide overlay: side-rail (desktop) / full-screen sheet (mobile) */}
      {bootDone && guideOpen && (
        <div
          className="fixed inset-0 z-40 flex justify-end"
          aria-hidden={false}
        >
          <div
            className="absolute inset-0 animate-scrim bg-black/65 backdrop-blur-sm"
            onClick={() => setGuideOpen(false)}
            aria-hidden
          />
          <div
            ref={guideSheetRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label="Guide"
            className="relative flex h-full w-full animate-sheet-up flex-col p-3 focus:outline-none sm:max-w-md sm:animate-rail-in sm:p-0"
          >
            <GuidePanel
              {...guideProps}
              variant="rail"
              onClose={() => setGuideOpen(false)}
            />
          </div>
        </div>
      )}

      {openProject && (
        <ProjectDetailDrawer project={openProject} onClose={handleCloseProject} />
      )}

      {showSpec && <SpecDialog onClose={() => setShowSpec(false)} />}
      {showFit && (
        <FitDialog onClose={() => setShowFit(false)} onAnalyze={onAnalyzeFit} />
      )}
      <Playground open={playgroundOpen} onClose={() => setPlaygroundOpen(false)} />
    </>
  );
}
