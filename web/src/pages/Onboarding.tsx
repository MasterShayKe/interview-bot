import { useEffect, useState } from "react";
import { fetchMe, type MeResponse } from "../lib/api.js";
import { navigate } from "../lib/router.js";

// Phase 1 stub for the onboarding flow. Phase 2 replaces this with a guided
// chat that interviews the user and proposes knowledge items. For now it
// welcomes the new user and sends them to the editor to add knowledge.
export default function Onboarding() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [checked, setChecked] = useState(false);

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

  if (!checked || !me) return null;

  const steps = [
    "Add your roles and experience",
    "Add your project highlights",
    "Pick a handle and publish",
    "Share your link with recruiters",
  ];

  return (
    <>
      <div className="bg-atmosphere" aria-hidden />
      <div className="bg-grid" aria-hidden />
      <div className="bg-grain" aria-hidden />
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center px-5 sm:px-8">
        <div className="font-mono text-[0.72rem] uppercase tracking-[0.26em] text-accent/90">
          Welcome{me.user.name ? `, ${me.user.name.split(" ")[0]}` : ""}
        </div>
        <h1 className="mt-4 font-display text-4xl leading-tight text-white sm:text-5xl">
          Let's build your interview agent.
        </h1>
        <p className="mt-5 max-w-md text-[0.98rem] leading-relaxed text-white/55">
          Your agent only knows what you tell it. In the editor you'll add your
          experience and projects, then publish a shareable link. A guided
          interview to do this by chat is coming soon.
        </p>

        <ol className="mt-8 space-y-3">
          {steps.map((s, i) => (
            <li key={i} className="flex items-center gap-3 text-sm text-white/70">
              <span className="flex h-6 w-6 items-center justify-center rounded-full border border-accent/30 bg-accent/[0.06] font-mono text-[0.7rem] text-accent">
                {i + 1}
              </span>
              {s}
            </li>
          ))}
        </ol>

        <button
          onClick={() => navigate("/dashboard")}
          className="mt-9 self-start rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-ink transition-all hover:shadow-[0_0_28px_-6px] hover:shadow-accent"
        >
          Open the editor →
        </button>
      </div>
    </>
  );
}
