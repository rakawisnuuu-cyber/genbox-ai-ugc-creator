import { Button } from "@/components/ui/button";

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border/50">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <a href="#" className="font-heading text-xl tracking-widest text-primary">
          GENBOX
        </a>
        <Button variant="outline" size="sm" className="font-heading text-xs tracking-wider border-border hover:border-primary hover:text-primary">
          MASUK
        </Button>
      </div>
    </nav>
  );
};

export default Navbar;
