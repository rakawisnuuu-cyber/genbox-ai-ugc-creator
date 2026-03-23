import { type ReactNode } from "react";

interface MarqueeStripProps {
  children: ReactNode;
  speed?: number;
  direction?: "left" | "right";
  className?: string;
}

const MarqueeStrip = ({ children, speed = 30, direction = "left", className = "" }: MarqueeStripProps) => {
  const animationStyle = {
    animationDuration: `${speed}s`,
    animationDirection: direction === "right" ? "reverse" : "normal",
  };

  return (
    <div className={`overflow-hidden ${className}`}>
      <div className="animate-marquee flex w-max items-center gap-8" style={animationStyle}>
        {children}
        {children}
      </div>
    </div>
  );
};

export default MarqueeStrip;
