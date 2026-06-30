import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.js";
import Landing from "./pages/Landing.js";
import Dashboard from "./pages/Dashboard.js";
import Onboarding from "./pages/Onboarding.js";
import { useRoute } from "./lib/router.js";
import "./index.css";

// Lazy-load the portal so Three.js is only fetched when the route is visited.
const Portal = lazy(() => import("./portal/Portal.js"));

function PortalFallback() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-ink">
      <span className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-accent/70">
        Initializing portal…
      </span>
    </div>
  );
}

const PORTAL_RE = /^\/u\/([a-z0-9-]+)\/portal\/?$/;
const BOT_RE = /^\/u\/([a-z0-9-]+)\/?$/;

function Root() {
  const path = useRoute();

  const portalMatch = path.match(PORTAL_RE);
  if (portalMatch) {
    return (
      <Suspense fallback={<PortalFallback />}>
        <Portal handle={portalMatch[1]} />
      </Suspense>
    );
  }

  const botMatch = path.match(BOT_RE);
  if (botMatch) return <App handle={botMatch[1]} />;

  if (path === "/dashboard") return <Dashboard />;
  if (path === "/onboarding") return <Onboarding />;
  if (path === "/login") return <Landing />;
  return <Landing />;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);
