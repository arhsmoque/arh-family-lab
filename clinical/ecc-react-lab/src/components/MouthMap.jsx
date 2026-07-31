import { useState, useMemo } from 'react';
import { Odontogram } from 'react-odontogram';
import 'react-odontogram/style.css';

const STAGES = [
  { key: 'sound', label: 'sound', fill: '#c6ccf8', outline: '#3e5edc' },
  { key: 'white', label: 'white', fill: '#fef9c3', outline: '#ca8a04' },
  { key: 'brown', label: 'brown', fill: '#d4a574', outline: '#92400e' },
  { key: 'cavity', label: 'cavity', fill: '#9f392f', outline: '#7f1d1d' },
  { key: 'filled', label: 'filled', fill: '#60a5fa', outline: '#1d4ed8' },
  { key: 'missing', label: 'missing', fill: '#94a3b8', outline: '#475569' },
];

export default function MouthMap({ t }) {
  const [mode, setMode] = useState('white');
  const [marks, setMarks] = useState({});

  const conditions = useMemo(() => {
    const groups = {};
    for (const [toothId, stageKey] of Object.entries(marks)) {
      const stage = STAGES.find((s) => s.key === stageKey);
      if (!stage) continue;
      if (!groups[stageKey]) {
        groups[stageKey] = {
          label: t.legend[stageKey] || stage.label,
          teeth: [],
          fillColor: stage.fill,
          outlineColor: stage.outline,
        };
      }
      groups[stageKey].teeth.push(toothId);
    }
    return Object.values(groups);
  }, [marks, t.legend]);

  const handleChange = (selected) => {
    const ids = selected.map((t) => t.id);
    setMarks((prev) => {
      const next = { ...prev };
      for (const id of ids) {
        if (prev[id] === mode) {
          delete next[id];
        } else {
          next[id] = mode;
        }
      }
      return next;
    });
  };

  const reset = () => setMarks({});

  const selectedList = Object.entries(marks).map(([id, stageKey]) => ({
    id,
    label: t.legend[stageKey] || STAGES.find((s) => s.key === stageKey)?.label || stageKey,
  }));

  return (
    <div className="map-shell">
      <h3 className="fd">{t.title}</h3>
      <p>{t.subtitle}</p>

      <div className="map-grid">
        <div>
          <p style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '10px' }}>{t.modeTitle}</p>
          <div style={{ maxWidth: '420px', margin: '0 auto' }}>
            <Odontogram
              onChange={handleChange}
              maxTeeth={5}
              showHalf="upper"
              layout="circle"
              notation="FDI"
              showLabels
              teethConditions={conditions}
              tooltip={{
                content: (payload) => (
                  <div style={{ minWidth: 120 }}>
                    <strong>{payload?.notations.fdi}</strong>
                    <div style={{ fontSize: 12 }}>{payload?.type}</div>
                  </div>
                ),
              }}
            />
          </div>

          <div className="map-legend">
            {STAGES.map((s) => (
              <button
                key={s.key}
                className={mode === s.key ? 'active' : ''}
                onClick={() => setMode(s.key)}
              >
                <span className="legend-dot" style={{ background: s.fill, border: `2px solid ${s.outline}` }} />
                {t.legend[s.key] || s.label}
              </button>
            ))}
          </div>

          <div className="map-actions">
            <button onClick={reset}>{t.reset}</button>
          </div>
        </div>

        <div className="map-panel">
          <h4>{t.selected}</h4>
          {selectedList.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: '14px', margin: 0 }}>{t.none}</p>
          ) : (
            <ul>
              {selectedList.map((item) => (
                <li key={item.id}>
                  <strong>{item.id.replace('teeth-', '')}</strong> — {item.label}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
