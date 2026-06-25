"use client";

import { useEffect, useState, useCallback } from "react";
import { Bot, CheckCircle2, XCircle, Zap, RefreshCw, Copy, Check, ExternalLink, AlertTriangle } from "lucide-react";

interface BotStatus {
  webhookConfigured: boolean;
  botConfigured: boolean;
  appId: string | null;
}

type SetupState = "idle" | "success" | "error" | "cancelled";

// Discord invite URL: bot + slash commands, minimal permissions
function buildInviteUrl(appId: string, appUrl: string): string {
  const permissions = 19456; // View Channels + Send Messages + Embed Links
  const redirectUri = encodeURIComponent(`${appUrl}/api/discord/callback`);
  return (
    `https://discord.com/api/oauth2/authorize` +
    `?client_id=${appId}` +
    `&permissions=${permissions}` +
    `&scope=bot%20applications.commands` +
    `&redirect_uri=${redirectUri}` +
    `&response_type=code`
  );
}

export default function DiscordSetupPage() {
  const [status, setStatus]           = useState<BotStatus | null>(null);
  const [setupState, setSetupState]   = useState<SetupState>("idle");
  const [setupMsg, setSetupMsg]       = useState("");
  const [webhook, setWebhook]         = useState("");
  const [channel, setChannel]         = useState("");
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult]   = useState<string | null>(null);
  const [copied, setCopied]           = useState(false);

  // Read query params from OAuth2 callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const setup = params.get("setup") as SetupState | null;
    if (setup) {
      setSetupState(setup);
      setSetupMsg(params.get("reason") ?? "");
      setWebhook(params.get("webhook") ?? "");
      setChannel(params.get("channel") ?? "");
      // Clean the URL
      window.history.replaceState({}, "", "/discord");
    }
  }, []);

  const loadStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/discord/status");
      setStatus(await res.json());
    } catch {
      setStatus(null);
    }
  }, []);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  const sendTestReminder = async () => {
    setTestLoading(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/discord/remind", { method: "POST" });
      const data = await res.json();
      if (data.skipped)    setTestResult(`Skipped — ${data.reason}`);
      else if (data.allDone) setTestResult("Sent! All members have finished their battles.");
      else setTestResult(`Sent! ${data.needBattle} member(s) still need to battle.`);
    } catch (err) {
      setTestResult(`Error: ${String(err)}`);
    } finally {
      setTestLoading(false);
    }
  };

  const copyWebhook = async () => {
    await navigator.clipboard.writeText(webhook);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const appUrl = typeof window !== "undefined" ? window.location.origin : "";
  const inviteUrl = status?.appId ? buildInviteUrl(status.appId, appUrl) : null;

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto w-full">
      {/* Header */}
      <div className="mb-8 animate-fade-up" style={{ opacity: 0, animationDelay: "0.05s" }}>
        <div className="flex items-center gap-3 mb-1">
          <Bot size={22} className="text-gold-400" strokeWidth={1.5} />
          <h1 className="font-display text-2xl sm:text-3xl text-gold-gradient">Discord Bot</h1>
        </div>
        <p className="text-text-muted text-sm font-body">
          Automatic war battle reminders sent straight to your Discord server
        </p>
      </div>

      {/* OAuth callback result banner */}
      {setupState === "success" && (
        <div
          className="mb-6 rounded-xl p-4 border animate-fade-up"
          style={{ opacity: 0, background: "rgba(57,255,20,0.06)", borderColor: "rgba(57,255,20,0.25)" }}
        >
          <div className="flex items-start gap-3">
            <CheckCircle2 size={18} className="text-green-clash mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-heading text-sm text-green-clash">Bot added successfully!</p>
              <p className="font-body text-xs text-text-muted mt-0.5">
                A webhook was created in <span className="text-text-primary font-medium">#{channel}</span>. Copy it below and add it to your Vercel env vars as <code className="text-gold-400">DISCORD_WEBHOOK_URL</code>.
              </p>
              {webhook && (
                <div className="mt-2 flex items-center gap-2">
                  <code className="flex-1 text-[0.65rem] text-text-muted bg-navy-900 rounded px-2 py-1 truncate border border-navy-600">
                    {webhook}
                  </code>
                  <button
                    onClick={copyWebhook}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-heading text-xs transition-colors"
                    style={{ background: "rgba(248,215,120,0.12)", color: "#f8d978" }}
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {setupState === "error" && (
        <div
          className="mb-6 rounded-xl p-4 border animate-fade-up"
          style={{ opacity: 0, background: "rgba(239,68,68,0.06)", borderColor: "rgba(239,68,68,0.25)" }}
        >
          <div className="flex items-start gap-3">
            <XCircle size={18} className="text-red-clash mt-0.5 shrink-0" />
            <div>
              <p className="font-heading text-sm text-red-clash">Setup failed</p>
              <p className="font-body text-xs text-text-muted mt-0.5">{setupMsg || "Something went wrong. Check that all env vars are set and try again."}</p>
            </div>
          </div>
        </div>
      )}

      {setupState === "cancelled" && (
        <div
          className="mb-6 rounded-xl p-4 border"
          style={{ background: "rgba(251,191,36,0.06)", borderColor: "rgba(251,191,36,0.2)" }}
        >
          <div className="flex items-center gap-3">
            <AlertTriangle size={16} className="text-gold-400 shrink-0" />
            <p className="font-body text-sm text-text-muted">Authorization cancelled — no changes were made.</p>
          </div>
        </div>
      )}

      {/* Status cards */}
      <div className="grid grid-cols-2 gap-3 mb-6 animate-fade-up" style={{ opacity: 0, animationDelay: "0.1s" }}>
        <StatusCard
          label="Bot credentials"
          ok={status?.botConfigured ?? false}
          okText="Configured"
          failText="Missing env vars"
        />
        <StatusCard
          label="Reminder webhook"
          ok={status?.webhookConfigured ?? false}
          okText="Connected"
          failText="Not set"
        />
      </div>

      {/* Add to Discord */}
      <div
        className="card-base p-6 mb-4 animate-fade-up"
        style={{ opacity: 0, animationDelay: "0.15s" }}
      >
        <h2 className="font-display text-lg text-text-primary mb-1">Add Bot to Your Server</h2>
        <p className="font-body text-sm text-text-muted mb-5">
          Click the button to open Discord's authorization page. Select your clan server, authorize, and the bot will
          automatically create a webhook in the best available channel.
        </p>

        {!status?.appId ? (
          <div
            className="rounded-lg px-4 py-3 text-sm font-body border"
            style={{ background: "rgba(251,191,36,0.06)", borderColor: "rgba(251,191,36,0.2)", color: "#fbbf24" }}
          >
            <AlertTriangle size={14} className="inline mr-1.5 mb-0.5" />
            <code className="text-xs">DISCORD_APPLICATION_ID</code> is not set. Add it to Vercel environment variables first.
          </div>
        ) : (
          <a
            href={inviteUrl!}
            className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl font-heading text-sm tracking-wide transition-all"
            style={{
              background: "linear-gradient(135deg, #5865F2, #4752c4)",
              color: "#fff",
              boxShadow: "0 4px 20px rgba(88,101,242,0.35)",
            }}
          >
            {/* Discord logo */}
            <svg width="20" height="20" viewBox="0 0 127.14 96.36" fill="white">
              <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"/>
            </svg>
            Add to Discord
            <ExternalLink size={14} strokeWidth={2} />
          </a>
        )}
      </div>

      {/* Test reminder */}
      <div
        className="card-base p-6 mb-4 animate-fade-up"
        style={{ opacity: 0, animationDelay: "0.2s" }}
      >
        <h2 className="font-display text-lg text-text-primary mb-1">Test Reminder</h2>
        <p className="font-body text-sm text-text-muted mb-5">
          Manually fire a war reminder right now. Only works during active war day — if it's not war day, it'll tell you without posting anything.
        </p>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={sendTestReminder}
            disabled={testLoading || !status?.webhookConfigured}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-heading text-sm tracking-wide transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: "rgba(248,215,120,0.12)",
              color: "#f8d978",
              border: "1px solid rgba(248,215,120,0.25)",
            }}
          >
            {testLoading ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <Zap size={14} />
            )}
            {testLoading ? "Sending…" : "Send Test Reminder"}
          </button>
          {testResult && (
            <p className="font-body text-sm text-text-muted">{testResult}</p>
          )}
        </div>
        {!status?.webhookConfigured && (
          <p className="mt-3 font-body text-xs" style={{ color: "rgba(251,191,36,0.7)" }}>
            Add <code>DISCORD_WEBHOOK_URL</code> to your Vercel environment variables first.
          </p>
        )}
      </div>

      {/* How it works */}
      <div
        className="card-base p-6 animate-fade-up"
        style={{ opacity: 0, animationDelay: "0.25s" }}
      >
        <h2 className="font-display text-lg text-text-primary mb-4">How It Works</h2>
        <ol className="space-y-3">
          {[
            { step: "1", text: "Click «Add to Discord» and select your clan server" },
            { step: "2", text: "Bot automatically creates a webhook in the best available channel" },
            { step: "3", text: "Copy the webhook URL and save it as DISCORD_WEBHOOK_URL in Vercel" },
            { step: "4", text: "Reminders fire automatically at 12:00, 18:00, and 23:00 UTC every day" },
            { step: "5", text: "Only sends a message when it's war day and someone still has battles left" },
          ].map(({ step, text }) => (
            <li key={step} className="flex items-start gap-3">
              <span
                className="shrink-0 w-6 h-6 rounded-full font-heading text-xs flex items-center justify-center mt-0.5"
                style={{ background: "rgba(248,215,120,0.12)", color: "#f8d978", border: "1px solid rgba(248,215,120,0.2)" }}
              >
                {step}
              </span>
              <span className="font-body text-sm text-text-muted">{text}</span>
            </li>
          ))}
        </ol>

        <div className="mt-5 pt-5 border-t border-navy-600/40">
          <p className="font-heading text-[0.6rem] tracking-widest text-text-muted uppercase mb-2">Slash Commands</p>
          <div className="space-y-1.5">
            {[
              { cmd: "/warcheck",  desc: "Show who still needs to battle" },
              { cmd: "/warremind", desc: "Manually post a reminder to the channel" },
            ].map(({ cmd, desc }) => (
              <div key={cmd} className="flex items-center gap-3">
                <code
                  className="font-heading text-xs px-2 py-0.5 rounded"
                  style={{ background: "rgba(88,101,242,0.12)", color: "#818cf8", border: "1px solid rgba(88,101,242,0.2)" }}
                >
                  {cmd}
                </code>
                <span className="font-body text-xs text-text-muted">{desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusCard({ label, ok, okText, failText }: {
  label: string; ok: boolean; okText: string; failText: string;
}) {
  return (
    <div
      className="rounded-xl p-4 border"
      style={{
        background: ok ? "rgba(57,255,20,0.04)" : "rgba(239,68,68,0.04)",
        borderColor: ok ? "rgba(57,255,20,0.2)" : "rgba(239,68,68,0.15)",
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        {ok
          ? <CheckCircle2 size={14} className="text-green-clash" />
          : <XCircle size={14} className="text-red-clash" />
        }
        <span className={`font-heading text-xs ${ok ? "text-green-clash" : "text-red-clash"}`}>
          {ok ? okText : failText}
        </span>
      </div>
      <p className="font-body text-[0.7rem] text-text-muted">{label}</p>
    </div>
  );
}
