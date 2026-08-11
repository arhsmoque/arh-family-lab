export default function SectionIntro({ t }) {
  return (
    <section className="section" id="intro">
      <div className="section-header">
        <span className="section-number">01</span>
        <h2 className="fd">{t.title}</h2>
        <p className="section-subtitle">{t.subtitle}</p>
      </div>

      <div className="card-grid">
        <div className="card highlight-card">
          <h3>{t.definition.title}</h3>
          <p>{t.definition.text}</p>
        </div>

        <div className="card">
          <h3>{t.severe.title}</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', color: 'var(--muted)' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--line)' }}>
                <th style={{ textAlign: 'left', padding: '8px 0', color: 'var(--brand)' }}>{/* Age */}Umur</th>
                <th style={{ textAlign: 'left', padding: '8px 0', color: 'var(--brand)' }}>{/* Criteria */}Kriteria / Criteria</th>
              </tr>
            </thead>
            <tbody>
              {t.severe.rows.map((r, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                  <td style={{ padding: '8px 0', fontWeight: 600 }}>{r.age}</td>
                  <td style={{ padding: '8px 0' }}>{r.criteria}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h3>{t.epidemiology.title}</h3>
          <p>{t.epidemiology.text}</p>
          <div className="stat-row">
            {t.epidemiology.stats.map((s, i) => (
              <div key={i} className="stat">
                <b>{s.value}</b>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
