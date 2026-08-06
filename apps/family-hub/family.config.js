// Family Hub — base configuration
// Real Firebase values are injected via family.config.local.js (gitignored),
// generated from infisical. See SETUP.md.
window.FAMILY_HUB_CONFIG = (() => {
  const base = {
    firebase: {
      url: "",
      root: "familyHub",
      apiKey: ""
    },
    defaults: {
      theme: "warm",
      lang: "en",
      autoLockSeconds: 120,
      idleReturnSeconds: 60
    }
  };

  const local = (typeof FAMILY_HUB_CONFIG_LOCAL !== "undefined")
    ? FAMILY_HUB_CONFIG_LOCAL
    : {};

  return {
    firebase: Object.assign({}, base.firebase, local.firebase || {}),
    defaults: Object.assign({}, base.defaults, local.defaults || {})
  };
})();
