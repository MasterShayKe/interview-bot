import { useEffect } from "react";
import Nav from "./sections/Nav.js";
import Hero from "./sections/Hero.js";
import Impact from "./sections/Impact.js";
import Overview from "./sections/Overview.js";
import CaseStudies from "./sections/CaseStudies.js";
import Leadership from "./sections/Leadership.js";
import Timeline from "./sections/Timeline.js";
import AIWork from "./sections/AIWork.js";
import Skills from "./sections/Skills.js";
import Interview from "./sections/Interview.js";
import Contact from "./sections/Contact.js";
import SiteFooter from "./sections/SiteFooter.js";
import { track } from "./lib/analytics.js";

export default function App() {
  useEffect(() => {
    track("page_view", { path: "/" });
  }, []);

  return (
    <>
      <div className="bg-field" aria-hidden />
      <a
        href="#interview"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-ink"
      >
        Skip to interview
      </a>
      <Nav />
      <main id="main">
        <Hero />
        <Impact />
        <Overview />
        <CaseStudies />
        <Leadership />
        <Timeline />
        <AIWork />
        <Skills />
        <Interview />
        <Contact />
      </main>
      <SiteFooter />
    </>
  );
}
