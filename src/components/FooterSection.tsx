import GenboxLogo from "./GenboxLogo";

const FooterSection = () => {
  return (
    <footer className="border-t border-border/30 py-8 px-4">
      <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <GenboxLogo size={22} variant="icon" />
          <span className="text-xs text-muted-foreground/50">© 2025 GENBOX</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="#" className="text-xs text-muted-foreground/50 hover:text-cream transition-colors">Terms</a>
          <a href="#" className="text-xs text-muted-foreground/50 hover:text-cream transition-colors">Privacy</a>
          <a href="#" className="text-xs text-muted-foreground/50 hover:text-cream transition-colors">Contact</a>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
