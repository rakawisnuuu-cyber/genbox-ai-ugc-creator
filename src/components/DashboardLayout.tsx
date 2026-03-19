import { useState } from "react";
import { Outlet, useLocation, Link } from "react-router-dom";
import {
  LayoutDashboard,
  ImagePlus,
  Users,
  Film,
  Wand2,
  Workflow,
  GalleryHorizontalEnd,
  Settings,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface NavItem {
  title: string;
  icon: typeof LayoutDashboard;
  path: string;
}

interface NavGroup {
  label?: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    items: [
      { title: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    ],
  },
  {
    label: "GAMBAR & KARAKTER",
    items: [
      { title: "Buat Gambar", icon: ImagePlus, path: "/generate" },
      { title: "Karakter", icon: Users, path: "/characters" },
    ],
  },
  {
    label: "VIDEO",
    items: [
      { title: "Buat Video", icon: Film, path: "/video" },
    ],
  },
  {
    label: "TOOLS",
    items: [
      { title: "Prompt Generator", icon: Wand2, path: "/prompt" },
      { title: "n8n Blueprint", icon: Workflow, path: "/blueprint" },
      { title: "Gallery", icon: GalleryHorizontalEnd, path: "/gallery" },
    ],
  },
];

const settingsItem: NavItem = { title: "Settings", icon: Settings, path: "/settings" };

const DashboardLayout = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const initial = user?.email?.charAt(0).toUpperCase() || "U";
  const displayName = user?.email?.split("@")[0] || "User";

  const isActive = (path: string) => location.pathname === path;
  const isFullWidthPage = location.pathname === "/generate" || location.pathname === "/video";

  const renderNavItem = (item: NavItem, onNavigate?: () => void) => {
    const active = isActive(item.path);
    return (
      <li key={item.path}>
        <Link
          to={item.path}
          onClick={onNavigate}
          className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            active
              ? "border-l-2 border-primary bg-[hsl(0_0%_10%)] pl-[10px] text-foreground"
              : "text-muted-foreground/60 hover:bg-muted/50 hover:text-muted-foreground"
          }`}
        >
          <item.icon className="h-[18px] w-[18px]" />
          {item.title}
        </Link>
      </li>
    );
  };

  const DesktopNav = () => (
    <div className="space-y-0.5">
      {navGroups.map((group, gi) => (
        <div key={gi}>
          {group.label && (
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/50 px-4 mt-6 mb-1.5">
              {group.label}
            </p>
          )}
          <ul className="space-y-0.5">
            {group.items.map((item) => renderNavItem(item))}
          </ul>
        </div>
      ))}
    </div>
  );

  const MobileNav = () => (
    <div className="space-y-1">
      {navGroups.map((group, gi) => (
        <div key={gi}>
          {group.label && (
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/50 px-3 mt-6 mb-1.5">
              {group.label}
            </p>
          )}
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = isActive(item.path);
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 py-3.5 px-3 text-base font-medium transition-colors ${
                      active
                        ? "border-l-2 border-primary pl-3 text-foreground"
                        : "text-muted-foreground/60 hover:text-muted-foreground"
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-[hsl(0_0%_16%)] bg-background lg:flex">
        {/* Logo */}
        <div className="px-5 pt-6">
          <p className="font-satoshi text-lg font-bold uppercase tracking-widest text-foreground">
            GENBOX
          </p>
          <div className="mt-1.5 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            <span className="text-[11px] text-[hsl(0_0%_33%)]">v1.0</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="mt-8 flex-1 overflow-y-auto px-3">
          <DesktopNav />
        </nav>

        {/* Settings (sticky bottom) */}
        <div className="px-3 pb-2">
          <ul className="space-y-0.5">
            {renderNavItem(settingsItem)}
          </ul>
        </div>

        {/* User */}
        <div className="border-t border-[hsl(0_0%_16%)] px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[hsl(0_0%_16%)] text-xs font-bold text-foreground">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-muted-foreground">{displayName}</p>
            </div>
            <button
              onClick={signOut}
              className="text-xs text-muted-foreground/60 transition-colors hover:text-foreground"
            >
              Keluar
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <header className="fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between border-b border-[hsl(0_0%_16%)] bg-[hsl(0_0%_0%/0.9)] px-4 backdrop-blur-xl lg:hidden">
        <p className="font-satoshi text-lg font-bold uppercase tracking-widest text-foreground">
          GENBOX
        </p>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-foreground">
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-background/95 pt-14 backdrop-blur-lg lg:hidden">
          <nav className="px-6 py-6">
            <MobileNav />
            {/* Settings in mobile */}
            <div className="mt-4 pt-4 border-t border-[hsl(0_0%_16%)]">
              <Link
                to="/settings"
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 py-3.5 px-3 text-base font-medium transition-colors ${
                  isActive("/settings")
                    ? "border-l-2 border-primary pl-3 text-foreground"
                    : "text-muted-foreground/60 hover:text-muted-foreground"
                }`}
              >
                <Settings className="h-5 w-5" />
                Settings
              </Link>
            </div>
          </nav>

          {/* Mobile user */}
          <div className="absolute inset-x-0 bottom-0 border-t border-[hsl(0_0%_16%)] px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[hsl(0_0%_16%)] text-xs font-bold text-foreground">
                {initial}
              </div>
              <p className="truncate text-sm text-muted-foreground">{displayName}</p>
              <button
                onClick={signOut}
                className="ml-auto text-xs text-muted-foreground/60 transition-colors hover:text-foreground"
              >
                Keluar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="mt-14 min-h-screen lg:ml-60 lg:mt-0">
        <div className={`mx-auto ${isFullWidthPage ? "" : "max-w-5xl px-4 py-4 lg:px-6 lg:py-8"}`}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
