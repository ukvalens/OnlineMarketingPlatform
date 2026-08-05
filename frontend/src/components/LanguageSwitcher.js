import { useLang } from '../context/LangContext';
import './LanguageSwitcher.css';

export default function LanguageSwitcher() {
  const { lang, setLang } = useLang();
  return (
    <div className="lang-switcher">
      <button
        className={`lang-btn${lang === 'en' ? ' active' : ''}`}
        onClick={() => setLang('en')}
        aria-label="English"
      >
        EN
      </button>
      <span className="lang-divider">|</span>
      <button
        className={`lang-btn${lang === 'rw' ? ' active' : ''}`}
        onClick={() => setLang('rw')}
        aria-label="Kinyarwanda"
      >
        RW
      </button>
    </div>
  );
}
