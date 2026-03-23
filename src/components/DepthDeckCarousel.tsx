import { useState, useEffect, useCallback, useRef } from "react";
import { motion, useMotionValue } from "framer-motion";

const STORAGE_BASE = "https://hgwojnluqkrypwttytxb.supabase.co/storage/v1/object/public/showcase-videos";

interface ShowcaseCard {
  id: number;
  type: "image" | "video";
  url: string;
}

const showcaseCards: ShowcaseCard[] = [
  { id: 1, type: "video", url: `${STORAGE_BASE}/video-1.mp4` },
  { id: 2, type: "video", url: `${STORAGE_BASE}/video-2.mp4` },
  { id: 3, type: "video", url: `${STORAGE_BASE}/video-3.mp4` },
  { id: 4, type: "video", url: `${STORAGE_BASE}/video-4.mp4` },
  { id: 6, type: "video", url: `${STORAGE_BASE}/video-6.mp4` },
];

interface DepthDeckCarouselProps {
  autoPlayInterval?: number;
}

export default function DepthDeckCarousel({ autoPlayInterval = 3000 }: DepthDeckCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [mediaErrors, setMediaErrors] = useState<Record<number, boolean>>({});
  const videoRefs = useRef<Record<number, HTMLVideoElement | null>>({});
  const dragX = useMotionValue(0);

  const total = showcaseCards.length;

  const next = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % total);
  }, [total]);

  const prev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  useEffect(() => {
    if (isPaused || isDragging) return;
    const timer = setInterval(next, autoPlayInterval);
    return () => clearInterval(timer);
  }, [isPaused, isDragging, next, autoPlayInterval]);

  useEffect(() => {
    showcaseCards.forEach((card, index) => {
      const video = videoRefs.current[card.id];
      if (!video) return;
      if (index === activeIndex) {
        video.play().catch(() => {});
      } else {
        video.pause();
        video.currentTime = 0;
      }
    });
  }, [activeIndex]);

  const handleDragEnd = (_: any, info: { offset: { x: number }; velocity: { x: number } }) => {
    setIsDragging(false);
    const threshold = 50;
    if (info.offset.x < -threshold || info.velocity.x < -500) next();
    else if (info.offset.x > threshold || info.velocity.x > 500) prev();
  };

  const getCardStyle = (index: number) => {
    let diff = index - activeIndex;
    if (diff > total / 2) diff -= total;
    if (diff < -total / 2) diff += total;
    const absD = Math.abs(diff);

    return {
      x: diff * 180,
      scale: 1 - absD * 0.12,
      zIndex: total - absD,
      opacity: absD > 3 ? 0 : 1 - absD * 0.2,
      filter: diff === 0 ? "blur(0px)" : `blur(${absD * 2}px)`,
      rotateY: diff * -4,
      isActive: diff === 0,
    };
  };

  const handleMediaError = (id: number) => {
    setMediaErrors((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ perspective: "1200px", height: "340px" }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {showcaseCards.map((card, index) => {
        const style = getCardStyle(index);

        return (
          <motion.div
            key={card.id}
            className="absolute cursor-grab active:cursor-grabbing select-none"
            style={{ width: 200, height: 280, transformStyle: "preserve-3d" }}
            animate={{
              x: style.x,
              scale: style.scale,
              zIndex: style.zIndex,
              opacity: style.opacity,
              rotateY: style.rotateY,
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.1}
            dragMomentum={false}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={handleDragEnd}
            onClick={() => {
              if (!isDragging) {
                let diff = index - activeIndex;
                if (diff > total / 2) diff -= total;
                if (diff < -total / 2) diff += total;
                if (diff !== 0) setActiveIndex(index);
              }
            }}
          >
            <div
              className="relative h-full w-full overflow-hidden rounded-2xl border border-white/10"
              style={{
                boxShadow: style.isActive
                  ? "0 20px 60px -15px rgba(0,0,0,0.6), 0 0 40px -10px rgba(0,0,0,0.3)"
                  : "0 8px 30px -10px rgba(0,0,0,0.4)",
              }}
            >
              {!mediaErrors[card.id] ? (
                card.type === "video" ? (
                  <video
                    ref={(el) => {
                      videoRefs.current[card.id] = el;
                    }}
                    src={card.url}
                    className="absolute inset-0 h-full w-full object-cover"
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    draggable={false}
                    onError={() => handleMediaError(card.id)}
                  />
                ) : (
                  <img
                    src={card.url}
                    alt="UGC showcase"
                    className="absolute inset-0 h-full w-full object-cover"
                    draggable={false}
                    onError={() => handleMediaError(card.id)}
                  />
                )
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-emerald-900/40 to-primary/10">
                  <div className="text-center">
                    <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        className="text-primary/60"
                      >
                        <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                        <circle cx="9" cy="9" r="2" />
                        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                      </svg>
                    </div>
                    <span className="text-[10px] text-white/30">UGC Preview</span>
                  </div>
                </div>
              )}

              {/* Subtle bottom gradient for depth */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

              {/* AI Generated watermark */}
              <div className="absolute right-3 top-3 z-10">
                <span className="rounded bg-black/20 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wider text-white/30 backdrop-blur-sm">
                  AI Generated
                </span>
              </div>
            </div>
          </motion.div>
        );
      })}

      {/* Navigation dots */}
      <div className="absolute -bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-2">
        {showcaseCards.map((_, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === activeIndex ? "w-6 bg-primary" : "w-1.5 bg-white/20 hover:bg-white/40"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
