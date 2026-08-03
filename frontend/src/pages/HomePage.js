import { HelmetProvider, Helmet } from 'react-helmet-async';
import Layout from '../components/layout/Layout';
import Hero from '../components/ui/Hero';
import ServicesSection from '../components/ui/ServicesSection';
import WhyUs from '../components/ui/WhyUs';
import PortfolioSection from '../components/ui/PortfolioSection';
import Testimonials from '../components/ui/Testimonials';
import BlogSection from '../components/ui/BlogSection';
import CTASection from '../components/ui/CTASection';

export default function HomePage() {
  return (
    <HelmetProvider>
      <Helmet>
        <title>DigitalMarkRW — Rwanda's Digital Marketing Platform</title>
        <meta name="description" content="Grow your business online in Rwanda with social media marketing, digital advertising, branding, and web promotion services." />
      </Helmet>
      <Layout>
        <Hero />
        <ServicesSection />
        <WhyUs />
        <PortfolioSection />
        <Testimonials />
        <BlogSection />
        <CTASection />
      </Layout>
    </HelmetProvider>
  );
}
