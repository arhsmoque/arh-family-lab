export const capabilityRegistry = Object.freeze({
  notifications: { state: 'scaffolded', fallback: 'in_app_reminders' },
  parentReauthorisation: { state: 'native_bridge_required', fallback: 'app_pin' },
  backgroundSync: { state: 'native_bridge_required', fallback: 'foreground_queue_flush' },
  widgets: { state: 'native_extension_required', fallback: 'app_shortcut' },
  deepLinks: { state: 'web_bridge_scaffolded', fallback: 'safe_today_route' },
  secureStorage: { state: 'decision_required', fallback: 'no_long_lived_secret_in_web_storage' }
});
