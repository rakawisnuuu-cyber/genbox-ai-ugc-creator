import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";

const navLinks = [
  { label: "Fitur", href: "#fitur" },
  { label: "Cara Kerja", href: "#cara-kerja" },
  { label: "Harga", href: "#harga" },
  { label: "FAQ", href: "#faq" },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50"
        style={{
          transform: mounted ? "translateY(0)" : "translateY(-100%)",
          transition: "transform 0.4s ease-out",
        }}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <a href="#" className="font-satoshi text-xl font-bold tracking-[0.1em] text-foreground">
            GENBOX
          </a>

          <div className="hidden items-center gap-8 md:flex">
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
              >
                {l.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="hidden rounded-lg bg-primary px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-primary-foreground transition-all hover:bg-[hsl(var(--lime-hover))] hover:-translate-y-px md:inline-block"
            >
              MASUK
            </Link>
            <button
              onClick={() => setOpen(!open)}
              className="text-foreground md:hidden"
              aria-label="Toggle menu"
            >
              {open ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-8 bg-background/95 backdrop-blur-xl md:hidden">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="text-2xl font-satoshi font-bold uppercase tracking-wider text-foreground"
            >
              {l.label}
            </a>
          ))}
          <Link
            to="/login"
            onClick={() => setOpen(false)}
            className="mt-4 rounded-lg bg-primary px-8 py-3 text-sm font-bold uppercase tracking-wider text-primary-foreground"
          >
            MASUK
          </Link>
        </div>
      )}
    </>
  );
};

export default Navbar;
