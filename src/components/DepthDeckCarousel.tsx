import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";

interface ShowcaseCard {
  id: number;
  videoId: string;
}

const showcaseCards: ShowcaseCard[] = [
  { id: 1, videoId: "2eu2OX_py3c" },
  { id: 2, videoId: "2eu2OX_py3c" }, // Add more unique IDs later
  { id: 3, videoId: "2eu2OX_py3c" },
];

interface DepthDeckCarouselProps {
  autoPlayInterval?: number;
}

export default function DepthDeckCarousel({ autoPlayInterval = 5000 }: DepthDeckCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

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

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ perspective: "1200px", height: "340px" }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {showcaseCards.map((card, index) => {
        const style = getCardStyle(index);
        const isActive = style.isActive;

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
                boxShadow: isActive
                  ? "0 20px 60px -15px rgba(0,0,0,0.6), 0 0 40px -10px rgba(0,0,0,0.3)"
                  : "0 8px 30px -10px rgba(0,0,0,0.4)",
              }}
            >
              {isActive ? (
                <iframe
                  src={`https://www.youtube.com/embed/${card.videoId}?autoplay=1&mute=1&loop=1&playlist=${card.videoId}&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1`}
                  className="absolute inset-0 h-full w-full object-cover"
                  style={{ border: "none" }}
                  allow="autoplay; encrypted-media"
                  loading="lazy"
                  title="UGC showcase"
                />
              ) : (
                <img
                  src={`https://img.youtube.com/vi/${card.videoId}/0.jpg`}
                  alt="UGC showcase"
                  className="absolute inset-0 h-full w-full object-cover"
                  draggable={false}
                  loading="lazy"
                />
              )}

              {/* Subtle bottom gradient for depth */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

              {/* AI Generated watermark */}
              <div className="absolute right-3 top-3 z-10 pointer-events-none">
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
