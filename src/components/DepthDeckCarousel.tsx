import { useState, useEffect, useCallback } from "react";
import { motion, useMotionValue } from "framer-motion";

interface CardItem {
  id: number;
  gradient: string;
  label: string;
  category: string;
}

const cards: CardItem[] = [
  { id: 1, gradient: "from-emerald-600 to-teal-400", label: "Hijab Casual", category: "Skincare UGC" },
  { id: 2, gradient: "from-violet-600 to-purple-400", label: "Urban Trendy", category: "Fashion UGC" },
  { id: 3, gradient: "from-amber-500 to-orange-400", label: "Ibu Muda", category: "Food Review" },
  { id: 4, gradient: "from-cyan-500 to-sky-400", label: "Gen-Z Creator", category: "Tech Review" },
  { id: 5, gradient: "from-rose-500 to-pink-400", label: "Beauty Enthusiast", category: "Beauty UGC" },
  { id: 6, gradient: "from-indigo-500 to-blue-400", label: "Mahasiswa", category: "Lifestyle" },
  { id: 7, gradient: "from-fuchsia-500 to-pink-500", label: "Office Worker", category: "Productivity" },
];

interface DepthDeckCarouselProps {
  autoPlayInterval?: number;
}

export default function DepthDeckCarousel({ autoPlayInterval = 3000 }: DepthDeckCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const dragX = useMotionValue(0);

  const total = cards.length;

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
    };
  };

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ perspective: "1200px", height: "340px" }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {cards.map((card, index) => {
        const style = getCardStyle(index);

        return (
          <motion.div
            key={card.id}
            className="absolute cursor-grab active:cursor-grabbing"
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
              className={`relative h-full w-full overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${card.gradient}`}
              style={{
                boxShadow:
                  style.zIndex >= total - 1
                    ? "0 20px 60px -15px rgba(0,0,0,0.6), 0 0 40px -10px rgba(0,0,0,0.3)"
                    : "0 8px 30px -10px rgba(0,0,0,0.4)",
              }}
            >
              <div className="absolute inset-0 flex flex-col justify-end p-5">
                <span className="mb-1.5 w-fit rounded-lg border border-white/20 bg-black/30 px-2.5 py-1 text-[10px] font-medium text-white/80 backdrop-blur-sm">
                  {card.category}
                </span>
                <span className="text-sm font-semibold text-white">
                  {card.label}
                </span>
              </div>
            </div>
          </motion.div>
        );
      })}

      {/* Navigation dots */}
      <div className="absolute -bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-2">
        {cards.map((_, i) => (
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
