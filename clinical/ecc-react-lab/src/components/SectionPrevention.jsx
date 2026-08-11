export default function SectionPrevention({ t }) {
  return (
    <section className="section" id="prevent">
      <div className="section-header">
        <span className="section-number">04</span>
        <h2 className="fd">{t.title}</h2>
        <p className="section-subtitle">{t.subtitle}</p>
      </div>

      <div className="card-grid">
        <div className="card">
          <h3>{t.diet.title}</h3>
          <p>{t.diet.text}</p>
        </div>
        <div className="card highlight-card">
          <h3>{t.ohe.title}</h3>
          <p>{t.ohe.text}</p>
        </div>
        <div className="card">
          <h3>{t.professional.title}</h3>
          <p>{t.professional.text}</p>
        </div>
      </div>

      <h3 style={{ margin: '26px 0 14px', fontFamily: 'var(--fd)', color: 'var(--brand)' }}>
        {t.recommendations[0].id.startsWith('Syor') ? 'Syor-Syor Utama' : 'Key Recommendations'}
      </h3>
      <div className="card-grid">
        {t.recommendations.map((rec, i) => (
          <div key={i} className="card rec-card">
            <span className="rec-id">{rec.level}</span>
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: '14px', lineHeight: 1.55 }}>{rec.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
