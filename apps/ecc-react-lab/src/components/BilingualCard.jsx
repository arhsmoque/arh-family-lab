export default function BilingualCard({ children, className = '' }) {
  return (
    <div className={`card bilingual-card ${className}`}>
      {children}
    </div>
  );
}
