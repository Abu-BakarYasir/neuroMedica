import { Navigation } from "@/components/landing/navigation";
import { HeroSection } from "@/components/landing/hero-section";
import { ProblemSolution } from "@/components/landing/problem-solution";
import { CapabilitiesGrid } from "@/components/landing/capabilities-grid";
import { HowItWorks } from "@/components/landing/how-it-works";
import { ExplainabilityTrust } from "@/components/landing/explainability-trust";
import { TargetAudience } from "@/components/landing/target-audience";
import { UseCases } from "@/components/landing/use-cases";
import { ReportPreview } from "@/components/landing/report-preview";
import { EthicsPrivacy } from "@/components/landing/ethics-privacy";
import { Technology } from "@/components/landing/technology";
import { Roadmap } from "@/components/landing/roadmap";
import { FinalCta } from "@/components/landing/final-cta";
import { Footer } from "@/components/landing/footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <Navigation />
      <HeroSection />
      <ProblemSolution />
      <CapabilitiesGrid />
      <HowItWorks />
      <ExplainabilityTrust />
      <TargetAudience />
      <UseCases />
      <ReportPreview />
      <EthicsPrivacy />
      <Technology />
      <Roadmap />
      <FinalCta />
      <Footer />
    </main>
  );
}
