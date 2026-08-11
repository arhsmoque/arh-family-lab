export default function SectionTreatment({ t }) {
  return (
    <section className="section" id="treat">
      <div className="section-header">
        <span className="section-number">05</span>
        <h2 className="fd">{t.title}</h2>
        <p className="section-subtitle">{t.subtitle}</p>
      </div>

      <div className="card-grid">
        <div className="card highlight-card">
          <h3>{t.nonInvasive.title}</h3>
          <p>{t.nonInvasive.for}</p>
          <ul>
            {t.nonInvasive.items.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="card">
          <h3>{t.invasive.title}</h3>
          <p>{t.invasive.for}</p>
          <ul>
            {t.invasive.items.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
