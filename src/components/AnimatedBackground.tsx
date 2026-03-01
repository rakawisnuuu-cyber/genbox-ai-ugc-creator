const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <div
        className="absolute top-1/4 -left-32 w-64 h-64 rounded-full bg-primary/5 blur-3xl animate-float"
      />
      <div
        className="absolute top-2/3 -right-32 w-80 h-80 rounded-full bg-primary/5 blur-3xl animate-float"
        style={{ animationDelay: "2s" }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-primary/3 blur-3xl animate-float"
        style={{ animationDelay: "4s" }}
      />
    </div>
  );
};

export default AnimatedBackground;
