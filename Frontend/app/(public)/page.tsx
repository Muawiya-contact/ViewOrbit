import { FeaturesSection } from "@/components/landing/features";
import { LandingFooter } from "@/components/landing/footer";
import { HeroSection } from "@/components/landing/hero";
import { HowItWorksSection } from "@/components/landing/how-it-works";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <LandingFooter />
    </div>
  );
}
