import { useAuth } from "@/contexts/AuthContext";
import { Clock, Mail, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const TrialExpiredPage = () => {
  const { user, signOut } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
          <Clock className="h-8 w-8 text-destructive" />
        </div>

        <div className="space-y-2">
          <h1 className="font-satoshi text-2xl font-bold text-foreground">
            Trial Kamu Sudah Berakhir
          </h1>
          <p className="text-sm text-muted-foreground">
            Akses early access kamu telah habis. Hubungi kami untuk memperpanjang akses.
          </p>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/80 p-5 text-left space-y-3">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Email:</span>{" "}
            {user?.email}
          </p>
          <div className="flex flex-col gap-2">
            <Button asChild variant="default" size="sm" className="w-full">
              <a
                href="https://wa.me/6281234567890?text=Halo%2C%20trial%20Genbox%20saya%20sudah%20habis.%20Bisa%20diperpanjang%3F"
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Hubungi via WhatsApp
              </a>
            </Button>
            <Button asChild variant="outline" size="sm" className="w-full">
              <a href="mailto:support@genbox.id?subject=Extend%20Trial">
                <Mail className="h-4 w-4 mr-2" />
                Kirim Email
              </a>
            </Button>
          </div>
        </div>

        <button
          onClick={() => signOut()}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default TrialExpiredPage;
