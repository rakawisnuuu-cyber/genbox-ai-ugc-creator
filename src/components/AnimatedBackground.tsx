const orbs = [
  { size: 350, top: '10%', left: '15%', duration: '22s', delay: '0s', opacity: 0.025 },
  { size: 400, top: '60%', left: '70%', duration: '28s', delay: '-5s', opacity: 0.02 },
  { size: 280, top: '30%', left: '80%', duration: '18s', delay: '-10s', opacity: 0.03 },
  { size: 320, top: '75%', left: '20%', duration: '25s', delay: '-8s', opacity: 0.02 },
  { size: 250, top: '45%', left: '50%', duration: '30s', delay: '-15s', opacity: 0.025 },
];

const AnimatedBackground = () => (
  <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
    {orbs.map((orb, i) => (
      <div
        key={i}
        className="absolute rounded-full blur-3xl"
        style={{
          width: orb.size,
          height: orb.size,
          top: orb.top,
          left: orb.left,
          background: `radial-gradient(circle, hsl(var(--primary) / ${orb.opacity}) 0%, transparent 70%)`,
          animation: `bg-orb-float ${orb.duration} ease-in-out infinite`,
          animationDelay: orb.delay,
        }}
      />
    ))}
  </div>
);

export default AnimatedBackground;
