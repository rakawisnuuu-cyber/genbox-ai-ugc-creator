import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { validateBackendConfig } from "./lib/backendConfig";

validateBackendConfig();

createRoot(document.getElementById("root")!).render(<App />);
