import { Navigation } from "@/components/landing/navigation";
import { HeroSection } from "@/components/landing/hero-section";
import { ProblemSolution } from "@/components/landing/problem-solution";
import { CapabilitiesGrid } from "@/components/landing/capabilities-grid";
import { HowItWorks } from "@/components/landing/how-it-works";
import { UseCases } from "@/components/landing/use-cases";
import { StatsSection } from "@/components/landing/stats-section";
import { SocialProof } from "@/components/landing/social-proof";
import { FinalCta } from "@/components/landing/final-cta";
import { Footer } from "@/components/landing/footer";
import { ChatbotWidget } from "@/components/chatbot/chatbot-widget";

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <Navigation />
      <HeroSection />
      <ProblemSolution />
      <CapabilitiesGrid />
      <HowItWorks />
      <StatsSection />
      <UseCases />
      <SocialProof />
      <FinalCta />
      <Footer />
      <ChatbotWidget />
    </main>
  );
}
