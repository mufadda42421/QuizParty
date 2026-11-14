import { useCallback, useEffect, useState } from 'react'
import Landing from './screens/Landing.jsx'
import Menu from './screens/Menu.jsx'
import QuizManager from './screens/QuizManager.jsx'
import HostGame from './screens/HostGame.jsx'
import PlayerGame from './screens/PlayerGame.jsx'
import History from './screens/History.jsx'
import Logo from './components/Logo.jsx'
import { removeLegacySeeds } from './lib/storage.js'

export default function App() {
  const [screen, setScreen] = useState('landing')
  const [hostQuizId, setHostQuizId] = useState(null)

  useEffect(() => {
    removeLegacySeeds()
  }, [])

  const goMenu = useCallback(() => setScreen('menu'), [])
  const startHosting = useCallback((quizId) => {
    setHostQuizId(quizId)
    setScreen('host')
  }, [])

  // The landing page is full-screen, with no chrome.
  if (screen === 'landing') {
    return <Landing onGetStarted={goMenu} />
  }

  return (
    <div className="screen">
      <header className="topbar">
        <button className="logo-btn" onClick={goMenu} aria-label="Quiz Party menu">
          <Logo size={30} />
          <span className="logo-word">Quiz Party</span>
        </button>
        <nav className="topnav" aria-label="Primary">
          <button className={`navlink${screen === 'menu' ? ' active' : ''}`} onClick={goMenu}>Menu</button>
          <button className={`navlink${screen === 'player' ? ' active' : ''}`} onClick={() => setScreen('player')}>Join</button>
          <button className={`navlink${screen === 'quizzes' ? ' active' : ''}`} onClick={() => setScreen('quizzes')}>My Quizzes</button>
          <button className={`navlink${screen === 'history' ? ' active' : ''}`} onClick={() => setScreen('history')}>Reports</button>
        </nav>
      </header>

      {screen === 'menu' && <Menu onNavigate={setScreen} />}
      {screen === 'quizzes' && <QuizManager onHostQuiz={startHosting} />}
      {screen === 'host' && <HostGame quizId={hostQuizId} onExit={goMenu} />}
      {screen === 'player' && <PlayerGame onExit={goMenu} />}
      {screen === 'history' && <History />}
    </div>
  )
}
