"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Bot, CheckCircle2, XCircle, ExternalLink, AlertTriangle,
  Copy, Check, ChevronDown, ChevronUp, ToggleLeft, ToggleRight,
  RefreshCw, Zap, Lock, Eye, EyeOff, Hash,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface BotStatus { webhookConfigured: boolean; botConfigured: boolean; appId: string | null; }
type SetupState = "idle" | "success" | "error" | "cancelled";
interface ChannelConfig { feature: string; webhook_url: string; enabled: boolean; }

// ── Feature definitions ───────────────────────────────────────────────────────

const CATEGORIES = [
  {
    id: "war",
    label: "⚔️ War",
    features: [
      {
        key: "reminders",
        label: "Battle Reminders",
        trigger: "Auto 3× daily (12:00, 18:00, 23:00 UTC) during war day only",
        description: "Checks who hasn't used all 4 war decks and posts a progress bar for each. Skips silently if it's not war day or everyone is done. 30 rotating One Piece character quotes keep it fresh.",
        example: "⚔️ War Battle Reminder\n*Even Usopp would've battled by now. Get in there.*\n🟩🟩⬛⬛ PlayerOne — 2/4 done\n⬛⬛⬛⬛ PlayerTwo — 0/4 done\n✅ 12 pirates already fought today.",
        slash: "/warremind",
        testable: true,
      },
      {
        key: "kickoff",
        label: "War Day Kickoff",
        trigger: "Fires when war day starts (cron checks hourly)",
        description: "Posts a hype message when war day begins, showing how many of your members are registered and who you're fighting. Scouts the opponent's current fame so you know what you're up against.",
        example: "⚔️ War Day Has Started!\n*Zoro found the arena. Somehow. Let's go.*\n🏴‍☠️ Enemy Crew: LegendClan\n⚔️ Their Fame: 14,200\n🗡️ 4 battles available per pirate",
        slash: "/warday",
      },
      {
        key: "hourly",
        label: "Hourly War Progress",
        trigger: "Every hour during war day — skips if everyone is done",
        description: "A quiet progress bar update showing what percentage of the clan has finished their battles. No pinging, just a status post. Helps members see if the crew is on track without being nagged.",
        example: "📡 War Progress Update\n█████████░ 90% complete\n22/24 pirates done · 8 battles remaining",
        slash: null,
      },
      {
        key: "pre_war",
        label: "Pre-War Checklist",
        trigger: "When training phase has ≤4 hours left",
        description: "Posts a reminder to prepare decks before war day starts. Fires automatically when the training window is closing. Includes a simple checklist: lock your deck, charge your device, plan your battles.",
        example: "📋 War Starts Soon — Prepare Your Decks!\nTraining phase ends in ~3 hours.\n✅ Check your deck is set\n✅ Charge your device\n✅ Plan your 4 battles",
        slash: null,
      },
      {
        key: "war_results",
        label: "War Results",
        trigger: "After each war snapshot is saved (Mon & Fri at noon UTC)",
        description: "Announces top 3 performers by fame with 🥇🥈🥉 medals, total clan fame, and battles missed. Fires once per war when the snapshot cron picks up a new completed race.",
        example: "⚔️ War Results — Season 132 Week 3\n🥇 PlayerOne — 3,200 fame\n🥈 PlayerTwo — 2,800 fame\n🥉 PlayerThree — 2,400 fame\n🏴‍☠️ Crew Fame: 48,200 · 💀 Missed: 6",
        slash: null,
      },
      {
        key: "perfect_war",
        label: "Perfect War Alert",
        trigger: "Fires after war results if zero battles were missed",
        description: "Special announcement when every member uses all 4 decks. Rare enough that it deserves its own loud message. Goes to whichever channel this webhook points to.",
        example: "🔥 GOMU GOMU NO PERFECT WAR!!\nEvery Straw Hat used all 4 decks.\n50/50 pirates fought · 52,000 total fame",
        slash: null,
      },
      {
        key: "missed_battles",
        label: "Missed Battles Report",
        trigger: "After war results — only if someone missed battles",
        description: "Lists who missed 1 or more battles after each war ends. Keeps accountability visible without making it personal. Point it at a #leadership or #war-recap channel.",
        example: "⚠️ Pirates Who Didn't Fight\nPlayerOne — sat out 2 battles\nPlayerTwo — sat out 4 battles\n*Zoro got lost again is not an excuse.*",
        slash: null,
      },
      {
        key: "scout",
        label: "Opponent Scouting",
        trigger: "Use /scout in Discord to trigger manually",
        description: "Pulls the opposing clan's name, tag, current war fame, and participant count from the CR API and posts a scouting report. Use it at the start of war day to size up the enemy.",
        example: "🔍 Enemy Clan Intel\n*Robin studied them. Here's what she found.*\n🏴‍☠️ LegendClan · Tag: #ABC123\n⚔️ Fame: 14,200 · 👥 Participants: 48",
        slash: "/scout",
      },
    ],
  },
  {
    id: "members",
    label: "👥 Members",
    features: [
      {
        key: "welcome",
        label: "New Member Welcome",
        trigger: "When a new member is detected in the clan (Mon & Fri snapshot)",
        description: "Detects new members by comparing the current roster against the last 30 days of snapshots. Posts a welcome message with a random One Piece boarding quote. Best pointed at a #welcome or #general channel.",
        example: "🏴‍☠️ A New Pirate Joins the Crew!\nNewPlayer has boarded the Thousand Sunny!\n*Sanji's already cooking something to celebrate. Don't waste it.*\n🏆 Trophies: 7,200",
        slash: null,
      },
      {
        key: "welcome_gate",
        label: "Discord Join Welcome (Verification Gate)",
        trigger: "Every ~2 minutes — fires when someone new joins the Discord server",
        description: "Detects new Discord joins (not clan joins) and posts a welcome message telling them to run /register. New joiners are automatically given the Unverified role and restricted until they do. Point this at your #welcome channel.",
        example: "🏴‍☠️ A New Pirate Has Boarded!\nWelcome, NewMember!\n*The Log Pose has pointed you here for a reason.*\nYou're currently Unverified — run /register <your player tag> to unlock the rest of the ship.",
        slash: null,
      },
      {
        key: "donations",
        label: "Donation Leaderboard",
        trigger: "Every Sunday at 10:00 UTC",
        description: "Weekly top donors with 🥇🥈🥉 medals. Bottom 3 with under 20 donations get a gentle Nami roast. Rewards the crew members keeping cards flowing and lightly shames the freeloaders.",
        example: "💝 Weekly Donation Leaderboard\n🥇 PlayerOne — 1,200 donated\n🥈 PlayerTwo — 980 donated\n💸 Slacker — 3 donated (Nami wants a word with you)",
        slash: "/donations",
      },
      {
        key: "member_count",
        label: "Member Count Alert",
        trigger: "Daily at 9:00 UTC — only fires if below your set threshold",
        description: "Alerts your channel if the clan drops below a member count you choose (default: 45). Set the threshold in the config below. Good for pointing at a #recruitment or #leadership channel.",
        example: "⚠️ Crew is Running Low!\nWe're down to 43/45 minimum crew.\nTime to recruit! 7 spots open on the Thousand Sunny.",
        slash: null,
        extraConfig: [{ key: "member_count_threshold", label: "Alert below this many members", placeholder: "45", type: "number" as const }],
      },
      {
        key: "inactive",
        label: "Low War Fame Alert",
        trigger: "After each war snapshot — fires if any member scores below your threshold",
        description: "Flags members who scored below your set fame threshold in the most recent war. Default is 850 fame. Point this at a private #leadership channel. Fires automatically after every war snapshot.",
        example: "😴 Low War Fame Alert\n💤 PlayerOne — 620 fame (below 850) · 5 donations\n💤 PlayerTwo — 300 fame (below 850) · 0 donations\n*Consider a conversation before the next war.*",
        slash: "/inactive",
        extraConfig: [{ key: "low_fame_threshold", label: "Alert below this fame per war", placeholder: "850", type: "number" as const }],
      },
      {
        key: "kick_alert",
        label: "Kick Recommendation",
        trigger: "After each war snapshot — fires if any member's average falls below your threshold",
        description: "Checks the last 5 wars and flags members whose average fame is below your set threshold. Default is 1,700 fame. Uses the same data shown on the War Analysis page. Point this at a private admin channel.",
        example: "🚨 Kick Recommendation — Admin Eyes Only\n⚠️ PlayerOne #ABC123 — avg 1,200 fame over 5 wars\n⚠️ PlayerTwo #XYZ456 — avg 950 fame over 3 wars\n*Review on the war analysis page before the next war.*",
        slash: null,
        extraConfig: [{ key: "kick_avg_threshold", label: "Flag members with avg fame below", placeholder: "1700", type: "number" as const }],
      },
    ],
  },
  {
    id: "rankings",
    label: "🏆 Rankings",
    features: [
      {
        key: "promotions",
        label: "Rank Promotions",
        trigger: "After each war snapshot — checks if any member crossed a fame tier",
        description: "Tracks lifetime fame (baseline + all completed wars). When someone crosses Copper → Silver → Gold → Diamond → Special Grade → Hashira, posts a promotion with a character quote for that tier. Each rank is announced exactly once per member.",
        example: "⭐ Rank Up — Gold!\nPlayerOne has reached Gold rank!\n*You fight like a true Straw Hat. Even Nami is impressed.*\n7,400 lifetime fame",
        slash: null,
      },
      {
        key: "streaks",
        label: "Battle Streak Announcements",
        trigger: "After war snapshots (Mon & Fri) — announces at 5, 10, and 20 war streaks",
        description: "Tracks how many consecutive wars each member used all 4 decks. Shouts out players when they hit 5, 10, or 20 war streaks. Encourages consistency over one-off big performances.",
        example: "🔥 10-War Battle Streak!\nPlayerOne has used all 4 decks in 10 wars in a row!\n*You fight like a Straw Hat first mate.*",
        slash: "/streaks",
      },
      {
        key: "leaderboard",
        label: "Weekly Fame Leaderboard",
        trigger: "Every Monday at 9:00 UTC",
        description: "Top 5 members by lifetime fame, with their rank tier. Includes a rotating Zoro/Luffy taunt to keep the competitive spirit alive. Best posted to a #leaderboard or #war-stats channel.",
        example: "📊 Weekly Fame Leaderboard\n*Zoro would be disappointed in anyone not in the top 3.*\n🥇 PlayerOne — 12,400 fame · 🥇 Diamond\n🥈 PlayerTwo — 9,800 fame · 🥇 Gold",
        slash: null,
      },
      {
        key: "bounty",
        label: "Bounty Board",
        trigger: "Every Monday at 12:00 UTC — shows all-time best single-war performances",
        description: "Pulls the top 5 highest single-war fame scores ever recorded in the database and posts a 'most wanted' style leaderboard. Rewards players who go all out in a single war, not just lifetime totals.",
        example: "🏴‍☠️ Bounty Board — Most Wanted\n🥇 PlayerOne — 4,800 fame (Season 130 Week 2)\n🥈 PlayerTwo — 4,200 fame (Season 131 Week 1)",
        slash: "/bounty",
      },
    ],
  },
  {
    id: "fun",
    label: "🎉 Fun",
    features: [
      {
        key: "quote",
        label: "Quote of the Day",
        trigger: "Every day at 8:00 UTC",
        description: "Posts a random One Piece quote from 30+ characters including Luffy, Zoro, Nami, Sanji, Robin, Ace, Shanks, Whitebeard, and more. Great for a #general or #off-topic channel. Pure vibes, no clan data involved.",
        example: "📜 Quote of the Day\n*\"If you don't take risks, you can't create a future!\"*\n— Monkey D. Luffy",
        slash: "/quote",
      },
    ],
  },
];

const ALL_FEATURES = CATEGORIES.flatMap(c => c.features);

// ── Slash command reference ───────────────────────────────────────────────────

const SLASH_COMMANDS = [
  { cmd: "/warcheck",  desc: "Shows who still needs to battle today with a progress bar per member" },
  { cmd: "/warremind", desc: "Manually triggers a battle reminder to the reminders channel right now" },
  { cmd: "/warday",    desc: "Posts the war kickoff message immediately — useful if the auto one missed" },
  { cmd: "/scout",     desc: "Pulls the current opponent's stats and posts a scouting report" },
  { cmd: "/donations", desc: "Posts this week's donation leaderboard on demand" },
  { cmd: "/inactive",  desc: "Shows inactive members (0 war fame + low donations) right now" },
  { cmd: "/streaks",   desc: "Posts the current battle streak leaderboard" },
  { cmd: "/bounty",    desc: "Posts the all-time best single-war fame performances" },
  { cmd: "/quote",     desc: "Posts a random One Piece quote to the channel" },
  { cmd: "/setup",     desc: "Shows a setup guide for the Discord bot with all available features" },
  { cmd: "/register",  desc: "Links a member's Clash Royale account, assigns their roles, and sets their nickname" },
  { cmd: "/whois",     desc: "Looks up which Clash Royale account a Discord member has registered" },
  { cmd: "/admin-preview-resync", desc: "[Admin] Preview the one-time role cleanup without changing anything" },
  { cmd: "/admin-apply-resync",   desc: "[Admin] Apply the one-time role cleanup" },
];

// ── OAuth2 invite URL ─────────────────────────────────────────────────────────

function buildInviteUrl(appId: string, appUrl: string) {
  const redirectUri = encodeURIComponent(`${appUrl}/api/discord/callback`);
  // 402672640 = view/send/embed/history + Manage Nicknames + Manage Roles
  // (needed for /register's role sync and nickname sync)
  return `https://discord.com/api/oauth2/authorize?client_id=${appId}&permissions=402672640&scope=bot%20applications.commands&redirect_uri=${redirectUri}&response_type=code`;
}

// ── Password Gate ─────────────────────────────────────────────────────────────

function PasswordGate({ onUnlock }: { onUnlock: () => void }) {
  const [pw, setPw]           = useState("");
  const [show, setShow]       = useState(false);
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/discord/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });
      if (res.ok) {
        sessionStorage.setItem("discord_auth", "1");
        onUnlock();
      } else {
        setError("Wrong password. Check with your captain.");
      }
    } catch {
      setError("Connection error — try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "rgba(248,215,120,0.1)", border: "1px solid rgba(248,215,120,0.2)" }}>
            <Lock size={24} className="text-gold-400" strokeWidth={1.5} />
          </div>
          <h1 className="font-display text-2xl text-gold-gradient mb-1">Discord Settings</h1>
          <p className="font-body text-sm text-text-muted">Crew leaders only. Enter the password to continue.</p>
        </div>

        <form onSubmit={submit} className="card-base p-6">
          <label className="font-heading text-[0.65rem] tracking-widest text-text-muted uppercase block mb-2">
            Password
          </label>
          <div className="relative mb-4">
            <input
              type={show ? "text" : "password"}
              value={pw}
              onChange={e => setPw(e.target.value)}
              placeholder="Enter password"
              autoFocus
              className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2.5 pr-10 font-body text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-navy-400 transition-colors"
            />
            <button type="button" onClick={() => setShow(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors">
              {show ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>

          {error && (
            <p className="font-body text-xs text-red-clash mb-3">{error}</p>
          )}

          <button type="submit" disabled={loading || !pw}
            className="w-full py-2.5 rounded-lg font-heading text-sm tracking-wide transition-all disabled:opacity-40"
            style={{ background: "rgba(248,215,120,0.12)", color: "#f8d978", border: "1px solid rgba(248,215,120,0.25)" }}>
            {loading ? "Checking…" : "Enter"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function DiscordSetupPage() {
  const [authed, setAuthed]         = useState(false);
  const [checking, setChecking]     = useState(true);
  const [status, setStatus]         = useState<BotStatus | null>(null);
  const [setupState, setSetupState] = useState<SetupState>("idle");
  const [setupMsg, setSetupMsg]     = useState("");
  const [webhook, setWebhook]       = useState("");
  const [channel, setChannel]       = useState("");
  const [channels, setChannels]     = useState<Record<string, ChannelConfig>>({});
  const [extraConfig, setExtraConfig] = useState<Record<string, string>>({});
  const [saving, setSaving]         = useState<string | null>(null);
  const [expanded, setExpanded]     = useState<string | null>(null);
  const [activeTab, setActiveTab]   = useState("war");
  const [copied, setCopied]         = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  // Check session auth
  useEffect(() => {
    if (sessionStorage.getItem("discord_auth") === "1") setAuthed(true);
    setChecking(false);
  }, []);

  // Handle OAuth2 callback params
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

  const loadData = useCallback(async () => {
    try {
      const [statusRes, channelsRes, configRes] = await Promise.all([
        fetch("/api/discord/status"),
        fetch("/api/discord/channels"),
        fetch("/api/discord/config"),
      ]);
      setStatus(await statusRes.json());
      const chList: ChannelConfig[] = await channelsRes.json();
      const chMap: Record<string, ChannelConfig> = {};
      for (const c of chList) chMap[c.feature] = c;
      setChannels(chMap);
      setExtraConfig(await configRes.json());
    } catch { /* silent */ }
  }, []);

  useEffect(() => { if (authed) loadData(); }, [authed, loadData]);

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

  const saveConfig = async (key: string, value: string) => {
    await fetch("/api/discord/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: value }),
    });
    setExtraConfig(prev => ({ ...prev, [key]: value }));
  };

  const sendTestReminder = async () => {
    setTestLoading(true); setTestResult(null);
    try {
      const res = await fetch("/api/discord/remind", { method: "POST" });
      const data = await res.json();
      if (data.skipped) setTestResult(`Skipped — ${data.reason}`);
      else if (data.allDone) setTestResult("Sent! All members done.");
      else setTestResult(`Sent! ${data.needBattle} member(s) still need to battle.`);
    } catch (err) { setTestResult(`Error: ${String(err)}`); }
    finally { setTestLoading(false); }
  };

  const copyWebhook = async () => {
    await navigator.clipboard.writeText(webhook);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const appUrl = typeof window !== "undefined" ? window.location.origin : "";
  const inviteUrl = status?.appId ? buildInviteUrl(status.appId, appUrl) : null;

  if (checking) return null;
  if (!authed) return <PasswordGate onUnlock={() => setAuthed(true)} />;

  const currentFeatures = CATEGORIES.find(c => c.id === activeTab)?.features ?? [];

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto w-full">

      {/* Header */}
      <div className="mb-6 animate-fade-up" style={{ opacity: 0, animationDelay: "0.05s" }}>
        <div className="flex items-center gap-3 mb-1">
          <Bot size={22} className="text-gold-400" strokeWidth={1.5} />
          <h1 className="font-display text-2xl sm:text-3xl text-gold-gradient">Discord Bot</h1>
        </div>
        <p className="text-text-muted text-sm font-body">
          Connect the clan website to Discord — automatic announcements, reminders, and leaderboards, all themed after One Piece
        </p>
      </div>

      {/* OAuth callback banners */}
      {setupState === "success" && (
        <div className="mb-5 rounded-xl p-4 border" style={{ background: "rgba(57,255,20,0.06)", borderColor: "rgba(57,255,20,0.25)" }}>
          <div className="flex items-start gap-3">
            <CheckCircle2 size={18} className="text-green-clash mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-heading text-sm text-green-clash">Bot added to server!</p>
              <p className="font-body text-xs text-text-muted mt-0.5">
                Webhook created in <strong>#{channel}</strong>. Paste this URL into any feature below.
              </p>
              {webhook && (
                <div className="mt-2 flex items-center gap-2">
                  <code className="flex-1 text-[0.65rem] text-text-muted bg-navy-900 rounded px-2 py-1 truncate border border-navy-600">{webhook}</code>
                  <button onClick={copyWebhook} className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-heading text-xs"
                    style={{ background: "rgba(248,215,120,0.12)", color: "#f8d978" }}>
                    {copied ? <Check size={12} /> : <Copy size={12} />}{copied ? "Copied!" : "Copy"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {setupState === "error" && (
        <div className="mb-5 rounded-xl p-4 border" style={{ background: "rgba(239,68,68,0.06)", borderColor: "rgba(239,68,68,0.25)" }}>
          <div className="flex items-start gap-3">
            <XCircle size={18} className="text-red-clash mt-0.5 shrink-0" />
            <div><p className="font-heading text-sm text-red-clash">Setup failed</p>
              <p className="font-body text-xs text-text-muted mt-0.5">{setupMsg || "Check that all env vars are set."}</p></div>
          </div>
        </div>
      )}

      {/* Status + Install */}
      <div className="grid grid-cols-2 gap-3 mb-4 animate-fade-up" style={{ opacity: 0, animationDelay: "0.1s" }}>
        <StatusCard label="Bot credentials" ok={status?.botConfigured ?? false} okText="Configured" failText="Missing env vars" />
        <StatusCard label="Reminder webhook" ok={status?.webhookConfigured ?? false} okText="Connected" failText="Not set" />
      </div>

      <div className="card-base p-4 mb-6 animate-fade-up flex items-center justify-between gap-4 flex-wrap" style={{ opacity: 0, animationDelay: "0.13s" }}>
        <div>
          <h2 className="font-display text-base text-text-primary mb-0.5">Add Bot to Server</h2>
          <p className="font-body text-xs text-text-muted">Click once — the bot auto-creates a webhook you can paste into any feature below</p>
        </div>
        {!status?.appId ? (
          <span className="text-xs font-body" style={{ color: "#fbbf24" }}>
            <AlertTriangle size={11} className="inline mr-1" />DISCORD_APPLICATION_ID not set
          </span>
        ) : (
          <a href={inviteUrl!}
            className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-lg font-heading text-xs tracking-wide"
            style={{ background: "linear-gradient(135deg, #5865F2, #4752c4)", color: "#fff", boxShadow: "0 4px 16px rgba(88,101,242,0.3)" }}>
            <svg width="14" height="14" viewBox="0 0 127.14 96.36" fill="white">
              <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"/>
            </svg>
            Add to Discord <ExternalLink size={11} />
          </a>
        )}
      </div>

      {/* Category tabs */}
      <div className="flex gap-1 mb-4 p-1 rounded-xl animate-fade-up" style={{ opacity: 0, animationDelay: "0.16s", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
        {CATEGORIES.map(cat => (
          <button key={cat.id} onClick={() => { setActiveTab(cat.id); setExpanded(null); }}
            className="flex-1 py-2 rounded-lg font-heading text-xs tracking-wide transition-all"
            style={{
              background: activeTab === cat.id ? "rgba(248,215,120,0.1)" : "transparent",
              color: activeTab === cat.id ? "#f8d978" : "#666",
              border: activeTab === cat.id ? "1px solid rgba(248,215,120,0.2)" : "1px solid transparent",
            }}>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Feature cards */}
      <div className="space-y-2 mb-6 animate-fade-up" style={{ opacity: 0, animationDelay: "0.2s" }}>
        {currentFeatures.map(feat => {
          const cfg = channels[feat.key];
          const isExpanded = expanded === feat.key;
          const isEnabled = cfg?.enabled ?? false;
          const hasWebhook = !!cfg?.webhook_url;

          return (
            <div key={feat.key} className="rounded-xl border overflow-hidden"
              style={{ background: "rgba(255,255,255,0.02)", borderColor: isEnabled && hasWebhook ? "rgba(57,255,20,0.12)" : "rgba(255,255,255,0.06)" }}>

              {/* Header row */}
              <button onClick={() => setExpanded(isExpanded ? null : feat.key)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.02] transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-heading text-sm text-text-primary">{feat.label}</p>
                    {feat.slash && (
                      <code className="font-heading text-[0.55rem] px-1.5 py-0.5 rounded"
                        style={{ background: "rgba(88,101,242,0.12)", color: "#818cf8", border: "1px solid rgba(88,101,242,0.15)" }}>
                        {feat.slash}
                      </code>
                    )}
                  </div>
                  <p className="font-body text-[0.65rem] text-text-muted truncate">{feat.trigger}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {hasWebhook ? (
                    <span className="font-heading text-[0.6rem] tracking-wide px-1.5 py-0.5 rounded"
                      style={{
                        background: isEnabled ? "rgba(57,255,20,0.1)" : "rgba(255,255,255,0.05)",
                        color: isEnabled ? "#39ff14" : "#555",
                      }}>
                      {isEnabled ? "ON" : "OFF"}
                    </span>
                  ) : (
                    <span className="font-heading text-[0.6rem] text-text-muted">no webhook</span>
                  )}
                  {isExpanded ? <ChevronUp size={13} className="text-text-muted" /> : <ChevronDown size={13} className="text-text-muted" />}
                </div>
              </button>

              {/* Expanded panel */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                  <p className="font-body text-xs text-text-muted mt-3 mb-3 leading-relaxed">{feat.description}</p>

                  {/* Discord preview */}
                  <div className="rounded-lg p-3 mb-4 font-mono text-[0.65rem] text-text-muted whitespace-pre leading-relaxed"
                    style={{ background: "rgba(88,101,242,0.06)", border: "1px solid rgba(88,101,242,0.12)" }}>
                    {feat.example}
                  </div>

                  {/* Webhook input */}
                  <div className="flex items-center gap-2 mb-3">
                    <Hash size={11} className="text-text-muted shrink-0" />
                    <span className="font-heading text-[0.65rem] text-text-muted shrink-0">Webhook URL</span>
                    <input
                      type="text"
                      placeholder="https://discord.com/api/webhooks/..."
                      defaultValue={cfg?.webhook_url ?? ""}
                      onBlur={e => {
                        const url = e.target.value.trim();
                        if (url !== (cfg?.webhook_url ?? "")) saveChannel(feat.key, url, cfg?.enabled ?? true);
                      }}
                      className="flex-1 bg-navy-900 border border-navy-600 rounded-lg px-3 py-1.5 font-body text-xs text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-navy-400 transition-colors"
                    />
                    {hasWebhook && (
                      <button onClick={() => saveChannel(feat.key, cfg.webhook_url, !isEnabled)}
                        disabled={saving === feat.key}
                        className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-heading text-xs transition-all disabled:opacity-50"
                        style={{
                          background: isEnabled ? "rgba(57,255,20,0.08)" : "rgba(255,255,255,0.04)",
                          color: isEnabled ? "#39ff14" : "#555",
                          border: `1px solid ${isEnabled ? "rgba(57,255,20,0.2)" : "rgba(255,255,255,0.08)"}`,
                        }}>
                        {saving === feat.key ? <RefreshCw size={10} className="animate-spin" /> : isEnabled ? <ToggleRight size={12} /> : <ToggleLeft size={12} />}
                        {isEnabled ? "Enabled" : "Disabled"}
                      </button>
                    )}
                  </div>

                  {/* Extra config fields */}
                  {"extraConfig" in feat && feat.extraConfig?.map(ec => (
                    <div key={ec.key} className="flex items-center gap-2 mb-3">
                      <Hash size={11} className="text-text-muted shrink-0" />
                      <span className="font-heading text-[0.65rem] text-text-muted shrink-0 min-w-0">{ec.label}</span>
                      <input
                        type={ec.type ?? "text"}
                        placeholder={ec.placeholder}
                        defaultValue={extraConfig[ec.key] ?? ""}
                        onBlur={e => {
                          const v = e.target.value.trim();
                          if (v !== (extraConfig[ec.key] ?? "")) saveConfig(ec.key, v);
                        }}
                        className="w-24 bg-navy-900 border border-navy-600 rounded-lg px-3 py-1.5 font-body text-xs text-text-primary focus:outline-none focus:border-navy-400 transition-colors"
                      />
                    </div>
                  ))}

                  {/* Test button for reminders */}
                  {"testable" in feat && feat.testable && (
                    <div className="flex items-center gap-3 flex-wrap mt-1">
                      <button onClick={sendTestReminder} disabled={testLoading || !status?.webhookConfigured}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg font-heading text-xs tracking-wide transition-all disabled:opacity-40"
                        style={{ background: "rgba(248,215,120,0.1)", color: "#f8d978", border: "1px solid rgba(248,215,120,0.2)" }}>
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

      {/* Slash Commands */}
      <div className="card-base p-5 mb-4 animate-fade-up" style={{ opacity: 0, animationDelay: "0.25s" }}>
        <h2 className="font-display text-base text-text-primary mb-1">Slash Commands</h2>
        <p className="font-body text-xs text-text-muted mb-4">
          Type these in any Discord channel. Run <code className="text-gold-400">/setup</code> to see the guide directly in Discord.
        </p>
        <div className="space-y-2">
          {SLASH_COMMANDS.map(({ cmd, desc }) => (
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

      {/* Setup guide */}
      <div className="card-base p-5 animate-fade-up" style={{ opacity: 0, animationDelay: "0.3s" }}>
        <h2 className="font-display text-base text-text-primary mb-1">How to Set Up Each Feature</h2>
        <p className="font-body text-xs text-text-muted mb-4">Each feature needs its own webhook URL. Here's how to make one in Discord:</p>
        <ol className="space-y-3">
          {[
            "In Discord, right-click the channel you want the feature to post in",
            "Click Edit Channel → Integrations → Webhooks → New Webhook",
            "Name it (e.g. \"War Reminders\") and click Copy Webhook URL",
            "Paste that URL into the feature's webhook field above",
            "Click the toggle to enable it — done",
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="shrink-0 w-5 h-5 rounded-full font-heading text-[0.65rem] flex items-center justify-center mt-0.5"
                style={{ background: "rgba(248,215,120,0.1)", color: "#f8d978", border: "1px solid rgba(248,215,120,0.2)" }}>
                {i + 1}
              </span>
              <span className="font-body text-xs text-text-muted">{step}</span>
            </li>
          ))}
        </ol>
        <p className="font-body text-xs mt-4" style={{ color: "rgba(248,215,120,0.6)" }}>
          Tip: you can point multiple features at the same webhook URL if you want everything in one channel, or give each its own channel for more control.
        </p>
      </div>
    </div>
  );
}

function StatusCard({ label, ok, okText, failText }: { label: string; ok: boolean; okText: string; failText: string }) {
  return (
    <div className="rounded-xl p-4 border"
      style={{ background: ok ? "rgba(57,255,20,0.04)" : "rgba(239,68,68,0.04)", borderColor: ok ? "rgba(57,255,20,0.2)" : "rgba(239,68,68,0.15)" }}>
      <div className="flex items-center gap-2 mb-1">
        {ok ? <CheckCircle2 size={14} className="text-green-clash" /> : <XCircle size={14} className="text-red-clash" />}
        <span className={`font-heading text-xs ${ok ? "text-green-clash" : "text-red-clash"}`}>{ok ? okText : failText}</span>
      </div>
      <p className="font-body text-[0.7rem] text-text-muted">{label}</p>
    </div>
  );
}
