export default function AuthCardHeader() {
  return (
    <div className="auth-card-logo">
      <svg width="80" height="50" viewBox="0 0 160 80" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle cx="20" cy="40" r="14" className="auth-dot-active" />
        <circle cx="80" cy="16" r="11" className="auth-dot-dim" />
        <circle cx="140" cy="40" r="14" className="auth-dot-active" />
        <circle cx="80" cy="62" r="11" className="auth-dot-dim" />
        <path d="M34 36 Q57 16 69 18" className="auth-conn" />
        <path d="M91 22 Q118 26 126 34" className="auth-conn" />
        <path d="M34 46 Q57 62 69 62" className="auth-conn-dim" />
        <path d="M91 62 Q118 56 126 48" className="auth-conn-dim" />
        <line x1="66" y1="30" x2="80" y2="44" className="auth-baton-line" />
        <circle cx="66" cy="30" r="3.5" fill="#60A5FA" />
        <circle cx="80" cy="44" r="3.5" fill="#93C5FD" />
        <circle cx="20" cy="40" r="4" fill="#F8FAFC" />
        <circle cx="140" cy="40" r="4" fill="#3B82F6" />
      </svg>
      <div>
        <div className="auth-wordmark">relay</div>
        <div className="auth-tagline-logo">CONNECTED WORK HUB</div>
      </div>
    </div>
  );
}
