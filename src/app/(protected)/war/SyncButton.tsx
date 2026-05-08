"use client";

import { useState } from "react";
import { RefreshCw, CheckCircle, AlertTriangle } from "lucide-react";

export default function SyncButton() {
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSync() {
    setState("loading");
    setMessage("");
    try {
      const res = await fetch("/api/war/snapshot", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setState("success");
        setMessage(data.message);
      } else {
        setState("error");
        setMessage(data.error ?? "Sync failed");
      }
    } catch {
      setState("error");
      setMessage("Network error");
    }
    setTimeout(() => setState("idle"), 5000);
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleSync}
        disabled={state === "loading"}
        className="flex items-center gap-2 px-4 py-2 rounded-lg card-base border-navy-500 font-heading text-xs tracking-wider text-text-secondary hover:text-text-primary hover:border-gold-700/40 transition-all disabled:opacity-50"
      >
        <RefreshCw size={13} className={state === "loading" ? "animate-spin text-gold-400" : ""} />
        {state === "loading" ? "Syncing..." : "Sync History"}
      </button>
      {state === "success" && (
        <span className="flex items-center gap-1.5 text-xs font-body text-green-clash animate-fade-in">
          <CheckCircle size={13} /> {message}
        </span>
      )}
      {state === "error" && (
        <span className="flex items-center gap-1.5 text-xs font-body text-red-clash animate-fade-in">
          <AlertTriangle size={13} /> {message}
        </span>
      )}
    </div>
  );
}
