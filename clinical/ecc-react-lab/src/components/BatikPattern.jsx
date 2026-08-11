export default function BatikPattern() {
  return (
    <svg
      width="100%"
      height="60"
      viewBox="0 0 1200 60"
      preserveAspectRatio="none"
      aria-hidden="true"
      style={{ display: 'block', opacity: 0.25 }}
    >
      <defs>
        <pattern id="batik" x="0" y="0" width="80" height="60" patternUnits="userSpaceOnUse">
          <rect width="80" height="60" fill="none" />
          <circle cx="20" cy="15" r="6" fill="currentColor" />
          <circle cx="60" cy="15" r="6" fill="currentColor" />
          <rect x="36" y="6" width="8" height="18" rx="2" fill="currentColor" />
          <circle cx="40" cy="42" r="10" fill="none" stroke="currentColor" strokeWidth="3" />
          <circle cx="40" cy="42" r="4" fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="60" fill="url(#batik)" />
    </svg>
  );
}
