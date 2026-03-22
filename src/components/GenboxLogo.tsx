interface GenboxLogoProps {
  size?: number;
  variant?: "full" | "icon";
  className?: string;
}

const GenboxLogo = ({ size = 28, variant = "full", className = "" }: GenboxLogoProps) => {
  const iconSize = size;
  const textSize = size * 0.5;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Logomark — abstract cube/box */}
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        {/* Back face — darker */}
        <path
          d="M8 6L16 2L24 6L24 14L16 18L8 14Z"
          fill="hsl(var(--primary) / 0.15)"
          stroke="hsl(var(--primary) / 0.3)"
          strokeWidth="0.5"
        />
        {/* Left face */}
        <path
          d="M8 14L16 18L16 26L8 22Z"
          fill="hsl(var(--primary) / 0.35)"
          stroke="hsl(var(--primary) / 0.4)"
          strokeWidth="0.5"
        />
        {/* Right face — brightest, primary lime */}
        <path
          d="M16 18L24 14L24 22L16 26Z"
          fill="hsl(var(--primary))"
          stroke="hsl(var(--primary))"
          strokeWidth="0.5"
        />
        {/* Top highlight edge */}
        <path
          d="M8 6L16 10L24 6"
          stroke="hsl(var(--primary) / 0.5)"
          strokeWidth="0.75"
          fill="none"
        />
        {/* Center vertical edge */}
        <path
          d="M16 10L16 18"
          stroke="hsl(var(--primary) / 0.6)"
          strokeWidth="0.75"
        />
      </svg>

      {/* Wordmark */}
      {variant === "full" && (
        <span
          className="font-satoshi font-bold uppercase tracking-[0.15em] text-foreground"
          style={{ fontSize: `${textSize}px`, lineHeight: 1 }}
        >
          GENBOX
        </span>
      )}
    </div>
  );
};

export default GenboxLogo;
