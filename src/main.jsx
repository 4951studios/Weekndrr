import React from "react";
import ReactDOM from "react-dom/client";
import App from "@/App";
import { initAdMob, initNativeShell } from "@/lib/native";
import "@/index.css";

initNativeShell();
initAdMob();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
