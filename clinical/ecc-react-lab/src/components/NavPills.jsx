export default function NavPills({ sections, active }) {
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      const headerOffset = 120;
      const top = el.getBoundingClientRect().top + window.scrollY - headerOffset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  return (
    <nav className="nav-pills" aria-label="Section navigation">
      <div className="nav-pills-inner">
        {sections.map((s) => (
          <button
            key={s.id}
            className={`nav-pill ${active === s.id ? 'active' : ''}`}
            onClick={() => scrollTo(s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
