import { useState, useEffect, useCallback } from "react";
import { motion, useMotionValue } from "framer-motion";

interface ShowcaseCard {
  id: number;
  imageUrl: string;
  label: string;
  category: string;
  model: string;
}

const showcaseCards: ShowcaseCard[] = [
  { id: 1, imageUrl: "/showcase/ugc-skincare-hijab.jpg", label: "Hijab Casual", category: "Skincare", model: "nano-banana-pro" },
  { id: 2, imageUrl: "/showcase/ugc-fashion-urban.jpg", label: "Urban Trendy", category: "Fashion", model: "nano-banana-pro" },
  { id: 3, imageUrl: "/showcase/ugc-food-ibumuda.jpg", label: "Ibu Muda", category: "Makanan", model: "nano-banana-pro" },
  { id: 4, imageUrl: "/showcase/ugc-tech-genz.jpg", label: "Gen-Z Creator", category: "Elektronik", model: "nano-banana-pro" },
  { id: 5, imageUrl: "/showcase/ugc-beauty-enthusiast.jpg", label: "Beauty Enthusiast", category: "Makeup", model: "nano-banana-pro" },
  { id: 6, imageUrl: "/showcase/ugc-suplemen-gym.jpg", label: "Cowok Gym", category: "Suplemen", model: "nano-banana-pro" },
  { id: 7, imageUrl: "/showcase/ugc-household-pkk.jpg", label: "Ibu PKK", category: "Rumah Tangga", model: "nano-banana-pro" },
];

interface DepthDeckCarouselProps {
  autoPlayInterval?: number;
}

export default function DepthDeckCarousel({ autoPlayInterval = 3000 }: DepthDeckCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [imgErrors, setImgErrors] = useState<Record<number, boolean>>({});
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

  const handleDragEnd = (_: any, info: { offset: { x: number }; velocity: { x: number } }) => {
    setIsDragging(false);
    const threshold = 50;
    if (info.offset.x < -threshold || info.velocity.x < -500) {
      next();
    } else if (info.offset.x > threshold || info.velocity.x > 500) {
      prev();
    }
  };

  const getCardStyle = (index: number) => {
    let diff = index - activeIndex;
    if (diff > total / 2) diff -= total;
    if (diff < -total / 2) diff += total;

    const absD = Math.abs(diff);
    const isActive = diff === 0;

    return {
      x: diff * 180,
      scale: 1 - absD * 0.12,
      zIndex: total - absD,
      opacity: absD > 3 ? 0 : 1 - absD * 0.2,
      filter: isActive ? "blur(0px)" : `blur(${absD * 2}px)`,
      rotateY: diff * -4,
      isActive,
    };
  };

  const handleImgError = (id: number) => {
    setImgErrors((prev) => ({ ...prev, [id]: true }));
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
            style={{
              width: 200,
              height: 280,
              transformStyle: "preserve-3d",
            }}
            animate={{
              x: style.x,
              scale: style.scale,
              zIndex: style.zIndex,
              opacity: style.opacity,
              rotateY: style.rotateY,
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
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
              {/* Image or fallback */}
              {!imgErrors[card.id] && card.imageUrl ? (
                <img
                  src={card.imageUrl}
                  alt={`${card.label} - ${card.category} UGC`}
                  className="absolute inset-0 h-full w-full object-cover"
                  draggable={false}
                  onError={() => handleImgError(card.id)}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-emerald-900/40 to-primary/10">
                  <div className="text-center">
                    <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary/60">
                        <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                        <circle cx="9" cy="9" r="2" />
                        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                      </svg>
                    </div>
                    <span className="text-[10px] text-white/30">UGC Preview</span>
                  </div>
                </div>
              )}

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
              i === activeIndex
                ? "w-6 bg-primary"
                : "w-1.5 bg-white/20 hover:bg-white/40"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
