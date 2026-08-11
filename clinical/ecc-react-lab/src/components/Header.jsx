export default function Header({ lang, setLang, t }) {
  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-title">
          {t.title}
          <small>{t.subtitle}</small>
        </div>
        <div className="lang-toggle" role="group" aria-label="Language toggle">
          <button
            className={lang === 'bm' ? 'active' : ''}
            onClick={() => setLang('bm')}
            aria-pressed={lang === 'bm'}
          >
            BM
          </button>
          <button
            className={lang === 'en' ? 'active' : ''}
            onClick={() => setLang('en')}
            aria-pressed={lang === 'en'}
          >
            EN
          </button>
        </div>
      </div>
    </header>
  );
}
