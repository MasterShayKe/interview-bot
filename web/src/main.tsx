import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.js";
import { initGA } from "./lib/ga.js";
import "./index.css";

initGA();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
