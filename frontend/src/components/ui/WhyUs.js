import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBullseye, faChartLine, faUsers, faTrophy, faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import './WhyUs.css';

const FEATURES = [
  { icon: <FontAwesomeIcon icon={faBullseye} style={{ fontSize: 22 }} />, title: 'Results-Driven', desc: 'Every campaign is built around measurable KPIs — reach, leads, and conversions that matter to your business.' },
  { icon: <FontAwesomeIcon icon={faChartLine} style={{ fontSize: 22 }} />, title: 'Data-Backed Strategy', desc: 'We use analytics and market insights to craft strategies that outperform the competition.' },
  { icon: <FontAwesomeIcon icon={faUsers} style={{ fontSize: 22 }} />, title: 'Dedicated Team', desc: 'You get a dedicated account manager and creative team focused entirely on your brand.' },
  { icon: <FontAwesomeIcon icon={faTrophy} style={{ fontSize: 22 }} />, title: 'Local Expertise', desc: 'Deep understanding of the Rwandan market, consumer behavior, and digital landscape.' },
];

const PROCESS = [
  { step: '01', title: 'Discovery Call', desc: 'We learn about your business, goals, and target audience.' },
  { step: '02', title: 'Strategy & Quote', desc: 'We craft a tailored plan and send you a transparent quote.' },
  { step: '03', title: 'Execution', desc: 'Our team gets to work — creating, launching, and managing your campaigns.' },
  { step: '04', title: 'Report & Grow', desc: 'Regular reports keep you informed. We optimize continuously.' },
];

export default function WhyUs() {
  return (
    <section className="section whyus">
      <div className="container">
        <div className="whyus__grid">
          <div className="whyus__left">
            <span className="section-label">Why Choose Us</span>
            <h2 className="section-title">We Don't Just Market.<br />We Deliver Results.</h2>
            <p className="section-subtitle">
              Partnering with us means getting a team that treats your business like their own — with full transparency, creativity, and accountability.
            </p>

            <ul className="whyus__checklist">
              {['No hidden fees — clear pricing in RWF', 'Mobile money payments accepted', 'Bilingual support (English & Kinyarwanda)', 'Weekly progress reports'].map((item) => (
                <li key={item}><FontAwesomeIcon icon={faCircleCheck} style={{ fontSize: 18 }} />{item}</li>
              ))}
            </ul>
          </div>

          <div className="whyus__features">
            {FEATURES.map(({ icon, title, desc }) => (
              <div key={title} className="whyus__feature card">
                <div className="whyus__feature-icon">{icon}</div>
                <div>
                  <h4>{title}</h4>
                  <p>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Process */}
        <div className="whyus__process">
          <div className="text-center" style={{ marginBottom: '48px' }}>
            <span className="section-label">How It Works</span>
            <h2 className="section-title">From Idea to Impact in 4 Steps</h2>
          </div>
          <div className="whyus__steps">
            {PROCESS.map(({ step, title, desc }, i) => (
              <div key={step} className="whyus__step">
                <div className="whyus__step-num">{step}</div>
                {i < PROCESS.length - 1 && <div className="whyus__step-line" />}
                <h4>{title}</h4>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
