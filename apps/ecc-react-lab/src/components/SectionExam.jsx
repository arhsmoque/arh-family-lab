export default function SectionExam({ t }) {
  return (
    <section className="section" id="exam">
      <div className="section-header">
        <span className="section-number">03</span>
        <h2 className="fd">{t.title}</h2>
        <p className="section-subtitle">{t.subtitle}</p>
      </div>

      <div className="card-grid">
        {t.methods.map((m, i) => (
          <div key={i} className="card">
            <span className="pill" style={{ marginBottom: '10px' }}>{m.tag}</span>
            <h3>{m.title}</h3>
            <p>{m.text}</p>
          </div>
        ))}
        <div className="card highlight-card">
          <h3>{/* Key Consideration */}Perhatian Penting / Key Consideration</h3>
          <p>{t.keyConsideration}</p>
        </div>
      </div>
    </section>
  );
}
