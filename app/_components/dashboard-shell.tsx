"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

type IconName = "grid" | "calendar" | "users" | "sparkles";

function Icon({ name }: { name: IconName }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  if (name === "grid") {
    return (
      <svg {...common}>
        <rect x="3" y="3" width="7" height="7" rx="1.6" />
        <rect x="14" y="3" width="7" height="7" rx="1.6" />
        <rect x="3" y="14" width="7" height="7" rx="1.6" />
        <rect x="14" y="14" width="7" height="7" rx="1.6" />
      </svg>
    );
  }
  if (name === "calendar") {
    return (
      <svg {...common}>
        <rect x="3" y="5" width="18" height="16" rx="2.4" />
        <path d="M3 10h18M8 3v4M16 3v4" />
      </svg>
    );
  }
  if (name === "users") {
    return (
      <svg {...common}>
        <circle cx="9" cy="8" r="3.4" />
        <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
        <path d="M16 5.2a3.4 3.4 0 0 1 0 6.6" />
        <path d="M17.5 14.5A5.5 5.5 0 0 1 20.5 20" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3Z" />
      <path d="M18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z" />
    </svg>
  );
}

const links: { href: string; label: string; icon: IconName }[] = [
  { href: "/dashboard", label: "Resumen", icon: "grid" },
  { href: "/dashboard/agenda", label: "Agenda", icon: "calendar" },
  { href: "/dashboard/clientes", label: "Clientes", icon: "users" },
  { href: "/dashboard/servicios", label: "Servicios", icon: "sparkles" },
];

function titleFor(pathname: string) {
  if (pathname.startsWith("/dashboard/agenda")) return "Agenda";
  if (pathname.startsWith("/dashboard/clientes")) return "Clientes";
  if (pathname.startsWith("/dashboard/servicios")) return "Servicios";
  return "Resumen";
}

export default function DashboardShell({
  email,
  children,
}: {
  email: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div className="dash">
      <aside className="dash-sidebar">
        <Link className="brand" href="/">
          <span className="brand-icon">
            <Image src="/images/Logo.jpg" alt="Logo La Fisioterapeuta Li" width={34} height={34} />
          </span>
          La Fisioterapeuta Li
        </Link>

        <nav className="dash-menu" aria-label="Módulos del panel">
          {links.map((link) => {
            const isActive =
              link.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(link.href);
            return (
              <Link key={link.href} href={link.href} className={isActive ? "active" : ""}>
                <span className="dash-menu-icon">
                  <Icon name={link.icon} />
                </span>
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="dash-sidebar-footer">
          <span className="dash-user" title={email}>
            {email}
          </span>
          <button type="button" className="dash-logout" onClick={handleLogout} disabled={isLoggingOut}>
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <path d="M16 17l5-5-5-5" />
              <path d="M21 12H9" />
            </svg>
            {isLoggingOut ? "Saliendo…" : "Cerrar sesión"}
          </button>
        </div>
      </aside>

      <div className="dash-main">
        <header className="dash-topbar">
          <div>
            <p className="eyebrow">PANEL ADMINISTRATIVO</p>
            <strong>{titleFor(pathname)}</strong>
          </div>
          <Link className="dash-topbar-link" href="/" target="_blank" rel="noopener noreferrer">
            Sitio público ↗
          </Link>
        </header>
        <main className="dash-content">{children}</main>
      </div>
    </div>
  );
}
