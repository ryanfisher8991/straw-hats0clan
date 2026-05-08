"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Sword } from "lucide-react";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push("/dashboard");
    } else {
      setError("Wrong password. Ask your clan leader.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-navy-900">

      {/* Background radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 50% -10%, rgba(244,200,66,0.07) 0%, transparent 70%),
            radial-gradient(ellipse 60% 40% at 20% 100%, rgba(61,125,245,0.05) 0%, transparent 60%),
            radial-gradient(ellipse 40% 30% at 80% 80%, rgba(224,48,48,0.04) 0%, transparent 60%)
          `,
        }}
      />

      {/* Decorative diamond pattern background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 4L56 30L30 56L4 30Z' fill='none' stroke='%23f4c842' stroke-width='0.5'/%3E%3C/svg%3E")`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Login card */}
      <div
        className="relative z-10 w-full max-w-md mx-4 animate-fade-up"
        style={{ animationDelay: "0.05s", opacity: 0 }}
      >
        {/* Top decorative bar */}
        <div
          className="h-[3px] rounded-t-sm"
          style={{
            background: "linear-gradient(90deg, transparent, #f4c842, #e8ae20, #f4c842, transparent)",
          }}
        />

        <div
          className="card-base rounded-t-none p-8 sm:p-10"
          style={{ borderTop: "none", borderRadius: "0 0 0.75rem 0.75rem" }}
        >
          {/* Crown icon */}
          <div className="flex flex-col items-center mb-8">
            <div className="animate-crown mb-5">
              <svg width="64" height="48" viewBox="0 0 64 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M4 40L10 14L22 28L32 6L42 28L54 14L60 40H4Z"
                  fill="url(#crownGrad)"
                  stroke="rgba(244,200,66,0.5)"
                  strokeWidth="1"
                />
                <circle cx="4" cy="42" r="3" fill="#f4c842"/>
                <circle cx="32" cy="4" r="3" fill="#f8d978"/>
                <circle cx="60" cy="42" r="3" fill="#f4c842"/>
                <rect x="4" y="42" width="56" height="5" rx="2" fill="url(#crownGrad)"/>
                <circle cx="18" cy="30" r="2.5" fill="#f8d978" opacity="0.7"/>
                <circle cx="32" cy="22" r="2.5" fill="#f8d978" opacity="0.7"/>
                <circle cx="46" cy="30" r="2.5" fill="#f8d978" opacity="0.7"/>
                <defs>
                  <linearGradient id="crownGrad" x1="4" y1="6" x2="60" y2="47" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#f8d978"/>
                    <stop offset="50%" stopColor="#f4c842"/>
                    <stop offset="100%" stopColor="#b88418"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl text-gold-gradient text-center leading-tight mb-2">
              The Straw Hats
            </h1>
            <p className="font-heading text-[0.65rem] tracking-[0.3em] text-text-muted uppercase">
              Clan War Headquarters
            </p>
          </div>

          {/* Divider */}
          <div className="divider-gold mb-8" />

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="font-heading text-[0.65rem] tracking-[0.2em] text-text-muted uppercase block mb-2">
                Clan Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter the secret word..."
                  className="input-clash w-full rounded-lg px-4 py-3 pr-12 text-base"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors focus-visible:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {error && (
                <p className="mt-2 text-red-clash text-sm font-body flex items-center gap-1.5">
                  <Sword size={13} />
                  {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !password}
              className="btn-gold w-full py-3.5 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:filter-none"
            >
              {loading ? "Entering..." : "Enter the War Room"}
            </button>
          </form>

          {/* Footer tag */}
          <p className="text-center mt-8 font-heading text-[0.6rem] tracking-[0.2em] text-navy-400 uppercase">
            #QPRQ88YP
          </p>
        </div>

        {/* Corner decorations */}
        <div className="absolute -top-[1px] -left-[1px] w-4 h-4 border-t-2 border-l-2 border-gold-600 rounded-tl-sm" />
        <div className="absolute -top-[1px] -right-[1px] w-4 h-4 border-t-2 border-r-2 border-gold-600 rounded-tr-sm" />
        <div className="absolute -bottom-[1px] -left-[1px] w-4 h-4 border-b-2 border-l-2 border-gold-600 rounded-bl-sm" />
        <div className="absolute -bottom-[1px] -right-[1px] w-4 h-4 border-b-2 border-r-2 border-gold-600 rounded-br-sm" />
      </div>
    </div>
  );
}
