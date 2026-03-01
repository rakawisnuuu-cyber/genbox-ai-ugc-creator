import { useState } from "react";
import { Outlet, useLocation, useNavigate, Link } from "react-router-dom";
import {
  LayoutDashboard,
  ImagePlus,
  UserCircle,
  Images,
  Sparkles,
  Package,
  Film,
  Settings,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { title: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { title: "Buat Gambar", icon: ImagePlus, path: "/generate" },
  { title: "Karakter", icon: UserCircle, path: "/characters" },
  { title: "Gallery", icon: Images, path: "/gallery" },
  { title: "Prompt Generator", icon: Sparkles, path: "/prompt" },
  { title: "n8n Blueprint", icon: Package, path: "/blueprint" },
  { title: "Buat Video", icon: Film, path: "/video", disabled: true },
  { title: "Settings", icon: Settings, path: "/settings" },
];

const DashboardLayout = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const initial = user?.email?.charAt(0).toUpperCase() || "U";
  const displayName = user?.email?.split("@")[0] || "User";

  const isActive = (path: string) => location.pathname === path;
  const isGeneratePage = location.pathname === "/generate";

  const NavList = ({ onNavigate }: { onNavigate?: () => void }) => (
    <ul className="space-y-1">
      {navItems.map((item) => {
        const active = isActive(item.path);
        if (item.disabled) {
          return (
            <li key={item.path}>
              <span className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-[hsl(0_0%_27%)] cursor-not-allowed">
                <item.icon className="h-[18px] w-[18px]" />
                {item.title}
                <span className="ml-auto rounded-full bg-[hsl(0_0%_16%)] px-2 py-0.5 text-[10px] uppercase tracking-wider text-[hsl(0_0%_40%)]">
                  Soon
                </span>
              </span>
            </li>
          );
        }
        return (
          <li key={item.path}>
            <Link
              to={item.path}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "border-l-2 border-primary bg-[hsl(0_0%_10%)] pl-[10px] text-foreground"
                  : "text-[hsl(0_0%_40%)] hover:bg-[hsl(0_0%_7%)] hover:text-[hsl(0_0%_60%)]"
              }`}
            >
              <item.icon className="h-[18px] w-[18px]" />
              {item.title}
            </Link>
          </li>
        );
      })}
    </ul>
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
          <NavList />
        </nav>

        {/* User */}
        <div className="border-t border-[hsl(0_0%_16%)] px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[hsl(0_0%_16%)] text-xs font-bold text-foreground">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-[hsl(0_0%_60%)]">{displayName}</p>
            </div>
            <button
              onClick={signOut}
              className="text-xs text-[hsl(0_0%_40%)] transition-colors hover:text-foreground"
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
            <ul className="space-y-1">
              {navItems.map((item) => {
                const active = isActive(item.path);
                if (item.disabled) {
                  return (
                    <li key={item.path}>
                      <span className="flex items-center gap-3 py-4 text-base font-medium text-[hsl(0_0%_27%)] cursor-not-allowed">
                        <item.icon className="h-5 w-5" />
                        {item.title}
                        <span className="ml-auto rounded-full bg-[hsl(0_0%_16%)] px-2 py-0.5 text-[10px] uppercase tracking-wider text-[hsl(0_0%_40%)]">
                          Soon
                        </span>
                      </span>
                    </li>
                  );
                }
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 py-4 text-base font-medium transition-colors ${
                        active
                          ? "border-l-2 border-primary pl-3 text-foreground"
                          : "text-[hsl(0_0%_40%)] hover:text-[hsl(0_0%_60%)]"
                      }`}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Mobile user */}
          <div className="absolute inset-x-0 bottom-0 border-t border-[hsl(0_0%_16%)] px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[hsl(0_0%_16%)] text-xs font-bold text-foreground">
                {initial}
              </div>
              <p className="truncate text-sm text-[hsl(0_0%_60%)]">{displayName}</p>
              <button
                onClick={signOut}
                className="ml-auto text-xs text-[hsl(0_0%_40%)] transition-colors hover:text-foreground"
              >
                Keluar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="mt-14 min-h-screen lg:ml-60 lg:mt-0">
        <div className={`mx-auto ${isGeneratePage ? "" : "max-w-5xl px-4 py-4 lg:px-6 lg:py-8"}`}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
