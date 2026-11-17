import { useState } from 'react'
import Logo from '../components/Logo.jsx'

const CONTACT_EMAIL = 'jaorawalamufaddal7@gmail.com'

const features = [
  {
    title: 'Live multiplayer, peer-to-peer',
    text: 'The host’s device is the game board — phone, tablet, laptop or TV. Everyone else answers from their own phone — synchronized directly over WebRTC, with no game server in between.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="9" cy="7" r="3.2" /><circle cx="17" cy="9" r="2.6" />
        <path d="M3.5 19v-1a5.5 5.5 0 0 1 11 0v1M13.5 15.4a4.5 4.5 0 0 1 7 4.6v.5" />
      </svg>
    ),
  },
  {
    title: 'Speed-based scoring',
    text: 'Correct answers earn 500 points — plus up to 500 more for answering quickly. Streak the room with a tense per-question countdown.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="13" r="8" /><path d="M12 9v4l2.5 2.5M9 2h6" />
      </svg>
    ),
  },
  {
    title: 'Your data stays yours',
    text: 'Quizzes and reports live in this device’s storage. No accounts, no analytics pipeline, no profile harvested for someone else’s model.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 3l7 3v5c0 5-3.5 9-7 10-3.5-1-7-5-7-10V6l7-3z" /><path d="M9.5 12l2 2 3.5-4" />
      </svg>
    ),
  },
  {
    title: 'Works offline',
    text: 'Quiz Party is an installable PWA. The app shell, your quizzes and your reports all work without a connection. Live games need one — that’s physics, not greed.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0" /><circle cx="12" cy="19.2" r="1.1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    title: 'Reports after every game',
    text: 'Standings, winner and per-question answer distribution for every session — saved automatically on the host device.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 4v16h16" /><path d="M9 16v-5M13 16V8M17 16v-3" />
      </svg>
    ),
  },
  {
    title: 'Free — properly free',
    text: 'No subscription tier, no “Pro”, no ads, no upsells. Built as a free project and funded by nobody’s patience but ours.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 2v20M17 6.5c0-1.9-2.2-3-5-3s-5 1.1-5 3.2c0 4.4 10 2.3 10 6.8 0 2.1-2.2 3.5-5 3.5s-5-1.3-5-3.3" />
      </svg>
    ),
  },
]

const faqs = [
  {
    q: 'Is Quiz Party really free?',
    a: 'Yes. There is no paid plan, trial countdown, or locked feature. The live game runs peer-to-peer between the devices in your room, which is why it can stay free — we don’t pay for servers, so there’s nothing to charge you for.',
  },
  {
    q: 'Do players need an account or an app install?',
    a: 'No. Players open the app (or share the host’s link), enter the 5-letter room code and a nickname. That’s the whole onboarding.',
  },
  {
    q: 'Does it work without internet?',
    a: 'The app itself, your quizzes and your reports all work offline as an installed PWA. Starting a live game needs a connection because WebRTC signaling uses a free public broker — the game traffic after that is direct between devices.',
  },
  {
    q: 'Where is my data stored?',
    a: 'On the host’s device, in the browser’s local storage. Game scores sync peer-to-peer to the players in your session and nothing else leaves your devices. Clearing site data wipes everything — there is no hidden cloud copy.',
  },
  {
    q: 'How many players can join one game?',
    a: 'Comfortably dozens on a typical network. Very large rooms (hundreds) are bounded by the host device’s browser, not by licensing — because there is no licensing.',
  },
  {
    q: 'Can I create my own quizzes?',
    a: 'Yes — unlimited quizzes with custom questions, four answers each, configurable time limits, stored locally and editable any time.',
  },
  {
    q: 'Who do I contact for help or feedback?',
    a: `Email us — we read everything. ${CONTACT_EMAIL}`,
  },
]

function FaqItem({ q, a, open, onToggle }) {
  return (
    <div className={`faq-item${open ? ' open' : ''}`}>
      <button className="faq-q" onClick={onToggle} aria-expanded={open}>
        <span>{q}</span>
        <span className="faq-chevron" aria-hidden="true">{open ? '−' : '+'}</span>
      </button>
      {open && <div className="faq-a"><p>{a}</p></div>}
    </div>
  )
}

export default function Landing({ onGetStarted }) {
  const [openFaq, setOpenFaq] = useState(0)
  const [subject, setSubject] = useState('Quiz Party — feedback')
  const [message, setMessage] = useState('')

  const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject || 'Quiz Party — feedback')}&body=${encodeURIComponent(message)}`

  return (
    <div className="landing">
      <header className="landing-nav">
        <div className="brand">
          <Logo size={30} />
          <span>Quiz Party</span>
        </div>
        <nav className="landing-anchors" aria-label="Sections">
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
          <a href="#about">About</a>
          <a href="#faq">FAQ</a>
          <a href="#contact">Contact</a>
        </nav>
        <button className="btn primary small" onClick={onGetStarted}>
          Get started<span aria-hidden="true"> →</span>
        </button>
      </header>

      <main>
        {/* ---------- Hero ---------- */}
        <section className="landing-hero">
          <div className="landing-copy">
            <p className="eyebrow reveal reveal-1">Live multiplayer quizzes</p>
            <h1 className="reveal reveal-2">
              Turn any room<br />into a <em>game&nbsp;show</em>.
            </h1>
            <p className="lede reveal reveal-3">
              Build original quizzes, host them from any device — phone, tablet, laptop or TV — and let everyone answer
              from their own phone — no accounts, no installs, no cost.
            </p>
            <div className="landing-ctas reveal reveal-4">
              <button className="btn primary hero-cta" onClick={onGetStarted}>
                Get started<span aria-hidden="true"> →</span>
              </button>
              <a className="textlink" href="#how">See how it works ↓</a>
            </div>
          </div>

          <div className="landing-visual reveal reveal-3" aria-hidden="true">
            <div className="float-card quiz-card-float">
              <div className="qc-top">
                <span className="qc-live">● LIVE</span>
                <span className="qc-qcount">Question 2 of 6</span>
              </div>
              <p className="qc-question">Which planet is known as the Red Planet?</p>
              <div className="qc-answers">
                <div className="qc-answer a-red">Venus</div>
                <div className="qc-answer a-blue is-picked">Mars</div>
                <div className="qc-answer a-gold">Jupiter</div>
                <div className="qc-answer a-green">Mercury</div>
              </div>
            </div>

            <div className="float-chip chip-points">+850 pts</div>

            <div className="float-card board-float">
              <p className="qc-board-title">Leaderboard</p>
              <div className="lb-row"><span className="lb-rank">1</span><span className="lb-name">Priya</span><span className="lb-bar"><span style={{ '--w': '96%' }} /></span><span className="lb-score">2,410</span></div>
              <div className="lb-row"><span className="lb-rank">2</span><span className="lb-name">Marcus</span><span className="lb-bar"><span style={{ '--w': '78%' }} /></span><span className="lb-score">1,955</span></div>
              <div className="lb-row"><span className="lb-rank">3</span><span className="lb-name">Aisha</span><span className="lb-bar"><span style={{ '--w': '64%' }} /></span><span className="lb-score">1,605</span></div>
            </div>
          </div>
        </section>

        {/* ---------- How it works ---------- */}
        <section className="lp-section" id="how">
          <p className="eyebrow">How it works</p>
          <h2 className="section-title">Three steps, one game show.</h2>
          <div className="steps-grid">
            <div className="step-card">
              <span className="step-num">01</span>
              <h3>Create a quiz</h3>
              <p>Write your questions, pick the right answer, set a timer per question. Quizzes are saved on your device and ready to host any time.</p>
            </div>
            <div className="step-card">
              <span className="step-num">02</span>
              <h3>Host from any device</h3>
              <p>Launch the game on a phone, tablet, laptop, projector or TV — if it has a browser, it can host. A 5-letter room code appears — that’s the whole ceremony.</p>
            </div>
            <div className="step-card">
              <span className="step-num">03</span>
              <h3>Everyone plays</h3>
              <p>Players join from their own phones or laptops, answer against the countdown, climb the leaderboard and argue about questions afterwards.</p>
            </div>
          </div>
        </section>

        {/* ---------- Features ---------- */}
        <section className="lp-section" id="features">
          <p className="eyebrow">Features</p>
          <h2 className="section-title">Serious tooling, playful energy.</h2>
          <div className="feature-grid">
            {features.map((feature) => (
              <div key={feature.title} className="feature-card">
                <span className="feature-icon">{feature.icon}</span>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- About ---------- */}
        <section className="lp-section" id="about">
          <p className="eyebrow">About</p>
          <h2 className="section-title">Why Quiz Party exists.</h2>
          <div className="about-grid">
            <div className="about-copy">
              <p>
                Quizzes are one of the best tools we have for making rooms pay attention — in classrooms,
                onboarding sessions, town halls, families at the dinner table and trivia nights that
                should have ended an hour ago.
              </p>
              <p>
                Most platforms that get this right put the good parts behind a paywall, a sign-up form,
                or both. Quiz Party is our answer: the full game, free, with nothing to unlock and
                nothing to buy. It runs entirely on your devices — your quiz content never touches
                our servers because there are no servers.
              </p>
              <p>
                It is deliberately small, deliberately private, and deliberately unfinished in the
                right ways — we would rather do the core loop brilliantly than chase a feature list.
              </p>
            </div>
            <div className="about-panel">
              <p className="qc-board-title">Our promises</p>
              <ul className="promise-list">
                <li><strong>Free, always.</strong><span>No paid tier, no trial that expires.</span></li>
                <li><strong>No accounts.</strong><span>No sign-up forms — the 5-letter room code is the whole gate.</span></li>
                <li><strong>No tracking.</strong><span>No analytics, no pixels, no profiles.</span></li>
                <li><strong>Your data stays yours.</strong><span>Stored on your device; sync happens peer-to-peer.</span></li>
                <li><strong>Open by default.</strong><span>Ask us anything — we mean it.</span></li>
              </ul>
            </div>
          </div>
        </section>

        {/* ---------- FAQ ---------- */}
        <section className="lp-section" id="faq">
          <p className="eyebrow">FAQ</p>
          <h2 className="section-title">Fair questions.</h2>
          <div className="faq-list">
            {faqs.map((item, i) => (
              <FaqItem
                key={i}
                q={item.q}
                a={item.a}
                open={openFaq === i}
                onToggle={() => setOpenFaq(openFaq === i ? -1 : i)}
              />
            ))}
          </div>
        </section>

        {/* ---------- Contact ---------- */}
        <section className="lp-section" id="contact">
          <p className="eyebrow">Contact</p>
          <h2 className="section-title">Questions, bugs, or an idea?</h2>
          <div className="contact-grid">
            <div className="about-copy">
              <p>We read every message. Bug reports with steps to reproduce get the fastest love.</p>
              <a className="contact-mail" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
              <p className="microtrust" style={{ marginTop: 14 }}>Or use the form — it opens your mail app, nothing is sent through us.</p>
            </div>
            <form className="contact-form" onSubmit={(e) => { e.preventDefault(); window.location.href = mailto }}>
              <div className="field">
                <label htmlFor="contact-subject">Subject</label>
                <input id="contact-subject" className="input" value={subject} onChange={(e) => setSubject(e.target.value)} required />
              </div>
              <div className="field" style={{ marginBottom: 12 }}>
                <label htmlFor="contact-message">Message</label>
                <textarea id="contact-message" className="input" style={{ minHeight: 110 }} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Tell us what’s on your mind…" required />
              </div>
              <button type="submit" className="btn primary">Compose email →</button>
            </form>
          </div>
        </section>
      </main>

      {/* ---------- Footer ---------- */}
      <footer className="landing-footer">
        <div className="footer-brand">
          <Logo size={26} />
          <div>
            <p className="footer-name">Quiz Party</p>
            <p className="footer-tag">Free, always. Quizzes on your device, games peer-to-peer.</p>
          </div>
        </div>
        <nav className="footer-links" aria-label="Footer">
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
          <a href="#about">About</a>
          <a href="#faq">FAQ</a>
          <a href="#contact">Contact</a>
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </nav>
        <p className="footer-copy">© {new Date().getFullYear()} Quiz Party. Made for people who love a good question.</p>
      </footer>
    </div>
  )
}
