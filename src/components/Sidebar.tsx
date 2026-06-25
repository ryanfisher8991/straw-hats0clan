"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Swords, Users, Skull, BarChart2, Layers, Bot } from "lucide-react";

const navItems = [
  { href: "/dashboard",    label: "Dashboard",    mobileLabel: "Home",     icon: LayoutDashboard },
  { href: "/war",          label: "War Log",      mobileLabel: "War",      icon: Swords },
  { href: "/war-analysis", label: "War Analysis", mobileLabel: "Analysis", icon: BarChart2 },
  { href: "/deck-builder", label: "Deck Builder", mobileLabel: "Decks",    icon: Layers },
  { href: "/members",      label: "Members",      mobileLabel: "Members",  icon: Users },
  { href: "/graveyard",    label: "Graveyard",    mobileLabel: "RIP",      icon: Skull },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 min-h-screen bg-navy-950 border-r border-navy-500 shrink-0">
        <SidebarContent pathname={pathname} />
      </aside>

      {/* Mobile bottom bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-navy-950 border-t border-navy-500 flex">
        {navItems.map(({ href, mobileLabel, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-[9px] font-heading tracking-wide transition-colors ${
                active ? "text-gold-400" : "text-text-muted"
              }`}
            >
              <Icon size={18} strokeWidth={active ? 2 : 1.5} />
              {mobileLabel}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

function SidebarContent({ pathname }: { pathname: string }) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-7 border-b border-navy-500">
        <div className="flex items-center gap-3 mb-1">
          <svg width="28" height="22" viewBox="0 0 64 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 40L10 14L22 28L32 6L42 28L54 14L60 40H4Z" fill="url(#sg)" />
            <rect x="4" y="42" width="56" height="5" rx="2" fill="url(#sg)" />
            <defs>
              <linearGradient id="sg" x1="4" y1="6" x2="60" y2="47" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#f8d978"/>
                <stop offset="100%" stopColor="#b88418"/>
              </linearGradient>
            </defs>
          </svg>
          <span className="font-display text-sm text-gold-gradient leading-tight">
            Straw Hats
          </span>
        </div>
        <p className="font-heading text-[0.55rem] tracking-[0.2em] text-navy-400 uppercase ml-[40px]">
          #QPRQ88YP
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 flex flex-col gap-0.5 px-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`nav-item flex items-center gap-3 px-3 py-2.5 rounded-r-lg text-sm ${
                active ? "nav-item-active" : "text-text-muted"
              }`}
            >
              <Icon
                size={17}
                strokeWidth={active ? 2 : 1.5}
                className={active ? "text-gold-400" : ""}
              />
              <span className="font-heading tracking-wide text-[0.8rem]">{label}</span>
            </Link>
          );
        })}

        {/* Desktop-only: Discord Bot setup */}
        <div className="mt-3 mx-3 border-t border-navy-500/50" />
        {(() => {
          const active = pathname === "/discord";
          return (
            <Link
              href="/discord"
              className={`nav-item flex items-center gap-3 px-3 py-2.5 rounded-r-lg text-sm mt-1 ${
                active ? "nav-item-active" : "text-text-muted"
              }`}
            >
              <Bot
                size={17}
                strokeWidth={active ? 2 : 1.5}
                className={active ? "text-gold-400" : ""}
              />
              <span className="font-heading tracking-wide text-[0.8rem]">Discord Bot</span>
            </Link>
          );
        })()}
      </nav>

    </div>
  );
}
