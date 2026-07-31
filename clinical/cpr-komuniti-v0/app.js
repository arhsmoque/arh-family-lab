(() => {
  const content = window.CPR_CONTENT;
  if (!content) return;
  const accent = {red:'#e23b3b',coral:'#ff6b5e',cyan:'#27c5d9',green:'#4ed49a',amber:'#ffc857'};
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const modules = document.querySelector('#modules');
  modules.innerHTML = content.modules.map(module => `
    <section id="${esc(module.id)}" class="module page-section present-slide" data-title="${esc(module.title)}" style="--accent:${accent[module.accent] || accent.coral}">
      <div class="section-heading"><p class="eyebrow">${esc(module.eyebrow)}</p><h2>${esc(module.title)}</h2><p>${esc(module.summary)}</p></div>
      <div class="step-grid">${module.steps.map(step => `<article class="step"><span class="step-label">${esc(step.label)}</span><h3>${esc(step.title)}</h3><p>${esc(step.body)}</p>${step.metric ? `<b class="metric">${esc(step.metric)}</b>` : ''}</article>`).join('')}</div>
      ${module.cautions ? `<ul class="cautions">${module.cautions.map(item => `<li>${esc(item)}</li>`).join('')}</ul>` : ''}
    </section>`).join('');

  const quizList = document.querySelector('#quizList');
  quizList.innerHTML = content.quiz.map((q, qi) => `<article class="quiz-card" data-quiz="${qi}"><h3>${qi + 1}. ${esc(q.prompt)}</h3><div class="choices">${q.choices.map((choice, ci) => `<button class="choice" type="button" data-choice="${ci}">${esc(choice)}</button>`).join('')}</div><p class="reasoning" hidden></p></article>`).join('');
  quizList.addEventListener('click', event => {
    const button = event.target.closest('.choice'); if (!button) return;
    const card = button.closest('.quiz-card'); const q = content.quiz[Number(card.dataset.quiz)]; const selected = Number(button.dataset.choice);
    card.querySelectorAll('.choice').forEach((el, index) => { el.disabled = true; if (index === q.answer) el.classList.add('correct'); else if (index === selected) el.classList.add('wrong'); });
    const reasoning = card.querySelector('.reasoning'); reasoning.hidden = false; reasoning.textContent = (selected === q.answer ? 'Betul — ' : 'Belum tepat — ') + q.reasoning;
  });

  document.querySelector('#sourceList').innerHTML = content.sources.map(source => `<a href="${esc(source.url)}" target="_blank" rel="noreferrer">↗ ${esc(source.label)}</a>`).join('');
  const cleanUrl = location.href.split('#')[0].replace(/[?&]present=1/, '').replace(/[?&]$/, '');
  document.querySelector('#currentUrl').textContent = cleanUrl;
  const qrTarget = document.querySelector('#qr');
  if (window.qrcode && /^https?:/.test(cleanUrl)) { const qr = window.qrcode(0, 'M'); qr.addData(cleanUrl); qr.make(); qrTarget.innerHTML = qr.createSvgTag({cellSize:6,margin:0,scalable:true}); }
  else { qrTarget.style.background = '#102131'; qrTarget.innerHTML = '<div style="display:grid;place-items:center;height:100%;padding:1rem;text-align:center;color:#ffc857;font-weight:800">Gunakan apply_serve_on_lan.ps1 untuk menghasilkan QR yang boleh dicapai telefon.</div>'; }

  const bpm = document.querySelector('#bpm'); const bpmOutput = document.querySelector('#bpmOutput'); const pulse = document.querySelector('#pulseButton'); const countEl = document.querySelector('#pulseCount'); let timer; let count = 0; let audio;
  const tick = () => { count += 1; countEl.textContent = count; try { audio ||= new (window.AudioContext || window.webkitAudioContext)(); const osc = audio.createOscillator(); const gain = audio.createGain(); osc.frequency.value = count % 30 === 1 ? 760 : 520; gain.gain.setValueAtTime(.08, audio.currentTime); gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + .07); osc.connect(gain).connect(audio.destination); osc.start(); osc.stop(audio.currentTime + .08); } catch {} };
  const stop = () => { clearInterval(timer); timer = null; pulse.classList.remove('running'); pulse.setAttribute('aria-pressed','false'); pulse.querySelector('small').textContent = 'tekan untuk mula'; };
  const start = () => { stop(); const interval = 60000 / Number(bpm.value); pulse.style.setProperty('--beat', `${interval}ms`); pulse.classList.add('running'); pulse.setAttribute('aria-pressed','true'); pulse.querySelector('small').textContent = 'tekan untuk berhenti'; tick(); timer = setInterval(tick, interval); };
  pulse.addEventListener('click', () => timer ? stop() : start()); bpm.addEventListener('input', () => { bpmOutput.value = bpm.value; if (timer) start(); });
  document.querySelector('#resetPractice').addEventListener('click', () => { stop(); count = 0; countEl.textContent = '0'; });
  document.querySelector('#startPractice').addEventListener('click', () => { location.hash = '#practice'; setTimeout(start, 350); });

  document.querySelector('#shareButton').addEventListener('click', async () => { try { if (navigator.share) await navigator.share({title:content.meta.title,text:content.meta.subtitle,url:cleanUrl}); else { await navigator.clipboard.writeText(cleanUrl); alert('Pautan disalin.'); } } catch {} });
  let installPrompt; window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installPrompt = e; document.querySelector('#installButton').hidden = false; });
  document.querySelector('#installButton').addEventListener('click', async () => { if (!installPrompt) return; installPrompt.prompt(); await installPrompt.userChoice; installPrompt = null; document.querySelector('#installButton').hidden = true; });
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});

  const present = new URLSearchParams(location.search).get('present') === '1';
  if (present) {
    document.body.classList.add('present'); const slides = [...document.querySelectorAll('.present-slide')]; const controls = document.querySelector('#presentControls'); controls.hidden = false; let index = 0;
    const show = next => { index = Math.max(0, Math.min(slides.length - 1, next)); slides.forEach((slide, i) => slide.classList.toggle('active', i === index)); document.querySelector('#slideStatus').textContent = `${index + 1} / ${slides.length}`; };
    document.querySelector('#prevSlide').onclick = () => show(index - 1); document.querySelector('#nextSlide').onclick = () => show(index + 1); document.querySelector('#exitPresent').onclick = () => location.href = location.pathname;
    addEventListener('keydown', e => { if (['ArrowRight','PageDown',' '].includes(e.key)) show(index + 1); if (['ArrowLeft','PageUp'].includes(e.key)) show(index - 1); if (e.key === 'Escape') location.href = location.pathname; }); show(0);
  }
})();
