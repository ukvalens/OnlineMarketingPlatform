import Layout from '../../components/layout/Layout';
import './Legal.css';

export function PrivacyPage() {
  return (
    <Layout>
      <div className="page-hero"><div className="container"><h1 className="section-title">Privacy Policy</h1><p className="section-subtitle">Last updated: July 2025</p></div></div>
      <section className="section"><div className="container"><div className="legal__body">
        <h2>1. Information We Collect</h2>
        <p>We collect information you provide directly to us, such as your name, email address, phone number, company name, and payment information when you register or place an order.</p>

        <h2>2. How We Use Your Information</h2>
        <p>We use the information we collect to provide, maintain, and improve our services, process transactions, send notifications about your orders, and communicate with you about our services.</p>

        <h2>3. Data Security</h2>
        <p>We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. Passwords are stored using bcrypt hashing. Payment data is never stored directly — we rely on PCI-compliant gateway tokens.</p>

        <h2>4. Data Sharing</h2>
        <p>We do not sell, trade, or rent your personal information to third parties. We may share information with trusted service providers who assist us in operating our platform, subject to confidentiality agreements.</p>

        <h2>5. Your Rights</h2>
        <p>You have the right to access, correct, or delete your personal data. To exercise these rights, contact us at <a href="mailto:privacy@digitalmarketing.rw">privacy@digitalmarketing.rw</a>.</p>

        <h2>6. Cookies</h2>
        <p>We use cookies to enhance your experience on our platform. You can control cookie settings through your browser preferences.</p>

        <h2>7. Compliance</h2>
        <p>This policy complies with applicable Rwandan data protection regulations. We are committed to protecting your privacy in accordance with the Law No. 058/2021 of 13/10/2021 relating to the protection of personal data and privacy in Rwanda.</p>

        <h2>8. Contact</h2>
        <p>For privacy-related questions, contact us at <a href="mailto:privacy@digitalmarketing.rw">privacy@digitalmarketing.rw</a> or call +250 780 000 000.</p>
      </div></div></section>
    </Layout>
  );
}

export function TermsPage() {
  return (
    <Layout>
      <div className="page-hero"><div className="container"><h1 className="section-title">Terms of Service</h1><p className="section-subtitle">Last updated: July 2025</p></div></div>
      <section className="section"><div className="container"><div className="legal__body">
        <h2>1. Acceptance of Terms</h2>
        <p>By accessing and using the DigitalMarkRW platform, you accept and agree to be bound by these Terms of Service. If you do not agree, please do not use our services.</p>

        <h2>2. Services</h2>
        <p>DigitalMarkRW provides digital marketing services including social media marketing, digital advertising, graphic design, branding, and business consulting. Service details, pricing, and deliverables are defined per order agreement.</p>

        <h2>3. Client Responsibilities</h2>
        <p>Clients are responsible for providing accurate information, timely feedback on deliverables, and payment of invoices by the due date. Clients must not use our services for illegal or unethical purposes.</p>

        <h2>4. Payment Terms</h2>
        <p>Invoices are due within 7 days of issuance unless otherwise agreed. We accept MTN MoMo, Airtel Money, and card payments in RWF. Late payments may result in service suspension.</p>

        <h2>5. Intellectual Property</h2>
        <p>Upon full payment, clients receive ownership of deliverables created specifically for them. DigitalMarkRW retains the right to showcase completed work in our portfolio unless otherwise agreed in writing.</p>

        <h2>6. Revisions</h2>
        <p>The number of revisions included depends on the selected package. Additional revisions beyond the package limit will be billed at our standard hourly rate.</p>

        <h2>7. Cancellation</h2>
        <p>Orders may be cancelled before work begins for a full refund. Cancellations after work has started are subject to a fee based on work completed.</p>

        <h2>8. Limitation of Liability</h2>
        <p>DigitalMarkRW is not liable for indirect, incidental, or consequential damages arising from the use of our services. Our total liability shall not exceed the amount paid for the specific service in question.</p>

        <h2>9. Governing Law</h2>
        <p>These terms are governed by the laws of the Republic of Rwanda. Any disputes shall be resolved in the courts of Kigali, Rwanda.</p>

        <h2>10. Contact</h2>
        <p>For questions about these terms, contact us at <a href="mailto:legal@digitalmarketing.rw">legal@digitalmarketing.rw</a>.</p>
      </div></div></section>
    </Layout>
  );
}
