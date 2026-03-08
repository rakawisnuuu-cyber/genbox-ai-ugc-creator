import { useState } from "react";
import { Outlet, useLocation, Link } from "react-router-dom";
import {
  LayoutDashboard,
  ImagePlus,
  Users,
  Film,
  Wand2,
  Workflow,
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
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-200 ${
            active
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          }`}
        >
          <item.icon className="h-4 w-4" />
          {item.title}
        </Link>
      </li>
    );
  };

  const SidebarNav = ({ onNavigate }: { onNavigate?: () => void }) => (
    <div className="space-y-1">
      {navGroups.map((group, gi) => (
        <div key={gi}>
          {group.label && (
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/40 px-3 mt-7 mb-2">
              {group.label}
            </p>
          )}
          <ul className="space-y-0.5">
            {group.items.map((item) => renderNavItem(item, onNavigate))}
          </ul>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[220px] flex-col border-r border-border bg-background lg:flex">
        {/* Logo */}
        <div className="px-5 pt-7 pb-1">
          <p className="font-satoshi text-base font-bold uppercase tracking-[0.2em] text-foreground">
            GENBOX
          </p>
          <span className="mt-1 block text-[10px] font-mono text-muted-foreground/40">v1.0</span>
        </div>

        {/* Nav */}
        <nav className="mt-4 flex-1 overflow-y-auto px-3">
          <SidebarNav />
        </nav>

        {/* Settings */}
        <div className="px-3 pb-2 border-t border-border pt-2">
          <ul className="space-y-0.5">
            {renderNavItem(settingsItem)}
          </ul>
        </div>

        {/* User */}
        <div className="border-t border-border px-4 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-bold text-foreground">
              {initial}
            </div>
            <p className="truncate text-[12px] text-muted-foreground flex-1">{displayName}</p>
            <button
              onClick={signOut}
              className="text-[11px] text-muted-foreground/50 transition-colors hover:text-foreground"
            >
              Keluar
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <header className="fixed inset-x-0 top-0 z-50 flex h-12 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur-xl lg:hidden">
        <p className="font-satoshi text-sm font-bold uppercase tracking-[0.2em] text-foreground">
          GENBOX
        </p>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-foreground">
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-background pt-12 lg:hidden">
          <nav className="px-5 py-5">
            <SidebarNav onNavigate={() => setMobileOpen(false)} />
            <div className="mt-4 pt-4 border-t border-border">
              <Link
                to="/settings"
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  isActive("/settings")
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Settings className="h-4 w-4" />
                Settings
              </Link>
            </div>
          </nav>

          <div className="absolute inset-x-0 bottom-0 border-t border-border px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-bold text-foreground">
                {initial}
              </div>
              <p className="truncate text-sm text-muted-foreground">{displayName}</p>
              <button
                onClick={signOut}
                className="ml-auto text-xs text-muted-foreground/50 transition-colors hover:text-foreground"
              >
                Keluar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="mt-12 min-h-screen lg:ml-[220px] lg:mt-0">
        <div className={`mx-auto ${isFullWidthPage ? "" : "max-w-5xl px-5 py-6 lg:px-8 lg:py-10"}`}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
