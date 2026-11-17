import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Peer from 'peerjs'
import { loadQuizzes, saveGameReport } from '../lib/storage.js'
import { generateRoomCode, hostPeerId, sanitizeName, scoreFor } from '../lib/multiplayer.js'

const SHAPES = ['▲', '◆', '●', '■']
const ANSWER_CLASSES = ['a-0', 'a-1', 'a-2', 'a-3']

export default function HostGame({ quizId, onExit }) {
  const quiz = useMemo(() => loadQuizzes().find((q) => q.id === quizId) ?? null, [quizId])

  const [code, setCode] = useState(() => generateRoomCode())
  const [phase, setPhase] = useState('connecting') // connecting | lobby | question | reveal | board | end | error
  const [players, setPlayers] = useState([]) // [{peerId, name, score, connected}]
  const [qIndex, setQIndex] = useState(0)
  const [now, setNow] = useState(() => Date.now())
  const [endsAt, setEndsAt] = useState(0)
  const [reveal, setReveal] = useState(null) // {correctIndex, distribution}
  const [answeredCount, setAnsweredCount] = useState(0)
  const [reportSaved, setReportSaved] = useState(false)
  const [fatalError, setFatalError] = useState('')

  const peerRef = useRef(null)
  const connsRef = useRef(new Map()) // peerId -> DataConnection
  const playersRef = useRef(players)
  const phaseRef = useRef(phase)
  const qIndexRef = useRef(qIndex)
  const answersRef = useRef(new Map()) // peerId -> {choice, elapsedMs}
  const questionTimerRef = useRef(null)
  const questionResultsRef = useRef([]) // per-question results for the final report

  useEffect(() => {
    playersRef.current = players
  }, [players])
  useEffect(() => {
    phaseRef.current = phase
  }, [phase])
  useEffect(() => {
    qIndexRef.current = qIndex
  }, [qIndex])

  // Keep the screen awake while hosting — essential on phones/tablets, where
  // the display would otherwise lock mid-game and drop every player.
  useEffect(() => {
    let lock = null
    const request = async () => {
      try {
        if ('wakeLock' in navigator && document.visibilityState === 'visible') {
          lock = await navigator.wakeLock.request('screen')
        }
      } catch {
        // wake lock unavailable or denied — hosting still works, screen may just sleep
      }
    }
    request()
    const onVisibility = () => {
      if (document.visibilityState === 'visible') request()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      if (lock) lock.release().catch(() => {})
    }
  }, [])

  const broadcast = useCallback((msg) => {
    for (const conn of connsRef.current.values()) {
      try {
        conn.send(msg)
      } catch {
        // peer vanished; the close handler will mark them disconnected
      }
    }
  }, [])

  const broadcastLobby = useCallback(() => {
    broadcast({
      type: 'lobby',
      players: playersRef.current.filter((p) => p.connected).map((p) => p.name),
    })
  }, [broadcast])

  const connectedPlayers = useCallback(() => playersRef.current.filter((p) => p.connected), [])

  const startQuestion = useCallback(
    (index) => {
      if (!quiz) return
      const q = quiz.questions[index]
      answersRef.current = new Map()
      setAnsweredCount(0)
      const end = Date.now() + q.timeLimit * 1000
      setEndsAt(end)
      setNow(Date.now())
      setQIndex(index)
      setReveal(null)
      setPhase('question')
      broadcast({
        type: 'question',
        index,
        total: quiz.questions.length,
        text: q.text,
        answers: q.answers,
        timeLimit: q.timeLimit,
        endsAt: end,
      })
      if (questionTimerRef.current) clearTimeout(questionTimerRef.current)
      // small grace period for answers that were already in flight when time expired
      questionTimerRef.current = setTimeout(
        () => endQuestionRef.current?.(),
        q.timeLimit * 1000 + 1500
      )
    },
    [quiz, broadcast]
  )

  const endQuestion = useCallback(() => {
    if (phaseRef.current !== 'question' || !quiz) return
    if (questionTimerRef.current) {
      clearTimeout(questionTimerRef.current)
      questionTimerRef.current = null
    }
    const index = qIndexRef.current
    const q = quiz.questions[index]
    const timeLimitMs = q.timeLimit * 1000
    const distribution = [0, 0, 0, 0]
    const deltas = {}

    for (const [peerId, answer] of answersRef.current) {
      if (answer.choice >= 0 && answer.choice < 4) distribution[answer.choice] += 1
      deltas[peerId] =
        answer.choice === q.correctIndex ? scoreFor(answer.elapsedMs, timeLimitMs) : 0
    }

    // compute the new standings synchronously from the ref so we can broadcast consistent totals
    const next = playersRef.current.map((p) => ({
      ...p,
      score: p.score + (deltas[p.peerId] ?? 0),
    }))
    const totals = {}
    for (const p of next) totals[p.peerId] = p.score
    playersRef.current = next
    setPlayers(next)

    questionResultsRef.current[index] = {
      text: q.text,
      correctIndex: q.correctIndex,
      timeLimit: q.timeLimit,
      distribution,
      answered: answersRef.current.size,
    }

    broadcast({ type: 'reveal', correctIndex: q.correctIndex, distribution, deltas, totals })
    setReveal({ correctIndex: q.correctIndex, distribution })
    setPhase('reveal')
  }, [quiz, broadcast])

  // keep a ref so timeouts can always call the latest endQuestion
  const endQuestionRef = useRef(endQuestion)
  useEffect(() => {
    endQuestionRef.current = endQuestion
  }, [endQuestion])

  const handlePlayerMessage = useCallback(
    (conn, msg) => {
      if (!msg || typeof msg !== 'object') return

      if (msg.type === 'join') {
        if (phaseRef.current !== 'lobby') {
          conn.send({ type: 'rejected', reason: 'That game has already started. Ask the host to wait for the next one!' })
          return
        }
        const name = sanitizeName(msg.name)
        if (!playersRef.current.some((p) => p.peerId === conn.peer)) {
          const next = [...playersRef.current, { peerId: conn.peer, name, score: 0, connected: true }]
          playersRef.current = next
          setPlayers(next)
        }
        conn.send({ type: 'joined', code })
        setTimeout(broadcastLobby, 50)
        return
      }

      if (msg.type === 'answer') {
        if (phaseRef.current !== 'question') return
        if (typeof msg.q !== 'number' || msg.q !== qIndexRef.current) return
        if (answersRef.current.has(conn.peer)) return
        const choice = Number(msg.choice)
        const elapsedMs = Math.max(0, Number(msg.elapsedMs) || 0)
        answersRef.current.set(conn.peer, { choice, elapsedMs })
        setAnsweredCount(answersRef.current.size)
        try {
          conn.send({ type: 'answer-ack', q: msg.q })
        } catch {
          // player may have already seen the reveal; ignoring is fine
        }
        // early advance when every connected player has answered
        const pending = connectedPlayers().filter((p) => !answersRef.current.has(p.peerId))
        if (pending.length === 0) endQuestionRef.current?.()
      }
    },
    [code, broadcastLobby, connectedPlayers]
  )

  const finishGame = useCallback(() => {
    const standings = [...playersRef.current].sort((a, b) => b.score - a.score)
    broadcast({
      type: 'end',
      leaderboard: standings.map((p) => ({ name: p.name, score: p.score })),
    })
    setPhase('end')

    if (quiz) {
      const report = {
        id: `game-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        quizId: quiz.id,
        quizTitle: quiz.title,
        date: new Date().toISOString(),
        players: standings.map((p, i) => ({ name: p.name, score: p.score, place: i + 1 })),
        questions: questionResultsRef.current.filter(Boolean),
        winner: standings[0]?.name ?? null,
      }
      saveGameReport(report)
      setReportSaved(true)
    }
  }, [broadcast, quiz])

  // peer lifecycle: one Peer per room code
  useEffect(() => {
    setPhase('connecting')
    setFatalError('')
    const peer = new Peer(hostPeerId(code), {
      debug: 0,
      config: {
        iceServers: [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }],
      },
    })
    peerRef.current = peer

    peer.on('open', () => setPhase('lobby'))

    peer.on('error', (err) => {
      if (err?.type === 'unavailable-id') {
        // extremely rare collision; just pick a fresh code and retry
        setCode(generateRoomCode())
        return
      }
      setFatalError(
        `Connection problem (${err?.type ?? 'unknown'}). Check your internet connection and try again.`
      )
      setPhase('error')
    })

    peer.on('connection', (conn) => {
      connsRef.current.set(conn.peer, conn)

      conn.on('data', (msg) => handlePlayerMessage(conn, msg))
      const markDisconnected = () => {
        connsRef.current.delete(conn.peer)
        const next = playersRef.current.map((p) =>
          p.peerId === conn.peer ? { ...p, connected: false } : p
        )
        playersRef.current = next
        setPlayers(next)
        if (phaseRef.current === 'lobby') setTimeout(broadcastLobby, 50)
      }
      conn.on('close', markDisconnected)
      conn.on('error', markDisconnected)
    })

    return () => {
      if (questionTimerRef.current) clearTimeout(questionTimerRef.current)
      for (const conn of connsRef.current.values()) {
        try {
          conn.close()
        } catch {
          // already closed
        }
      }
      connsRef.current.clear()
      peer.destroy()
      peerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code])

  // countdown ticker during the question phase
  useEffect(() => {
    if (phase !== 'question') return undefined
    const id = setInterval(() => setNow(Date.now()), 100)
    return () => clearInterval(id)
  }, [phase])

  // auto-advance: reveal -> board -> next question / end
  useEffect(() => {
    if (phase !== 'reveal') return undefined
    const id = setTimeout(() => setPhase('board'), 4500)
    return () => clearTimeout(id)
  }, [phase])

  useEffect(() => {
    if (phase !== 'board') return undefined
    if (!quiz) return undefined
    const id = setTimeout(() => {
      if (qIndex + 1 < quiz.questions.length) startQuestion(qIndex + 1)
      else finishGame()
    }, 5000)
    return () => clearTimeout(id)
  }, [phase, qIndex, quiz, startQuestion, finishGame])

  const kickPlayer = (peerId) => {
    const conn = connsRef.current.get(peerId)
    if (conn) {
      try {
        conn.send({ type: 'kicked', reason: 'The host removed you from the lobby.' })
        conn.close()
      } catch {
        // ignore
      }
    }
    connsRef.current.delete(peerId)
    const next = playersRef.current.filter((p) => p.peerId !== peerId)
    playersRef.current = next
    setPlayers(next)
    setTimeout(broadcastLobby, 50)
  }

  const startGame = () => {
    if (connectedPlayers().length === 0 || !quiz) return
    broadcast({ type: 'start', total: quiz.questions.length })
    questionResultsRef.current = []
    startQuestion(0)
  }

  const endGameEarly = () => {
    if (window.confirm('End the game now and show final standings?')) finishGame()
  }

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code)
    } catch {
      // clipboard unavailable; the code is selectable on screen anyway
    }
  }

  // Native share sheet on phones/tablets; clipboard fallback elsewhere.
  const shareGame = async () => {
    const shareData = {
      title: 'Quiz Party',
      text: `Join my quiz “${quiz?.title ?? 'Quiz Party'}” — room code ${code}`,
      url: window.location.origin,
    }
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share(shareData)
        return
      } catch {
        return // user dismissed the share sheet — nothing to fall back to
      }
    }
    copyCode()
  }

  if (!quiz) {
    return (
      <div className="fullscreen-center">
        <div className="error-banner">That quiz could not be found — it may have been deleted.</div>
        <button className="btn" onClick={onExit}>Back to menu</button>
      </div>
    )
  }

  const q = quiz.questions[qIndex]
  const totalPlayers = players.filter((p) => p.connected).length
  const standings = [...players].sort((a, b) => b.score - a.score)
  const secondsLeft = Math.max(0, Math.ceil((endsAt - now) / 1000))

  return (
    <div className="fullscreen-center" style={{ width: '100%' }}>
      {phase === 'connecting' && (
        <div className="status-note"><span className="spinner" /> Opening room…</div>
      )}

      {phase === 'error' && (
        <>
          <div className="error-banner">{fatalError}</div>
          <button className="btn" onClick={onExit}>Back to menu</button>
        </>
      )}

      {phase === 'lobby' && (
        <>
          <h1 className="center" style={{ margin: '8px 0 0' }}>{quiz.title}</h1>
          <p className="muted center">Players open Quiz Party on their device → “Join a Game” and enter:</p>
          <div className="room-code" aria-label="Room code">{code}</div>
          <div className="lobby-actions">
            <button className="btn small" onClick={copyCode}>Copy code</button>
            <button className="btn small" onClick={shareGame}>Share invite</button>
          </div>
          <div className="player-chips">
            {players.filter((p) => p.connected).map((p) => (
              <span key={p.peerId} className="chip">
                {p.name}
                <button
                  className="btn danger small"
                  style={{ marginLeft: 8, padding: '2px 8px' }}
                  onClick={() => kickPlayer(p.peerId)}
                  aria-label={`Remove ${p.name}`}
                  title="Remove from lobby"
                >
                  ×
                </button>
              </span>
            ))}
            {totalPlayers === 0 && <p className="muted">Waiting for players…</p>}
          </div>
          <button
            className="btn primary"
            style={{ fontSize: '1.2rem', padding: '14px 42px' }}
            onClick={startGame}
            disabled={totalPlayers === 0}
          >
            Start game ({totalPlayers} {totalPlayers === 1 ? 'player' : 'players'})
          </button>
        </>
      )}

      {phase === 'question' && q && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <div className={`timer-ring${secondsLeft <= 5 ? ' low' : ''}`}>{secondsLeft}</div>
            <div className="answered-count">{answeredCount} / {totalPlayers} answered</div>
            <button className="btn ghost small" onClick={endGameEarly}>End game</button>
          </div>
          <div className="muted">Question {qIndex + 1} of {quiz.questions.length}</div>
          <h2 className="question-text">{q.text}</h2>
          <div className="answer-grid">
            {q.answers.map((answer, i) => (
              <div key={i} className={`answer-btn ${ANSWER_CLASSES[i]}`} style={{ cursor: 'default' }}>
                <span className="shape">{SHAPES[i]}</span>
                <span>{answer}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {phase === 'reveal' && q && reveal && (
        <div className="reveal-wrap">
          <h2 className="question-text">{q.text}</h2>
          <div className="answer-grid">
            {q.answers.map((answer, i) => (
              <div
                key={i}
                className={`answer-btn ${ANSWER_CLASSES[i]} ${i === reveal.correctIndex ? 'correct' : 'dim'}`}
              >
                <span className="shape">{SHAPES[i]}</span>
                <span>{answer}</span>
              </div>
            ))}
          </div>
          <DistributionBars distribution={reveal.distribution} />
        </div>
      )}

      {phase === 'board' && (
        <>
          <h2>Leaderboard</h2>
          <Leaderboard players={standings} highlightId={null} />
          <p className="muted">{qIndex + 1 < quiz.questions.length ? 'Next question coming up…' : 'Final results next…'}</p>
        </>
      )}

      {phase === 'end' && (
        <>
          <h2>🎉 Final results</h2>
          <Podium standings={standings} />
          <Leaderboard players={standings} highlightId={null} />
          {reportSaved && <div className="success-banner">Game saved to History &amp; Reports.</div>}
          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <button className="btn primary" onClick={onExit}>Back to menu</button>
          </div>
        </>
      )}
    </div>
  )
}

export function DistributionBars({ distribution }) {
  const max = Math.max(1, ...distribution)
  const colors = ['var(--answer-red)', 'var(--answer-blue)', 'var(--answer-amber)', 'var(--answer-green)']
  return (
    <div className="distribution" aria-label="Answer distribution">
      {distribution.map((count, i) => (
        <div className="dist-col" key={i}>
          <div className="dist-label">{count}</div>
          <div className="dist-bar" style={{ height: `${Math.max(6, (count / max) * 100)}px`, background: colors[i] }} />
          <div className="dist-label">{SHAPES[i]}</div>
        </div>
      ))}
    </div>
  )
}

export function Leaderboard({ players, highlightId }) {
  return (
    <div className="board">
      {players.map((p, i) => (
        <div key={p.peerId ?? p.name} className={`board-row${p.peerId === highlightId ? ' me' : ''}`}>
          <div className="board-rank">{['🥇', '🥈', '🥉'][i] ?? `#${i + 1}`}</div>
          <div className="board-name">
            {p.name}
            {p.connected === false ? ' (left)' : ''}
          </div>
          <div className="board-score">{p.score}</div>
        </div>
      ))}
    </div>
  )
}

function Podium({ standings }) {
  const [first, second, third] = standings
  const cols = [
    { place: 2, player: second, cls: 'p2' },
    { place: 1, player: first, cls: 'p1' },
    { place: 3, player: third, cls: 'p3' },
  ]
  return (
    <div className="podium">
      {cols.map(
        ({ place, player, cls }) =>
          player && (
            <div className="podium-col" key={place}>
              <div className="podium-name">{player.name}</div>
              <div className="muted">{player.score} pts</div>
              <div className={`podium-block ${cls}`}>{place}</div>
            </div>
          )
      )}
    </div>
  )
}
