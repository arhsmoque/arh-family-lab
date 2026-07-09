import { useState, useRef, useEffect, useCallback } from 'react';

const STAGE_KEYS = ['sound', 'plaque', 'white', 'brown', 'cavity'];
const SURFACES = ['gingival', 'smooth', 'proximal', 'occlusal'];

export default function ToothLab({ t }) {
  const [tooth, setTooth] = useState('incisor');
  const [stage, setStage] = useState('sound');
  const [surface, setSurface] = useState('gingival');
  const [rotX, setRotX] = useState(0);
  const [rotY, setRotY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [auto, setAuto] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const sceneRef = useRef(null);

  const stageData = {
    sound: t.progression.stages[0],
    plaque: t.progression.stages[1],
    white: t.progression.stages[2],
    brown: t.progression.stages[3],
    cavity: t.progression.stages[4],
  };

  useEffect(() => {
    if (!auto) return;
    const timer = setInterval(() => {
      setStage((prev) => {
        const idx = STAGE_KEYS.indexOf(prev);
        return STAGE_KEYS[(idx + 1) % STAGE_KEYS.length];
      });
    }, 1800);
    return () => clearInterval(timer);
  }, [auto]);

  const handlePointerDown = useCallback((e) => {
    setIsDragging(true);
    lastPos.current = { x: e.clientX, y: e.clientY };
    sceneRef.current?.setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e) => {
    if (!isDragging) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    setRotY((y) => y + dx * 0.5);
    setRotX((x) => Math.max(-70, Math.min(70, x - dy * 0.5)));
    lastPos.current = { x: e.clientX, y: e.clientY };
  }, [isDragging]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const setView = (x, y) => {
    setRotX(x);
    setRotY(y);
  };

  const reset = () => {
    setStage('sound');
    setSurface('gingival');
    setRotX(0);
    setRotY(0);
    setAuto(false);
  };

  return (
    <div className="lab-shell">
      <div className="lab-header">
        <div>
          <h3 className="fd">{t.title}</h3>
          <p>{t.subtitle}</p>
        </div>
        <span className="lab-stage-label">{stageData[stage].label}</span>
      </div>

      <div className="lab-grid">
        <div>
          <div
            className="lab-scene"
            ref={sceneRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            <div
              className={`lab-tooth-wrapper stage-${stage}`}
              style={{ transform: `rotateX(${rotX}deg) rotateY(${rotY}deg)` }}
            >
              <div className="lab-gum" />
              <div className={`lab-tooth ${tooth}`}>
                <div className={`lab-surface gingival ${surface === 'gingival' ? 'active' : ''}`} />
                <div className={`lab-surface smooth ${surface === 'smooth' ? 'active' : ''}`} />
                <div className={`lab-surface proximal ${surface === 'proximal' ? 'active' : ''}`} />
                <div className={`lab-surface occlusal ${surface === 'occlusal' ? 'active' : ''}`} />
                <div className="lab-lesion plaque" />
                <div className="lab-lesion white-spot" />
                <div className="lab-lesion brown-spot" />
                <div className="lab-lesion cavity" />
              </div>
            </div>
          </div>

          <div className="lab-controls" style={{ justifyContent: 'center' }}>
            {Object.entries(t.toothTypes).map(([key, label]) => (
              <button
                key={key}
                className={tooth === key ? 'active' : ''}
                onClick={() => setTooth(key)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="lab-controls" style={{ justifyContent: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '12px' }}>
            <button className={rotX === 0 && rotY === 0 ? 'active' : ''} onClick={() => setView(0, 0)}>Facial</button>
            <button className={rotX === -55 ? 'active' : ''} onClick={() => setView(-55, 0)}>Occlusal</button>
            <button className={rotY === 85 ? 'active' : ''} onClick={() => setView(0, 85)}>Proximal</button>
            <button onClick={reset}>↻ {t.reset}</button>
            <button
              className={auto ? 'active' : ''}
              onClick={() => setAuto((a) => !a)}
            >
              {auto ? `⏹ ${t.stop}` : `▶ ${t.auto}`}
            </button>
          </div>
        </div>

        <div className="lab-info">
          <div style={{ marginBottom: '22px' }}>
            <h4>{/* Clinical progression */}Clinical progression / Perkembangan klinikal</h4>
            <div className="stage-title">{stageData[stage].label}</div>
            <p>{stageData[stage].desc}</p>
            <div className="lab-note">{stageData[stage].note}</div>

            <div className="lab-controls">
              {STAGE_KEYS.map((k) => (
                <button
                  key={k}
                  className={stage === k ? 'active' : ''}
                  onClick={() => setStage(k)}
                >
                  {stageData[k].label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4>{t.surface.title}</h4>
            <p>{t.surface.detail[surface]}</p>
            <div className="lab-controls">
              {SURFACES.map((s) => (
                <button
                  key={s}
                  className={surface === s ? 'active' : ''}
                  onClick={() => setSurface(s)}
                >
                  {t.surface.options[s]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
