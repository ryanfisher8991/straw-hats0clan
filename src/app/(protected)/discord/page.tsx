"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Bot, CheckCircle2, XCircle, Zap, RefreshCw, Copy, Check,
  ExternalLink, AlertTriangle, Trophy, Star, UserPlus, Bell,
  Shield, Flame, Crown, Hash, ChevronDown, ChevronUp, ToggleLeft, ToggleRight,
} from "lucide-react";

interface BotStatus {
  webhookConfigured: boolean;
  botConfigured: boolean;
  appId: string | null;
}

type SetupState = "idle" | "success" | "error" | "cancelled";

interface ChannelConfig {
  feature: string;
  webhook_url: string;
  enabled: boolean;
}

const FEATURES = [
  {
    key: "reminders",
    label: "Battle Reminders",
    icon: Bell,
    color: "#f8d978",
    trigger: "Fires automatically 3× per day (12:00, 18:00, 23:00 UTC) during war day",
    description: "Pings members who haven't used all 4 war decks yet. Shows a progress bar for each person still needing to battle. Skips silently if it's not war day or everyone is done.",
    example: "⚔️ 3 members still need to battle\n🟩🟩⬛⬛ PlayerOne — 2 battles left\n⬛⬛⬛⬛ PlayerTwo — 4 battles left",
  },
  {
    key: "war_results",
    label: "War Results",
    icon: Trophy,
    color: "#f8d978",
    trigger: "Posts when a war snapshot is saved (after each war ends)",
    description: "Announces the top 3 performers by fame with 🥇🥈🥉 medals, total clan fame earned, and how many battles were missed across the whole clan. Great for celebrating strong wars.",
    example: "🏆 War Results — Season 132 Week 3\n🥇 PlayerOne — 3,200 fame\n🥈 PlayerTwo — 2,800 fame\n🥉 PlayerThree — 2,400 fame\nClan total: 48,200 fame · 6 battles missed",
  },
  {
    key: "promotions",
    label: "Rank Promotions",
    icon: Star,
    color: "#a78bfa",
    trigger: "Posts whenever a member crosses a fame tier",
    description: "Tracks each member's lifetime fame (baseline + all completed wars). When someone crosses a tier — Copper → Silver → Gold → Diamond → Special Grade → Hashira — it posts a promotion announcement. Each promotion is only announced once.",
    example: "⭐ Rank Up! PlayerOne reached Gold rank\n7,100+ lifetime fame · Keep it up!",
  },
  {
    key: "welcome",
    label: "New Member Welcome",
    icon: UserPlus,
    color: "#34d399",
    trigger: "Posts when a new member is detected in the clan",
    description: "Checks the current member list twice a week. If someone new is in the clan who wasn't there before, it posts a welcome message to this channel. Good for making new recruits feel part of the community.",
    example: "👋 Welcome to Straw Hats, NewPlayer!\nYou've joined a crew of 49 pirates. First war battle is on you 🏴‍☠️",
  },
  {
    key: "perfect_war",
    label: "Perfect War Alert",
    icon: Crown,
    color: "#fbbf24",
    trigger: "Posts after a war where every member used all 4 decks",
    description: "A special one-off announcement when the clan achieves a perfect war — zero missed battles. Rare enough that it's worth celebrating loudly.",
    example: "🔥 PERFECT WAR! Every member used all 4 decks\n50/50 battles played · Clan fame: 52,000",
  },
  {
    key: "missed_battles",
    label: "Missed Battles Report",
    icon: Shield,
    color: "#f87171",
    trigger: "Posts after each war ends listing who missed battles",
    description: "After a war snapshot is saved, posts a list of anyone who missed 1 or more battles. Useful for accountability — leaders can see at a glance who to follow up with.",
    example: "⚠️ Missed Battles — Season 132 Week 3\nPlayerOne — missed 2 battles\nPlayerTwo — missed 4 battles (sat out)",
  },
  {
    key: "leaderboard",
    label: "Weekly Leaderboard",
    icon: Flame,
    color: "#fb923c",
    trigger: "Posts every Monday at 9:00 AM UTC",
    description: "Weekly fame leaderboard showing the top 5 members by lifetime fame. Keeps the competitive spirit alive and gives members something to chase between wars.",
    example: "📊 Weekly Fame Leaderboard\n1. PlayerOne — 12,400 fame (Diamond)\n2. PlayerTwo — 9,800 fame (Gold)\n3. PlayerThree — 7,200 fame (Gold)",
  },
];

function buildInviteUrl(appId: string, appUrl: string): string {
  const permissions = 19456;
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
  const [channels, setChannels]       = useState<Record<string, ChannelConfig>>({});
  const [saving, setSaving]           = useState<string | null>(null);
  const [expanded, setExpanded]       = useState<string | null>("reminders");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const setup = params.get("setup") as SetupState | null;
    if (setup) {
      setSetupState(setup);
      setSetupMsg(params.get("reason") ?? "");
      setWebhook(params.get("webhook") ?? "");
      setChannel(params.get("channel") ?? "");
      window.history.replaceState({}, "", "/discord");
    }
  }, []);

  const loadStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/discord/status");
      setStatus(await res.json());
    } catch { setStatus(null); }
  }, []);

  const loadChannels = useCallback(async () => {
    try {
      const res = await fetch("/api/discord/channels");
      const data: ChannelConfig[] = await res.json();
      const map: Record<string, ChannelConfig> = {};
      for (const c of data) map[c.feature] = c;
      setChannels(map);
    } catch { /* table may not exist yet */ }
  }, []);

  useEffect(() => { loadStatus(); loadChannels(); }, [loadStatus, loadChannels]);

  const saveChannel = async (feature: string, webhook_url: string, enabled: boolean) => {
    setSaving(feature);
    try {
      await fetch("/api/discord/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feature, webhook_url, enabled }),
      });
      setChannels(prev => ({ ...prev, [feature]: { feature, webhook_url, enabled } }));
    } finally { setSaving(null); }
  };

  const toggleEnabled = (feature: string) => {
    const cfg = channels[feature];
    if (!cfg) return;
    saveChannel(feature, cfg.webhook_url, !cfg.enabled);
  };

  const sendTestReminder = async () => {
    setTestLoading(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/discord/remind", { method: "POST" });
      const data = await res.json();
      if (data.skipped)      setTestResult(`Skipped — ${data.reason}`);
      else if (data.allDone) setTestResult("Sent! All members done.");
      else                   setTestResult(`Sent! ${data.needBattle} member(s) still need to battle.`);
    } catch (err) { setTestResult(`Error: ${String(err)}`); }
    finally { setTestLoading(false); }
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
          Connect your clan website to Discord — automatic announcements, reminders, and leaderboards
        </p>
      </div>

      {/* OAuth callback banners */}
      {setupState === "success" && (
        <div className="mb-6 rounded-xl p-4 border animate-fade-up"
          style={{ opacity: 0, background: "rgba(57,255,20,0.06)", borderColor: "rgba(57,255,20,0.25)" }}>
          <div className="flex items-start gap-3">
            <CheckCircle2 size={18} className="text-green-clash mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-heading text-sm text-green-clash">Bot added successfully!</p>
              <p className="font-body text-xs text-text-muted mt-0.5">
                Webhook created in <span className="text-text-primary font-medium">#{channel}</span>. Paste this URL into any feature below.
              </p>
              {webhook && (
                <div className="mt-2 flex items-center gap-2">
                  <code className="flex-1 text-[0.65rem] text-text-muted bg-navy-900 rounded px-2 py-1 truncate border border-navy-600">
                    {webhook}
                  </code>
                  <button onClick={copyWebhook}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-heading text-xs transition-colors"
                    style={{ background: "rgba(248,215,120,0.12)", color: "#f8d978" }}>
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
        <div className="mb-6 rounded-xl p-4 border"
          style={{ background: "rgba(239,68,68,0.06)", borderColor: "rgba(239,68,68,0.25)" }}>
          <div className="flex items-start gap-3">
            <XCircle size={18} className="text-red-clash mt-0.5 shrink-0" />
            <div>
              <p className="font-heading text-sm text-red-clash">Setup failed</p>
              <p className="font-body text-xs text-text-muted mt-0.5">{setupMsg || "Check that all env vars are set."}</p>
            </div>
          </div>
        </div>
      )}

      {setupState === "cancelled" && (
        <div className="mb-6 rounded-xl p-4 border"
          style={{ background: "rgba(251,191,36,0.06)", borderColor: "rgba(251,191,36,0.2)" }}>
          <div className="flex items-center gap-3">
            <AlertTriangle size={16} className="text-gold-400 shrink-0" />
            <p className="font-body text-sm text-text-muted">Authorization cancelled — no changes made.</p>
          </div>
        </div>
      )}

      {/* Status + Install row */}
      <div className="grid grid-cols-2 gap-3 mb-4 animate-fade-up" style={{ opacity: 0, animationDelay: "0.1s" }}>
        <StatusCard label="Bot credentials" ok={status?.botConfigured ?? false} okText="Configured" failText="Missing env vars" />
        <StatusCard label="Reminder webhook" ok={status?.webhookConfigured ?? false} okText="Connected" failText="Not set" />
      </div>

      {/* Add to Discord */}
      <div className="card-base p-5 mb-4 animate-fade-up" style={{ opacity: 0, animationDelay: "0.13s" }}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="font-display text-base text-text-primary mb-0.5">Add Bot to Your Server</h2>
            <p className="font-body text-xs text-text-muted">Authorize once — the bot auto-creates a webhook you can use below</p>
          </div>
          {!status?.appId ? (
            <div className="text-xs font-body" style={{ color: "#fbbf24" }}>
              <AlertTriangle size={12} className="inline mr-1" />
              DISCORD_APPLICATION_ID not set
            </div>
          ) : (
            <a href={inviteUrl!}
              className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-lg font-heading text-xs tracking-wide transition-all"
              style={{ background: "linear-gradient(135deg, #5865F2, #4752c4)", color: "#fff", boxShadow: "0 4px 16px rgba(88,101,242,0.3)" }}>
              <svg width="16" height="16" viewBox="0 0 127.14 96.36" fill="white">
                <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"/>
              </svg>
              Add to Discord
              <ExternalLink size={11} />
            </a>
          )}
        </div>
      </div>

      {/* Features */}
      <div className="mb-2 animate-fade-up" style={{ opacity: 0, animationDelay: "0.18s" }}>
        <h2 className="font-display text-lg text-text-primary mb-1">Features & Channels</h2>
        <p className="font-body text-xs text-text-muted mb-4">
          Each feature posts to its own Discord channel. Create a webhook in Discord (channel settings → Integrations → Webhooks) and paste the URL below.
        </p>

        <div className="space-y-2">
          {FEATURES.map(({ key, label, icon: Icon, color, trigger, description, example }) => {
            const cfg = channels[key];
            const isExpanded = expanded === key;
            const isEnabled = cfg?.enabled ?? false;
            const hasWebhook = !!cfg?.webhook_url;

            return (
              <div key={key} className="rounded-xl border overflow-hidden"
                style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>

                {/* Row header */}
                <button
                  onClick={() => setExpanded(isExpanded ? null : key)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.02]"
                >
                  <div className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
                    <Icon size={13} style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-heading text-sm text-text-primary">{label}</p>
                    <p className="font-body text-[0.65rem] text-text-muted truncate">{trigger}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {hasWebhook ? (
                      <span className="font-heading text-[0.6rem] tracking-wide px-1.5 py-0.5 rounded"
                        style={{ background: isEnabled ? "rgba(57,255,20,0.1)" : "rgba(255,255,255,0.05)", color: isEnabled ? "#39ff14" : "#666" }}>
                        {isEnabled ? "ON" : "OFF"}
                      </span>
                    ) : (
                      <span className="font-heading text-[0.6rem] tracking-wide text-text-muted">not set</span>
                    )}
                    {isExpanded ? <ChevronUp size={13} className="text-text-muted" /> : <ChevronDown size={13} className="text-text-muted" />}
                  </div>
                </button>

                {/* Expanded panel */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                    <p className="font-body text-xs text-text-muted mt-3 mb-3 leading-relaxed">{description}</p>

                    {/* Example preview */}
                    <div className="rounded-lg p-3 mb-4 font-mono text-[0.65rem] text-text-muted whitespace-pre leading-relaxed"
                      style={{ background: "rgba(88,101,242,0.06)", border: "1px solid rgba(88,101,242,0.15)" }}>
                      {example}
                    </div>

                    {/* Webhook input */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 shrink-0 text-text-muted">
                        <Hash size={12} />
                        <span className="font-heading text-[0.65rem]">Webhook URL</span>
                      </div>
                      <input
                        type="text"
                        placeholder="https://discord.com/api/webhooks/..."
                        defaultValue={cfg?.webhook_url ?? ""}
                        onBlur={(e) => {
                          const url = e.target.value.trim();
                          if (url !== (cfg?.webhook_url ?? "")) {
                            saveChannel(key, url, cfg?.enabled ?? true);
                          }
                        }}
                        className="flex-1 bg-navy-900 border border-navy-600 rounded-lg px-3 py-1.5 font-body text-xs text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-navy-400 transition-colors"
                      />
                      {hasWebhook && (
                        <button
                          onClick={() => toggleEnabled(key)}
                          disabled={saving === key}
                          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-heading text-xs transition-all disabled:opacity-50"
                          style={{
                            background: isEnabled ? "rgba(57,255,20,0.08)" : "rgba(255,255,255,0.04)",
                            color: isEnabled ? "#39ff14" : "#666",
                            border: `1px solid ${isEnabled ? "rgba(57,255,20,0.2)" : "rgba(255,255,255,0.08)"}`,
                          }}
                        >
                          {saving === key ? <RefreshCw size={10} className="animate-spin" /> : isEnabled ? <ToggleRight size={12} /> : <ToggleLeft size={12} />}
                          {isEnabled ? "Enabled" : "Disabled"}
                        </button>
                      )}
                    </div>

                    {/* Test button for reminders */}
                    {key === "reminders" && (
                      <div className="flex items-center gap-3 mt-3 flex-wrap">
                        <button
                          onClick={sendTestReminder}
                          disabled={testLoading || !status?.webhookConfigured}
                          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg font-heading text-xs tracking-wide transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                          style={{ background: "rgba(248,215,120,0.1)", color: "#f8d978", border: "1px solid rgba(248,215,120,0.2)" }}
                        >
                          {testLoading ? <RefreshCw size={11} className="animate-spin" /> : <Zap size={11} />}
                          {testLoading ? "Sending…" : "Send Test"}
                        </button>
                        {testResult && <p className="font-body text-xs text-text-muted">{testResult}</p>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Slash commands */}
      <div className="card-base p-5 mt-4 animate-fade-up" style={{ opacity: 0, animationDelay: "0.25s" }}>
        <h2 className="font-display text-base text-text-primary mb-3">Slash Commands</h2>
        <div className="space-y-2">
          {[
            { cmd: "/warcheck",  desc: "Shows who still needs to battle today, with a progress bar per member" },
            { cmd: "/warremind", desc: "Manually fires a reminder to the reminders channel right now" },
          ].map(({ cmd, desc }) => (
            <div key={cmd} className="flex items-start gap-3">
              <code className="shrink-0 font-heading text-xs px-2 py-0.5 rounded mt-0.5"
                style={{ background: "rgba(88,101,242,0.12)", color: "#818cf8", border: "1px solid rgba(88,101,242,0.2)" }}>
                {cmd}
              </code>
              <span className="font-body text-xs text-text-muted">{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatusCard({ label, ok, okText, failText }: {
  label: string; ok: boolean; okText: string; failText: string;
}) {
  return (
    <div className="rounded-xl p-4 border"
      style={{
        background: ok ? "rgba(57,255,20,0.04)" : "rgba(239,68,68,0.04)",
        borderColor: ok ? "rgba(57,255,20,0.2)" : "rgba(239,68,68,0.15)",
      }}>
      <div className="flex items-center gap-2 mb-1">
        {ok ? <CheckCircle2 size={14} className="text-green-clash" /> : <XCircle size={14} className="text-red-clash" />}
        <span className={`font-heading text-xs ${ok ? "text-green-clash" : "text-red-clash"}`}>
          {ok ? okText : failText}
        </span>
      </div>
      <p className="font-body text-[0.7rem] text-text-muted">{label}</p>
    </div>
  );
}
