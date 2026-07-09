export default function SectionTakeHome({ t }) {
  return (
    <section className="section" id="home">
      <div className="section-header">
        <span className="section-number">06</span>
        <h2 className="fd">{t.title}</h2>
        <p className="section-subtitle">{t.subtitle}</p>
      </div>

      <div className="card-grid">
        <div className="card">
          <h3>{t.officer.title}</h3>
          <ul>
            {t.officer.items.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="card highlight-card">
          <h3>{t.cra.title}</h3>
          <p>{t.cra.text}</p>
          <div className="stat-row" style={{ marginTop: '16px' }}>
            {t.cra.intervals.map((int, i) => (
              <div key={i} className="stat">
                <b>{int.interval}</b>
                <span>{int.risk}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ borderColor: 'var(--accent)', background: 'linear-gradient(145deg,#f5fbf9,#fff)' }}>
          <h3 style={{ color: 'var(--accent)' }}>{/* Remember */}Ingat / Remember</h3>
          <p style={{ fontStyle: 'italic' }}>{t.reminder}</p>
        </div>
      </div>
    </section>
  );
}
