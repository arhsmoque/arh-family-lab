export function installLifecycleBridge(App) {
  App.addListener('appStateChange', ({ isActive }) => {
    window.dispatchEvent(new CustomEvent('familylab:app-state', { detail: { isActive } }));
    if (isActive) window.dispatchEvent(new CustomEvent('familylab:request-sync'));
  });
}
