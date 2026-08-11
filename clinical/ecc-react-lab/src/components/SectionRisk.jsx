export default function SectionRisk({ t }) {
  return (
    <section className="section" id="risk">
      <div className="section-header">
        <span className="section-number">02</span>
        <h2 className="fd">{t.title}</h2>
        <p className="section-subtitle">{t.subtitle}</p>
      </div>

      <div className="card-grid">
        <div className="card">
          <h3>{t.riskTitle}</h3>
          <ul>
            {t.risks.map((r, i) => (
              <li key={i}>
                <strong style={{ color: 'var(--brand)' }}>{r.title}</strong> — {r.detail}
              </li>
            ))}
          </ul>
        </div>

        <div className="card highlight-card">
          <h3>{t.protectiveTitle}</h3>
          <ul>
            {t.protective.map((p, i) => (
              <li key={i}>
                <strong style={{ color: 'var(--accent)' }}>{p.title}</strong> — {p.detail}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
