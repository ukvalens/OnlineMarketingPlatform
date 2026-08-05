import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBullseye, faChartLine, faUsers, faTrophy, faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { useLang } from '../../context/LangContext';
import './WhyUs.css';

export default function WhyUs() {
  const { t } = useLang();

  const FEATURES = [
    { icon: <FontAwesomeIcon icon={faBullseye}   style={{ fontSize: 22 }} />, titleKey: 'whyus_feat_results', descKey: 'whyus_feat_results_desc' },
    { icon: <FontAwesomeIcon icon={faChartLine}  style={{ fontSize: 22 }} />, titleKey: 'whyus_feat_data',    descKey: 'whyus_feat_data_desc' },
    { icon: <FontAwesomeIcon icon={faUsers}      style={{ fontSize: 22 }} />, titleKey: 'whyus_feat_team',    descKey: 'whyus_feat_team_desc' },
    { icon: <FontAwesomeIcon icon={faTrophy}     style={{ fontSize: 22 }} />, titleKey: 'whyus_feat_local',   descKey: 'whyus_feat_local_desc' },
  ];

  const CHECKS = ['whyus_check_1', 'whyus_check_2', 'whyus_check_3', 'whyus_check_4'];

  const PROCESS = [
    { step: '01', titleKey: 'whyus_step1_title', descKey: 'whyus_step1_desc' },
    { step: '02', titleKey: 'whyus_step2_title', descKey: 'whyus_step2_desc' },
    { step: '03', titleKey: 'whyus_step3_title', descKey: 'whyus_step3_desc' },
    { step: '04', titleKey: 'whyus_step4_title', descKey: 'whyus_step4_desc' },
  ];

  return (
    <section className="section whyus">
      <div className="container">
        <div className="whyus__grid">
          <div className="whyus__left">
            <span className="section-label">{t('whyus_label')}</span>
            <h2 className="section-title">{t('whyus_title')}</h2>
            <p className="section-subtitle">{t('whyus_subtitle')}</p>

            <ul className="whyus__checklist">
              {CHECKS.map((key) => (
                <li key={key}>
                  <FontAwesomeIcon icon={faCircleCheck} style={{ fontSize: 18 }} />
                  {t(key)}
                </li>
              ))}
            </ul>
          </div>

          <div className="whyus__features">
            {FEATURES.map(({ icon, titleKey, descKey }) => (
              <div key={titleKey} className="whyus__feature card">
                <div className="whyus__feature-icon">{icon}</div>
                <div>
                  <h4>{t(titleKey)}</h4>
                  <p>{t(descKey)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Process */}
        <div className="whyus__process">
          <div className="text-center" style={{ marginBottom: '48px' }}>
            <span className="section-label">{t('whyus_process_label')}</span>
            <h2 className="section-title">{t('whyus_process_title')}</h2>
          </div>
          <div className="whyus__steps">
            {PROCESS.map(({ step, titleKey, descKey }, i) => (
              <div key={step} className="whyus__step">
                <div className="whyus__step-num">{step}</div>
                {i < PROCESS.length - 1 && <div className="whyus__step-line" />}
                <h4>{t(titleKey)}</h4>
                <p>{t(descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
