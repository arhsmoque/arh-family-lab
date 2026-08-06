const routes = [
  /^familylab:\/\/today$/,
  /^familylab:\/\/member\/([^/]+)$/,
  /^familylab:\/\/task\/([^/]+)$/,
  /^familylab:\/\/checklist\/([^/]+)$/,
  /^familylab:\/\/parent\/attention$/
];

export function parseFamilyLabUrl(url) {
  const match = routes.find((pattern) => pattern.test(url));
  return match ? { accepted: true, url } : { accepted: false, reason: 'unsupported_route' };
}

export function registerDeepLinkRouting(App) {
  App.addListener('appUrlOpen', ({ url }) => {
    const parsed = parseFamilyLabUrl(url);
    window.dispatchEvent(new CustomEvent('familylab:deep-link', { detail: parsed }));
  });
}
