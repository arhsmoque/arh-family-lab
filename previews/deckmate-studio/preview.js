const tabs = [...document.querySelectorAll('[role="tab"]')];
const panels = [...document.querySelectorAll('[role="tabpanel"]')];

function activate(tab) {
  tabs.forEach((candidate) => candidate.setAttribute('aria-selected', String(candidate === tab)));
  panels.forEach((panel) => { panel.hidden = panel.id !== tab.dataset.panel; });
  tab.focus();
}

tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => activate(tab));
  tab.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    const offset = event.key === 'ArrowRight' ? 1 : -1;
    activate(tabs[(index + offset + tabs.length) % tabs.length]);
  });
});
