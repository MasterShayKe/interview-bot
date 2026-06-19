import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.js";
import { useRoute } from "./lib/router.js";
import "./index.css";

// Lazy-load the portal so Three.js is only fetched when the route is visited —
// the chat page stays lightweight.
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

function Root() {
  const path = useRoute();
  if (path === "/portal") {
    return (
      <Suspense fallback={<PortalFallback />}>
        <Portal />
      </Suspense>
    );
  }
  return <App />;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);
