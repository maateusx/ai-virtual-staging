import { LandingNav } from './LandingNav';
import { Hero } from './Hero';
import { FeatureCards } from './FeatureCards';
import { HowItWorks } from './HowItWorks';
import { Differentials } from './Differentials';
import { StatsProof } from './StatsProof';
import { Faq } from './Faq';
import { CtaBand } from './CtaBand';
import { LandingFooter } from './LandingFooter';

// Marketing landing page — warm cream design system (see docs/design.md).
// Self-contained: cream canvas, own nav/footer, Inter display type. Does not
// use the app's Apple-style UI (components/ui/*) or NavBar.
export function LandingPage() {
  return (
    <div className="min-h-screen bg-canvas font-sans text-lp-body antialiased">
      <LandingNav />
      <main>
        <Hero />
        <FeatureCards />
        <HowItWorks />
        <Differentials />
        <StatsProof />
        <Faq />
        <CtaBand />
      </main>
      <LandingFooter />
    </div>
  );
}
