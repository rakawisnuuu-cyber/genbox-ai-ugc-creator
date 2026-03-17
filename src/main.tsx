import React from "react";
import ReactDOM from "react-dom/client";
import * as Sentry from "@sentry/react";
import App from "./App";
import "./index.css";

Sentry.init({
  dsn: "https://b9edb72e990ddeb549bc586d6382f189@o4511057950801920.ingest.us.sentry.io/4511057962270720",
  environment: import.meta.env.MODE,
  enabled: import.meta.env.PROD,
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
