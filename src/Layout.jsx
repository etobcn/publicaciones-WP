import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Newspaper, Award, Zap, ClipboardList } from "lucide-react";

const navItems = [
  { name: "Publicaciones", page: "Publicaciones", icon: Newspaper },
  { name: "Premios", page: "Premios", icon: Award },
  { name: "Envíos", page: "Envios", icon: ClipboardList },
];

export default function Layout({ children, currentPageName }) {
  return (
    <div className="flex h-screen bg-[#09090b] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[220px] shrink-0 border-r border-white/[0.06] bg-[#09090b] flex flex-col">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 h-[60px] border-b border-white/[0.06]">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600/20">
            <Zap className="h-4 w-4 text-violet-400" />
          </div>
          <div>
            <span className="text-[13px] font-semibold text-white/90 tracking-tight">
              Prensa
            </span>
            <span className="text-[13px] font-semibold text-violet-400 tracking-tight ml-0.5">
              &
            </span>
            <span className="text-[13px] font-semibold text-white/90 tracking-tight ml-0.5">
              Premios
            </span>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = currentPageName === item.page;
            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium
                  transition-all duration-150 ease-out group
                  ${isActive
                    ? "bg-violet-600/10 text-violet-400"
                    : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]"
                  }
                `}
              >
                <item.icon className={`h-4 w-4 transition-colors ${isActive ? "text-violet-400" : "text-white/30 group-hover:text-white/50"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-4 py-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-violet-500/40 to-violet-700/40 flex items-center justify-center">
              <span className="text-[10px] font-bold text-white/80">GP</span>
            </div>
            <span className="text-[11px] text-white/30">Gestión Prensa</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="min-h-full">
          {children}
        </div>
      </main>
    </div>
  );
}