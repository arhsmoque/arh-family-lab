import { useEffect, useMemo, useReducer } from 'react'

const phases = ['lobby', 'roles', 'recognition', 'activation', 'compressions', 'aed', 'debrief']

const copy = {
  bm: {
    lab: 'CPR Scenario Lab v1',
    strap: 'Satu bilik. Empat peranan. Satu rantaian.',
    intro: 'Latihan keputusan untuk komuniti — dipandu fasilitator dan diikuti latihan manikin.',
    start: 'Mulakan latihan',
    rolesTitle: 'Agihkan empat peranan',
    rolesLead: 'Berikan satu kad kepada setiap peserta. Apabila nama peranan muncul, serahkan peranti atau beri ruang kepada orang itu untuk bertindak.',
    ready: 'Peranan sudah bersedia',
    back: 'Kembali',
    continue: 'Teruskan',
    reset: 'Mula semula',
    reveal: 'Lihat sebab',
    choose: 'Pilih tindakan',
    recognitionTitle: 'Mangsa rebah dan tidak responsif',
    recognitionLead: 'Mangsa tercungap-cungap. Apakah maksud keadaan ini?',
    recognitionChoices: ['Tunggu sehingga nafas berhenti sepenuhnya', 'Anggap nafas tidak normal dan aktifkan bantuan', 'Beri air dan dudukkan mangsa'],
    recognitionReason: 'Nafas tercungap-cungap bukan nafas normal. Jangan tunggu — aktifkan bantuan dan mulakan CPR.',
    activationTitle: 'Bantuan perlu diaktifkan sekarang',
    activationLead: 'Siapakah yang patut menerima arahan paling jelas?',
    activationChoices: ['Jerit “seseorang telefon ambulans”', 'Tunjuk seorang: “Anda, telefon 999 dan bawa AED”', 'Tinggalkan mangsa dan cari bantuan seorang diri'],
    activationReason: 'Arahan kepada individu tertentu mengurangkan kekeliruan. Gunakan pembesar suara jika telefon tersedia.',
    correct: 'Betul',
    tryAgain: 'Belum tepat',
    retry: 'Cuba pilihan lain. Kita hanya bergerak selepas tindakan yang selamat dipilih.',
    compressor: 'Compressor / Penekan dada',
    compressionTitle: 'Bina rentak 100–120/min',
    compressionLead: 'Gunakan pad latihan atau kekunci Space. Sasaran: 30 tekanan pada rentak yang konsisten.',
    tap: 'TEKAN',
    taps: 'tekanan',
    liveRate: 'rentak semasa',
    consistency: 'konsistensi',
    rhythmReady: 'Lengkapkan 30 tekanan. Bacaan rentak stabil selepas beberapa tekanan pertama.',
    rhythmGood: 'Rentak berada dalam julat latihan.',
    rhythmAdjust: 'Laraskan rentak ke 100–120/min.',
    resetAttempt: 'Set semula tekanan',
    aedTitle: 'Letakkan dua pad AED',
    aedLead: 'Pilih dua kawasan yang betul pada dada dewasa, kemudian pastikan semua orang menjauh.',
    clear: 'Jerit “JAUH!”',
    padsCorrect: 'Pad betul. Pastikan tiada sesiapa menyentuh mangsa semasa analisis atau kejutan.',
    padsPending: 'Pilih kanan atas mangsa (kiri anda) dan kiri bawah mangsa (kanan anda).',
    debriefTitle: 'Rantaian lengkap',
    debriefLead: 'Lihat keseluruhan peta hanya selepas melalui setiap keputusan.',
    time: 'Masa latihan',
    decisions: 'Tepat kali pertama',
    rhythm: 'Rentak akhir',
    discuss: 'Soalan debrief',
    discussText: 'Apakah tindakan yang melindungi rantaian? Di manakah kumpulan hampir kehilangan masa?',
    again: 'Ulang dengan peranan baharu',
    safety: 'Bahan pendidikan sahaja. Bukan alat diagnosis atau pengganti latihan CPR bertauliah. Dalam kecemasan sebenar di Malaysia, hubungi 999 dan ikut arahan operator.',
    source: 'Diadaptasi daripada Manual CPR untuk Komuniti KKM (2019).',
  },
  en: {
    lab: 'CPR Scenario Lab v1',
    strap: 'One room. Four roles. One chain.',
    intro: 'Community decision rehearsal — facilitator-led and followed by manikin practice.',
    start: 'Start rehearsal',
    rolesTitle: 'Assign four roles',
    rolesLead: 'Give one card to each learner. When a role appears, pass the device or give that person space to act.',
    ready: 'Roles are ready',
    back: 'Back',
    continue: 'Continue',
    reset: 'Reset',
    reveal: 'Show reasoning',
    choose: 'Choose an action',
    recognitionTitle: 'The person collapses and is unresponsive',
    recognitionLead: 'They are gasping. What does this mean?',
    recognitionChoices: ['Wait until breathing stops completely', 'Treat it as abnormal breathing and activate help', 'Give water and sit them up'],
    recognitionReason: 'Gasping is not normal breathing. Do not wait — activate help and start CPR.',
    activationTitle: 'Help must be activated now',
    activationLead: 'Who should receive the clearest instruction?',
    activationChoices: ['Shout “someone call an ambulance”', 'Point to one person: “You, call 999 and bring the AED”', 'Leave the person and search alone'],
    activationReason: 'Directing a specific person reduces ambiguity. Use speaker mode when a phone is available.',
    correct: 'Correct',
    tryAgain: 'Not yet',
    retry: 'Try another option. The chain only moves after the safe action is selected.',
    compressor: 'Compressor',
    compressionTitle: 'Build a 100–120/min rhythm',
    compressionLead: 'Use the training pad or Space key. Target 30 consistent compressions.',
    tap: 'PRESS',
    taps: 'compressions',
    liveRate: 'live rate',
    consistency: 'consistency',
    rhythmReady: 'Complete 30 compressions. The rhythm reading settles after the first few presses.',
    rhythmGood: 'Rhythm is inside the training range.',
    rhythmAdjust: 'Adjust the rhythm to 100–120/min.',
    resetAttempt: 'Reset compressions',
    aedTitle: 'Place two AED pads',
    aedLead: 'Choose the two correct adult chest zones, then ensure everyone is clear.',
    clear: 'Call “CLEAR!”',
    padsCorrect: 'Pads are correct. Nobody should touch the person during analysis or shock.',
    padsPending: 'Choose the person’s upper-right (your left) and lower-left (your right).',
    debriefTitle: 'The full chain',
    debriefLead: 'Reveal the whole map only after travelling through each decision.',
    time: 'Rehearsal time',
    decisions: 'Correct first try',
    rhythm: 'Final rhythm',
    discuss: 'Debrief question',
    discussText: 'Which action protected the chain? Where did the group nearly lose time?',
    again: 'Repeat with new roles',
    safety: 'Educational material only. Not a diagnostic tool or substitute for accredited CPR training. In a real Malaysian emergency, call 999 and follow the operator.',
    source: 'Adapted from the KKM Manual CPR untuk Komuniti (2019).',
  },
}

const roles = [
  { id: 'safety', symbol: '◈', name: 'Safety Coach', bm: 'Jurulatih Keselamatan', instruction: 'Pastikan tempat selamat', en: 'Make the scene safe', tone: 'info' },
  { id: 'caller', symbol: '☎', name: 'Caller', bm: 'Pemanggil', instruction: 'Hubungi 999 + lokasi', en: 'Call 999 + give location', tone: 'danger' },
  { id: 'compressor', symbol: '↕', name: 'Compressor', bm: 'Penekan Dada', instruction: '100–120 tekanan/min', en: '100–120 compressions/min', tone: 'compress' },
  { id: 'aed', symbol: 'ϟ', name: 'AED Runner', bm: 'Pembawa AED', instruction: 'Hidupkan, tampal, jauh', en: 'Power, place, clear', tone: 'aed' },
]

const missions = {
  bm: ['Kenal pasti', 'Aktifkan bantuan', 'Tekan dada', 'Gunakan AED'],
  en: ['Recognise', 'Activate help', 'Compress', 'Use the AED'],
}

const missionByPhase = { recognition: 0, activation: 1, compressions: 2, aed: 3 }

const initialState = {
  phase: 'lobby', language: 'bm', answers: {}, attempts: {}, timestamps: [], aedPads: [], calledClear: false, startedAt: null,
}

function reducer(state, action) {
  switch (action.type) {
    case 'language': return { ...state, language: action.value }
    case 'start': return { ...initialState, language: state.language, phase: 'roles', startedAt: Date.now() }
    case 'phase': return { ...state, phase: action.value }
    case 'answer': return {
      ...state,
      answers: { ...state.answers, [action.id]: action.index },
      attempts: { ...state.attempts, [action.id]: (state.attempts[action.id] || 0) + 1 },
    }
    case 'tap': return { ...state, timestamps: [...state.timestamps.slice(-29), action.time] }
    case 'resetTaps': return { ...state, timestamps: [] }
    case 'pad': {
      const exists = state.aedPads.includes(action.id)
      const next = exists ? state.aedPads.filter(id => id !== action.id) : [...state.aedPads.slice(-1), action.id]
      return { ...state, aedPads: next, calledClear: false }
    }
    case 'clear': return { ...state, calledClear: true }
    case 'reset': return { ...initialState, language: state.language }
    default: return state
  }
}

function getRhythm(timestamps) {
  if (timestamps.length < 2) return { bpm: 0, consistency: 0 }
  const intervals = timestamps.slice(1).map((time, index) => time - timestamps[index]).filter(value => value > 180 && value < 1500)
  if (!intervals.length) return { bpm: 0, consistency: 0 }
  const average = intervals.reduce((sum, value) => sum + value, 0) / intervals.length
  const variance = intervals.reduce((sum, value) => sum + (value - average) ** 2, 0) / intervals.length
  const bpm = Math.round(60000 / average)
  const consistency = Math.max(0, Math.round(100 - (Math.sqrt(variance) / average) * 100))
  return { bpm, consistency }
}

function Decision({ id, title, lead, choices, reason, state, dispatch, role, onContinue, t }) {
  const selected = state.answers[id]
  const answered = selected !== undefined
  const correct = selected === 1
  return (
    <StageShell state={state} dispatch={dispatch} role={role}>
      <p className="stage-kicker">{t.choose}</p>
      <h2>{title}</h2>
      <p className="stage-lead">{lead}</p>
      <div className="choice-list">
        {choices.map((choice, index) => (
          <button
            className={`choice ${answered && index === selected && correct ? 'correct' : ''} ${answered && index === selected && !correct ? 'wrong' : ''}`}
            key={choice}
            onClick={() => dispatch({ type: 'answer', id, index })}
            disabled={correct}
          >
            <span>{String.fromCharCode(65 + index)}</span>{choice}
          </button>
        ))}
      </div>
      {answered && <div className={`reason ${correct ? 'is-correct' : 'is-wrong'}`} role="status" aria-live="polite"><b>{correct ? t.correct : t.tryAgain}</b><p>{correct ? reason : t.retry}</p></div>}
      <NavRow state={state} dispatch={dispatch} continueDisabled={!correct} onContinue={onContinue} t={t} />
    </StageShell>
  )
}

function StageShell({ children, state, role }) {
  const missionIndex = missionByPhase[state.phase]
  const missionLabels = missions[state.language]
  return (
    <main className="stage-shell">
      <header className="stage-top">
        <div><b>CPR</b><span>SCENARIO LAB v1</span></div>
        <div className="status"><span>{missionIndex !== undefined ? `${missionIndex + 1}/4` : state.phase === 'debrief' ? '✓' : 'BRIEF'}</span>{role && <span className={`role-pill ${role.tone}`}>{role.symbol} {state.language === 'bm' ? role.bm : role.name}</span>}</div>
      </header>
      <section className="stage-content">
        {missionIndex !== undefined && <nav className="mission-rail" aria-label={state.language === 'bm' ? 'Empat misi latihan' : 'Four rehearsal missions'}>{missionLabels.map((label, itemIndex) => <span key={label} className={itemIndex === missionIndex ? 'current' : itemIndex < missionIndex ? 'done' : ''}><i>{itemIndex < missionIndex ? '✓' : itemIndex + 1}</i>{label}</span>)}</nav>}
        {children}
      </section>
    </main>
  )
}

function NavRow({ state, dispatch, onContinue, continueDisabled = false, t }) {
  const index = phases.indexOf(state.phase)
  return (
    <div className="nav-row">
      <button className="btn-subtle" disabled={index <= 1} onClick={() => dispatch({ type: 'phase', value: phases[index - 1] })}>← {t.back}</button>
      <button className="btn-primary" disabled={continueDisabled} onClick={onContinue}>{t.continue} →</button>
    </div>
  )
}

function App() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const t = copy[state.language]
  const rhythm = useMemo(() => getRhythm(state.timestamps), [state.timestamps])
  const padsCorrect = state.aedPads.includes('left-upper') && state.aedPads.includes('right-lower')
  const decisionScore = Number(state.answers.recognition === 1 && state.attempts.recognition === 1) + Number(state.answers.activation === 1 && state.attempts.activation === 1)

  const tap = () => dispatch({ type: 'tap', time: performance.now() })
  useEffect(() => {
    const onKeyDown = event => {
      if (event.code === 'Space' && state.phase === 'compressions') {
        event.preventDefault()
        dispatch({ type: 'tap', time: performance.now() })
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [state.phase])

  if (state.phase === 'lobby') return (
    <div className="app-shell">
      <header className="lab-header"><div className="lab-brand"><span>♥</span><b>CPR</b></div><button className="language" onClick={() => dispatch({ type: 'language', value: state.language === 'bm' ? 'en' : 'bm' })}>{state.language === 'bm' ? 'EN' : 'BM'}</button></header>
      <main className="lobby">
        <div className="lobby-copy"><p className="eyebrow">FACILITATOR-LED REHEARSAL</p><h1>{t.strap}</h1><p>{t.intro}</p><button className="start" onClick={() => dispatch({ type: 'start' })}>{t.start} →</button></div>
        <div className="chain-preview">{roles.map((role, index) => <article key={role.id} className={role.tone}><span>{String(index + 1).padStart(2, '0')}</span><b>{role.symbol} {state.language === 'bm' ? role.bm : role.name}</b><small>{state.language === 'bm' ? role.instruction : role.en}</small></article>)}</div>
        <aside className="safety-note"><b>{t.lab}</b><span>{t.safety}</span></aside>
      </main>
    </div>
  )

  if (state.phase === 'roles') return (
    <StageShell state={state} dispatch={dispatch}>
      <p className="stage-kicker">01 / ROLE ASSIGNMENT</p><h2>{t.rolesTitle}</h2><p className="stage-lead">{t.rolesLead}</p>
      <div className="role-grid">{roles.map(role => <article key={role.id} className={`role-card ${role.tone}`}><span>{role.symbol}</span><div><b>{state.language === 'bm' ? role.bm : role.name}</b><small>{state.language === 'bm' ? role.instruction : role.en}</small></div></article>)}</div>
      <NavRow state={state} dispatch={dispatch} onContinue={() => dispatch({ type: 'phase', value: 'recognition' })} t={t} />
    </StageShell>
  )

  if (state.phase === 'recognition') return <Decision id="recognition" title={t.recognitionTitle} lead={t.recognitionLead} choices={t.recognitionChoices} reason={t.recognitionReason} state={state} dispatch={dispatch} role={roles[0]} onContinue={() => dispatch({ type: 'phase', value: 'activation' })} t={t} />
  if (state.phase === 'activation') return <Decision id="activation" title={t.activationTitle} lead={t.activationLead} choices={t.activationChoices} reason={t.activationReason} state={state} dispatch={dispatch} role={roles[1]} onContinue={() => dispatch({ type: 'phase', value: 'compressions' })} t={t} />

  if (state.phase === 'compressions') {
    const enough = state.timestamps.length >= 30
    const inRange = rhythm.bpm >= 100 && rhythm.bpm <= 120
    return (
      <div>
        <StageShell state={state} dispatch={dispatch} role={roles[2]}>
          <p className="stage-kicker">RHYTHM PRACTICE</p><h2>{t.compressionTitle}</h2><p className="stage-lead">{t.compressionLead}</p>
          <div className="compression-grid">
            <button className={`tap-pad ${inRange ? 'on-target' : ''}`} onClick={tap} aria-label={`${t.tap}: ${state.timestamps.length} / 30`}><strong>{state.timestamps.length}</strong><span>{t.tap}</span><small>{t.taps} · /30</small></button>
            <div className="metrics" aria-live="polite"><article><span>{t.liveRate}</span><b>{rhythm.bpm || '—'}</b><small>BPM</small></article><article><span>{t.consistency}</span><b>{rhythm.consistency || '—'}</b><small>%</small></article><p className={enough && inRange ? 'good' : 'caution'}>{!enough ? t.rhythmReady : inRange ? t.rhythmGood : t.rhythmAdjust}</p><button className="btn-subtle" onClick={() => dispatch({ type: 'resetTaps' })}>{t.resetAttempt}</button></div>
          </div>
          <NavRow state={state} dispatch={dispatch} continueDisabled={!enough} onContinue={() => dispatch({ type: 'phase', value: 'aed' })} t={t} />
        </StageShell>
      </div>
    )
  }

  if (state.phase === 'aed') return (
    <StageShell state={state} dispatch={dispatch} role={roles[3]}>
      <p className="stage-kicker">AED PLACEMENT</p><h2>{t.aedTitle}</h2><p className="stage-lead">{t.aedLead}</p>
      <div className="aed-grid">
        <div className="torso" aria-label="Adult torso AED placement exercise">
          <svg viewBox="0 0 360 430" role="img" aria-label="Simplified adult torso"><circle cx="180" cy="54" r="38"/><path d="M112 105 Q180 75 248 105 L284 330 Q244 382 180 390 Q116 382 76 330Z"/></svg>
          {['left-upper','right-upper','left-lower','right-lower'].map(id => <button key={id} aria-label={`AED pad zone ${id}`} className={`pad-zone ${id} ${state.aedPads.includes(id) ? 'selected' : ''}`} onClick={() => dispatch({ type: 'pad', id })}>AED</button>)}
        </div>
        <div className="aed-panel"><p className={padsCorrect ? 'good' : 'caution'}>{padsCorrect ? t.padsCorrect : t.padsPending}</p><button className="clear-button" disabled={!padsCorrect} onClick={() => dispatch({ type: 'clear' })}>{t.clear}</button>{state.calledClear && <div className="clear-confirm">✓ CLEAR</div>}</div>
      </div>
      <NavRow state={state} dispatch={dispatch} continueDisabled={!padsCorrect || !state.calledClear} onContinue={() => dispatch({ type: 'phase', value: 'debrief' })} t={t} />
    </StageShell>
  )

  const elapsed = state.startedAt ? Math.max(1, Math.round((Date.now() - state.startedAt) / 1000)) : 0
  return (
    <StageShell state={state} dispatch={dispatch}>
      <p className="stage-kicker">DEBRIEF / SURVEY MAP</p><h2>{t.debriefTitle}</h2><p className="stage-lead">{t.debriefLead}</p>
      <div className="debrief-chain">{roles.map((role, index) => <article key={role.id} className={role.tone}><span>{index + 1}</span><b>{role.symbol} {state.language === 'bm' ? role.bm : role.name}</b><small>{state.language === 'bm' ? role.instruction : role.en}</small></article>)}</div>
      <div className="score-grid"><article><span>{t.time}</span><b>{elapsed}s</b></article><article><span>{t.decisions}</span><b>{decisionScore}/2</b></article><article><span>{t.rhythm}</span><b>{rhythm.bpm || '—'} BPM</b></article></div>
      <div className="discussion"><b>{t.discuss}</b><p>{t.discussText}</p></div>
      <div className="finish-row"><button className="btn-subtle" onClick={() => dispatch({ type: 'reset' })}>{t.again}</button><p>{t.source}</p></div>
    </StageShell>
  )
}

export default App
