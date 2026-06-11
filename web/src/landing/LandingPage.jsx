import { useSeo } from '@/lib/useSeo';
import { LandingNav } from './LandingNav';
import { Hero } from './Hero';
import { FeatureCards } from './FeatureCards';
import { VideoShowcase } from './VideoShowcase';
import { ReformaShowcase } from './ReformaShowcase';
import { TechFeatures } from './TechFeatures';
import { RoiCalculator } from './RoiCalculator';
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
  useSeo({
    title: 'decorar.ai — Virtual staging com IA para fotos de imóveis',
    description:
      'Mobilie ambientes vazios, limpe espaços ocupados e melhore a qualidade das fotos dos seus imóveis com IA — virtual staging em segundos. Experimente grátis.',
    path: '/',
  });

  return (
    <div className="min-h-screen bg-canvas font-sans text-lp-body antialiased">
      <LandingNav />
      <main>
        <Hero />
        <FeatureCards />
        <VideoShowcase />
        <ReformaShowcase />
        <TechFeatures />
        <HowItWorks />
        <Audience />
        <Comparison />
        <Differentials />
        <StatsProof />
        <RoiCalculator />
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
