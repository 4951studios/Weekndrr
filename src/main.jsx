import React from "react";
import ReactDOM from "react-dom/client";
import App from "@/App";
import { initNativeShell } from "@/lib/native";
import "@/index.css";

initNativeShell();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
