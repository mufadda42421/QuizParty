const cards = [
  {
    key: 'quizzes',
    title: 'Host a live game',
    text: 'Pick a quiz and host from any device — phone, tablet, laptop or TV.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="2.5" y="4" width="19" height="13" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </svg>
    ),
  },
  {
    key: 'player',
    title: 'Join a game',
    text: 'Have a room code? Jump straight in — no account needed.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
        <circle cx="9.5" cy="7" r="4" />
        <path d="M21 11h-6M18 8l3 3-3 3" />
      </svg>
    ),
  },
  {
    key: 'quizzes',
    title: 'My Quizzes',
    text: 'Create, edit and host your own quizzes — or start hosting an existing one.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L11 15l-4 1 1-4 8.5-8.5z" />
      </svg>
    ),
  },
  {
    key: 'history',
    title: 'Reports',
    text: 'Standings, winners and per-question breakdowns from past games.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 3v18h18" />
        <path d="M8 17V9M13 17V5M18 17v-6" />
      </svg>
    ),
  },
]

export default function Menu({ onNavigate }) {
  return (
    <div className="menu-page">
      <div className="menu-intro">
        <p className="eyebrow">Main menu</p>
        <h1>What would you like to do?</h1>
        <p className="lede">Pick a path — hosting, joining, authoring or reviewing. Everything runs on this device until a game starts.</p>
      </div>

      <div className="menu-cards">
        {cards.map((card) => (
          <button key={card.key} className="menu-card" onClick={() => onNavigate(card.key)}>
            <span className="menu-card-icon">{card.icon}</span>
            <span className="menu-card-body">
              <strong>{card.title}</strong>
              <span>{card.text}</span>
            </span>
            <span className="menu-card-arrow" aria-hidden="true">→</span>
          </button>
        ))}
      </div>

      <p className="menu-hint">
        New here? Choose <strong>Join a game</strong> if you have a room code, or <strong>My Quizzes</strong> to create your first quiz.
      </p>
    </div>
  )
}
