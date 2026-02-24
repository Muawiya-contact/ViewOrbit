import { LandingFooter } from "@/components/landing/footer";
import { LandingHero } from "@/components/landing/hero";
import { LandingHowItWorks } from "@/components/landing/HowItWorks";
import { LandingNavbar } from "@/components/landing/Navbar";
import { LandingPlatforms } from "@/components/landing/Platforms";
import { LandingRewards } from "@/components/landing/Rewards";
import { LandingTaskWall } from "@/components/landing/TaskWall";
import { PartnerSection } from "@/components/landing/PartnerSection";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0A192F]">
      <LandingNavbar />
      <LandingHero />
      <LandingTaskWall />
      <LandingHowItWorks />
      <LandingPlatforms />
      <LandingRewards />
      <PartnerSection />
      <LandingFooter />
    </div>
  );
}
