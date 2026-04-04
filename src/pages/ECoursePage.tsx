import { GraduationCap, ExternalLink } from "lucide-react";

interface Tutorial {
  title: string;
  description: string;
  youtubeId: string;
  duration?: string;
}

const tutorials: Tutorial[] = [
  {
    title: "Getting Started with Genbox",
    description: "Tutorial lengkap cara pakai Genbox dari awal — setup, generate gambar, sampai video.",
    youtubeId: "8IsXX7qvAkk",
    duration: "Full Tutorial",
  },
];

const ECoursePage = () => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
            <GraduationCap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-satoshi text-2xl font-bold text-foreground">E-Course</h1>
            <p className="text-sm text-muted-foreground">Tutorial & panduan lengkap Genbox</p>
          </div>
        </div>
      </div>

      {/* Video Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tutorials.map((tut) => (
          <div
            key={tut.youtubeId}
            className="rounded-2xl border border-border/60 bg-card/50 overflow-hidden transition-all duration-300 hover:border-primary/20 hover:shadow-[0_0_32px_-8px_hsl(var(--primary)/0.1)]"
          >
            {/* Embedded video */}
            <div className="aspect-video w-full">
              <iframe
                src={`https://www.youtube.com/embed/${tut.youtubeId}`}
                className="h-full w-full"
                style={{ border: "none" }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={tut.title}
                loading="lazy"
              />
            </div>

            {/* Info */}
            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-satoshi text-base font-bold text-foreground">{tut.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{tut.description}</p>
                </div>
              </div>
              {tut.duration && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                    {tut.duration}
                  </span>
                </div>
              )}
              <a
                href={`https://youtu.be/${tut.youtubeId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
              >
                Buka di YouTube <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Empty state hint */}
      {tutorials.length <= 1 && (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground/60">More tutorials coming soon ✨</p>
        </div>
      )}
    </div>
  );
};

export default ECoursePage;
