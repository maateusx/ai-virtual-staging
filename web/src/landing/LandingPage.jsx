import { LandingNav } from './LandingNav';
import { Hero } from './Hero';
import { FeatureCards } from './FeatureCards';
import { VideoShowcase } from './VideoShowcase';
import { TechFeatures } from './TechFeatures';
import { HowItWorks } from './HowItWorks';
import { Audience } from './Audience';
import { Comparison } from './Comparison';
import { Differentials } from './Differentials';
import { StatsProof } from './StatsProof';
import { Pricing } from './Pricing';
import { Testimonials } from './Testimonials';
import { TrustPrivacy } from './TrustPrivacy';
import { Faq } from './Faq';
import { TryDemo } from './TryDemo';
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
        <VideoShowcase />
        <TechFeatures />
        <HowItWorks />
        <Audience />
        <Comparison />
        <Differentials />
        <StatsProof />
        <Pricing />
        <Testimonials />
        <TrustPrivacy />
        <Faq />
        <TryDemo />
        <CtaBand />
      </main>
      <LandingFooter />
    </div>
  );
}
