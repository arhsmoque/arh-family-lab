import { useState, useEffect, useRef } from 'react';
import { CONTENT } from './data/content';
import Header from './components/Header';
import NavPills from './components/NavPills';
import SectionIntro from './components/SectionIntro';
import SectionRisk from './components/SectionRisk';
import SectionExam from './components/SectionExam';
import SectionPrevention from './components/SectionPrevention';
import SectionTreatment from './components/SectionTreatment';
import SectionTakeHome from './components/SectionTakeHome';
import ToothLab from './components/ToothLab';
import MouthMap from './components/MouthMap';

function App() {
  const [lang, setLang] = useState('bm');
  const [activeSection, setActiveSection] = useState('intro');
  const t = CONTENT[lang];

  // Track active section on scroll
  useEffect(() => {
    const sections = ['intro', 'risk', 'exam', 'prevent', 'treat', 'home'];
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveSection(visible.target.id);
      },
      { rootMargin: '-40% 0px -50% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="batik-stripe">
      <Header lang={lang} setLang={setLang} t={t.header} />

      <header className="hero">
        <div className="hero-inner">
          <p className="hero-eyebrow">{t.hero.eyebrow}</p>
          <h1 className="fd">{t.hero.title}</h1>
          <p>{t.hero.subtitle}</p>
          <div className="hero-meta">
            {t.hero.meta.map((m) => (
              <span key={m} className="pill">{m}</span>
            ))}
          </div>
        </div>
      </header>

      <NavPills sections={t.nav} active={activeSection} />

      <main className="container">
        <SectionIntro t={t.intro} />

        <section className="section" id="lab">
          <ToothLab t={t.toothLab} />
        </section>

        <section className="section" id="map">
          <MouthMap t={t.mouthMap} />
        </section>

        <SectionRisk t={t.risk} />
        <SectionExam t={t.exam} />
        <SectionPrevention t={t.prevention} />
        <SectionTreatment t={t.treatment} />
        <SectionTakeHome t={t.home} />
      </main>

      <footer className="footer">
        <div className="footer-inner">
          <p>
            <strong>{lang === 'bm' ? 'Sumber' : 'Source'}:</strong>{' '}
            CPG Management of Early Childhood Caries · Dr. Nur Diyana Ramli · Klinik Pergigian Dato Keramat · Kementerian Kesihatan Malaysia.
          </p>
          <p>{lang === 'bm' ? 'Dibina untuk tujuan pengajaran klinikal.' : 'Built for clinical teaching purposes.'}</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
