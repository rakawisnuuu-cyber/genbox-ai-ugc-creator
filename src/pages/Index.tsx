import AnimatedBackground from "@/components/AnimatedBackground";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import DibuatUntukSection from "@/components/DibuatUntukSection";
import FiturSection from "@/components/FiturSection";
import CaraKerjaSection from "@/components/CaraKerjaSection";

import HargaSection from "@/components/HargaSection";
import ApiCostSection from "@/components/ApiCostSection";
import FAQSection from "@/components/FAQSection";
import FinalCTASection from "@/components/FinalCTASection";
import FooterSection from "@/components/FooterSection";
import TransactionPopup from "@/components/TransactionPopup";

const SectionDivider = () => (
  <div className="mx-auto max-w-5xl px-4">
    <div className="h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
  </div>
);

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AnimatedBackground />
      <Navbar />
      <HeroSection />
      <SectionDivider />
      <DibuatUntukSection />
      <SectionDivider />
      <FiturSection />
      <SectionDivider />
      <CaraKerjaSection />
      <SectionDivider />
      {/* HargaSection & FinalCTASection hidden during early access */}
      <ApiCostSection />
      <FooterSection />
    </div>
  );
};

export default Index;
