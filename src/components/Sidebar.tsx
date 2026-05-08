"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Swords, Users, Shield, Skull, LogOut } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/war",       label: "War Log",   icon: Swords },
  { href: "/members",   label: "Members",   icon: Users },
  { href: "/decks",     label: "Decks",     icon: Shield },
  { href: "/graveyard", label: "Graveyard", icon: Skull },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/login");
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 min-h-screen bg-navy-950 border-r border-navy-500 shrink-0">
        <SidebarContent pathname={pathname} onLogout={handleLogout} />
      </aside>

      {/* Mobile bottom bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-navy-950 border-t border-navy-500 flex">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-heading tracking-wider transition-colors ${
                active ? "text-gold-400" : "text-text-muted"
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2 : 1.5} />
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

function SidebarContent({
  pathname,
  onLogout,
}: {
  pathname: string;
  onLogout: () => void;
}) {
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
      </nav>

      {/* Logout */}
      <div className="px-2 pb-6 border-t border-navy-500 pt-4">
        <button
          onClick={onLogout}
          className="nav-item w-full flex items-center gap-3 px-3 py-2.5 rounded-r-lg text-sm text-text-muted hover:text-red-clash transition-colors"
        >
          <LogOut size={17} strokeWidth={1.5} />
          <span className="font-heading tracking-wide text-[0.8rem]">Leave</span>
        </button>
      </div>
    </div>
  );
}
