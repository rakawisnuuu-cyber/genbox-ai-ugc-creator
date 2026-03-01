import AnimatedBackground from "@/components/AnimatedBackground";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import DibuatUntukSection from "@/components/DibuatUntukSection";
import FiturSection from "@/components/FiturSection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AnimatedBackground />
      <Navbar />
      <HeroSection />
      <DibuatUntukSection />
      <FiturSection />
    </div>
  );
};

export default Index;
