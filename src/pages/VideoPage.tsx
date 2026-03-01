import { Link } from "react-router-dom";
import { Film, ArrowLeft } from "lucide-react";

const VideoPage = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-up">
    <div className="relative mb-6">
      <div className="w-20 h-20 rounded-2xl bg-primary/5 animate-pulse-subtle flex items-center justify-center">
        <div className="w-16 h-16 rounded-xl bg-card border border-border flex items-center justify-center">
          <Film className="h-7 w-7 text-muted-foreground" />
        </div>
      </div>
    </div>
    <h1 className="text-xl font-bold font-satoshi text-foreground mb-2">Video Generator segera hadir...</h1>
    <p className="text-sm text-muted-foreground max-w-xs">Generate video UGC 5-15 detik dari gambar</p>
    <Link
      to="/dashboard"
      className="mt-8 inline-flex items-center gap-2 border border-border text-muted-foreground rounded-lg px-4 py-2.5 text-sm hover:text-foreground transition-colors"
    >
      <ArrowLeft className="h-4 w-4" />
      KEMBALI KE DASHBOARD
    </Link>
  </div>
);

export default VideoPage;
