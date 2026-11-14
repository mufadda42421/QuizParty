import { useCallback, useEffect, useRef, useState } from 'react'
import Peer from 'peerjs'
import { hostPeerId, sanitizeName } from '../lib/multiplayer.js'
import { Leaderboard, DistributionBars } from './HostGame.jsx'

const SHAPES = ['▲', '◆', '●', '■']
const ANSWER_CLASSES = ['a-0', 'a-1', 'a-2', 'a-3']

export default function PlayerGame({ onExit }) {
  const [name, setName] = useState(() => localStorage.getItem('quizparty.nickname') ?? '')
  const [code, setCode] = useState('')
  const [phase, setPhase] = useState('entry') // entry | connecting | lobby | question | answered | reveal | end | kicked | rejected | error
  const [error, setError] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const [lobbyPlayers, setLobbyPlayers] = useState([])
  const [question, setQuestion] = useState(null) // {index, total, text, answers, timeLimit, endsAt, receivedAt}
  const [now, setNow] = useState(() => Date.now())
  const [myChoice, setMyChoice] = useState(null)
  const [reveal, setReveal] = useState(null) // {correctIndex, distribution, myDelta, myTotal}
  const [finalBoard, setFinalBoard] = useState([]) // [{name, score}]

  const peerRef = useRef(null)
  const connRef = useRef(null)
  const myPeerIdRef = useRef(null)

  const cleanup = useCallback(() => {
    try {
      connRef.current?.close()
    } catch { /* already closed */ }
    try {
      peerRef.current?.destroy()
    } catch { /* already destroyed */ }
    connRef.current = null
    peerRef.current = null
  }, [])

  useEffect(() => cleanup, [cleanup])

  // tick while a question is on screen
  useEffect(() => {
    if (phase !== 'question') return undefined
    const id = setInterval(() => setNow(Date.now()), 100)
    return () => clearInterval(id)
  }, [phase])

  const connect = (e) => {
    e?.preventDefault()
    const trimmedCode = code.trim().toUpperCase()
    const nickname = sanitizeName(name)
    if (!/^[A-Z2-9]{5}$/.test(trimmedCode)) {
      setError('Room codes are 5 letters/digits, like K7P2X.')
      return
    }
    setError('')
    localStorage.setItem('quizparty.nickname', nickname)

    const peer = new Peer(undefined, {
      debug: 0,
      config: {
        iceServers: [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }],
      },
    })
    peerRef.current = peer
    setPhase('connecting')

    peer.on('error', (err) => {
      if (err?.type === 'peer-unavailable') {
        setError('No room found with that code. Double-check it and make sure the host started the lobby.')
      } else {
        setError(`Connection problem (${err?.type ?? 'unknown'}). Check your internet connection.`)
      }
      setPhase('entry')
      cleanup()
    })

    peer.on('open', (id) => {
      myPeerIdRef.current = id
      const conn = peer.connect(hostPeerId(trimmedCode), { reliable: true })
      connRef.current = conn

      conn.on('open', () => {
        conn.send({ type: 'join', name: nickname })
      })

      conn.on('data', (msg) => {
        if (!msg || typeof msg !== 'object') return
        switch (msg.type) {
          case 'joined':
            setPhase('lobby')
            break
          case 'rejected':
            setRejectReason(msg.reason ?? 'The host did not let you in.')
            setPhase('rejected')
            break
          case 'kicked':
            setRejectReason(msg.reason ?? 'The host removed you from the lobby.')
            setPhase('kicked')
            break
          case 'lobby':
            setLobbyPlayers(Array.isArray(msg.players) ? msg.players : [])
            break
          case 'start':
            break // questions begin with the 'question' message
          case 'question':
            setQuestion({ ...msg, receivedAt: Date.now() })
            setMyChoice(null)
            setReveal(null)
            setPhase('question')
            break
          case 'answer-ack':
            setPhase('answered')
            break
          case 'reveal': {
            const peerId = myPeerIdRef.current
            setReveal({
              correctIndex: msg.correctIndex,
              distribution: msg.distribution ?? [0, 0, 0, 0],
              myDelta: msg.deltas?.[peerId] ?? 0,
              myTotal: msg.totals?.[peerId] ?? 0,
            })
            setPhase('reveal')
            break
          }
          case 'end':
            setFinalBoard(Array.isArray(msg.leaderboard) ? msg.leaderboard : [])
            setPhase('end')
            break
          default:
            break
        }
      })

      conn.on('close', () => {
        setPhase((current) => (current === 'end' ? current : 'error'))
        setError('The host ended the connection.')
      })
      conn.on('error', () => {
        setPhase('error')
        setError('Lost the connection to the host.')
      })
    })
  }

  const answer = (choice) => {
    if (phase !== 'question' || !question) return
    const elapsedMs = Date.now() - question.receivedAt
    setMyChoice(choice)
    try {
      connRef.current?.send({ type: 'answer', q: question.index, choice, elapsedMs })
    } catch {
      setError('Could not send your answer — connection lost.')
    }
    setPhase('answered')
  }

  const secondsLeft = question ? Math.max(0, Math.ceil((question.endsAt - now) / 1000)) : 0

  if (phase === 'entry' || phase === 'connecting') {
    return (
      <form className="card" style={{ width: '100%', maxWidth: 420 }} onSubmit={connect}>
        <h1 className="center">Join a game</h1>
        {error && <div className="error-banner">{error}</div>}
        <div className="field">
          <label htmlFor="join-code">Room code</label>
          <input
            id="join-code"
            className="input"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="K7P2X"
            maxLength={5}
            autoComplete="off"
            autoCapitalize="characters"
            autoFocus
            style={{ fontSize: '1.6rem', letterSpacing: '0.3em', textAlign: 'center', fontWeight: 800 }}
          />
        </div>
        <div className="field">
          <label htmlFor="join-name">Nickname</label>
          <input
            id="join-name"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="QuizWhiz99"
            maxLength={24}
            autoComplete="off"
          />
        </div>
        <button className="btn primary" style={{ width: '100%', fontSize: '1.15rem' }} type="submit" disabled={phase === 'connecting'}>
          {phase === 'connecting' ? 'Connecting…' : 'Join!'}
        </button>
      </form>
    )
  }

  if (phase === 'lobby') {
    return (
      <div className="fullscreen-center">
        <div className="status-note"><span className="spinner" /> You're in! Waiting for the host to start…</div>
        <div className="player-chips">
          {lobbyPlayers.map((player) => (
            <span key={player} className="chip">{player}</span>
          ))}
        </div>
      </div>
    )
  }

  if (phase === 'question' || phase === 'answered') {
    const lockedIn = phase === 'answered'
    return (
      <div className="fullscreen-center" style={{ width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div className={`timer-ring${secondsLeft <= 5 ? ' low' : ''}`}>{secondsLeft}</div>
          <div className="muted">Question {(question?.index ?? 0) + 1} of {question?.total}</div>
        </div>
        <h2 className="question-text">{question?.text}</h2>
        <div className="answer-grid">
          {(question?.answers ?? []).map((answerText, i) => (
            <button
              key={i}
              className={`answer-btn ${ANSWER_CLASSES[i]}${lockedIn && myChoice !== i ? ' dim' : ''}`}
              onClick={() => answer(i)}
              disabled={lockedIn}
            >
              <span className="shape">{SHAPES[i]}</span>
              <span>{answerText}</span>
            </button>
          ))}
        </div>
        {lockedIn && <div className="status-note">Answer locked in — waiting for everyone else…</div>}
      </div>
    )
  }

  if (phase === 'reveal' && reveal && question) {
    const wasCorrect = myChoice === reveal.correctIndex
    return (
      <div className="fullscreen-center">
        <div style={{ fontSize: '3.5rem' }}>{wasCorrect ? '✅' : '❌'}</div>
        <h2 className="center">{wasCorrect ? 'Correct!' : 'Not quite'}</h2>
        <p className="muted">Correct answer: <strong>{question.answers[reveal.correctIndex]}</strong></p>
        <p style={{ fontSize: '1.4rem', fontWeight: 800 }}>
          +{reveal.myDelta} pts · total <span style={{ color: 'var(--gold)' }}>{reveal.myTotal}</span>
        </p>
        <DistributionBars distribution={reveal.distribution} />
        <p className="muted">Waiting for the next question…</p>
      </div>
    )
  }

  if (phase === 'end') {
    const me = name.trim()
    const myRank = finalBoard.findIndex((p) => p.name === me) + 1
    return (
      <div className="fullscreen-center" style={{ width: '100%' }}>
        <h2>🎉 Game over!</h2>
        {myRank > 0 && <p className="muted">You finished #{myRank}</p>}
        <Leaderboard players={finalBoard.map((p) => ({ ...p, peerId: p.name }))} highlightId={me} />
        <button className="btn primary" style={{ marginTop: 16 }} onClick={onExit}>Back to menu</button>
      </div>
    )
  }

  if (phase === 'kicked' || phase === 'rejected') {
    return (
      <div className="fullscreen-center">
        <div className="error-banner">{rejectReason}</div>
        <button className="btn" onClick={onExit}>Back to menu</button>
      </div>
    )
  }

  return (
    <div className="fullscreen-center">
      <div className="error-banner">{error || 'Something went wrong.'}</div>
      <button className="btn" onClick={onExit}>Back to menu</button>
    </div>
  )
}
