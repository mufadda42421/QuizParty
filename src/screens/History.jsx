import { useEffect, useState } from 'react'
import { clearHistory, deleteHistoryEntry, loadHistory } from '../lib/storage.js'

const SHAPES = ['▲', '◆', '●', '■']

export default function History() {
  const [entries, setEntries] = useState([])
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    setEntries(loadHistory())
  }, [])

  const refresh = (list) => {
    setEntries(list ?? loadHistory())
    if (selected) {
      const stillThere = (list ?? loadHistory()).find((e) => e.id === selected.id)
      setSelected(stillThere ?? null)
    }
  }

  const remove = (entry) => {
    if (window.confirm('Delete this game report?')) {
      deleteHistoryEntry(entry.id)
      setSelected(null)
      refresh()
    }
  }

  const clearAll = () => {
    if (window.confirm('Delete all game reports?')) {
      clearHistory()
      setSelected(null)
      refresh([])
    }
  }

  if (selected) {
    return (
      <div style={{ width: '100%', maxWidth: 760 }}>
        <button className="btn ghost small" onClick={() => setSelected(null)}>← All reports</button>
        <h1>{selected.quizTitle}</h1>
        <p className="muted">{new Date(selected.date).toLocaleString()} · winner: {selected.winner ?? '—'}</p>

        <div className="card" style={{ marginBottom: 16 }}>
          <h2 style={{ marginTop: 0 }}>Final standings</h2>
          {selected.players.map((p, i) => (
            <div key={i} className="board-row" style={{ marginBottom: 8 }}>
              <div className="board-rank">{['🥇', '🥈', '🥉'][i] ?? `#${i + 1}`}</div>
              <div className="board-name">{p.name}</div>
              <div className="board-score">{p.score}</div>
            </div>
          ))}
        </div>

        <div className="card">
          <h2 style={{ marginTop: 0 }}>Question breakdown</h2>
          {selected.questions.length === 0 && <p className="muted">No question data was recorded.</p>}
          {selected.questions.map((q, i) => {
            const max = Math.max(1, ...(q.distribution ?? [1]))
            return (
              <div key={i} className="q-stat">
                <p style={{ margin: '0 0 6px' }}>
                  <strong>Q{i + 1}.</strong> {q.text}
                </p>
                <p className="muted" style={{ margin: '0 0 6px' }}>
                  Correct: {SHAPES[q.correctIndex]} · {q.answered ?? 0} answered
                </p>
                <div className="distribution" style={{ height: 70 }}>
                  {(q.distribution ?? [0, 0, 0, 0]).map((count, j) => (
                    <div className="dist-col" key={j}>
                      <div className="dist-label" style={{ fontSize: '.8rem' }}>{count}</div>
                      <div
                        className="dist-bar"
                        style={{
                          height: `${Math.max(4, (count / max) * 40)}px`,
                          background: ['var(--answer-red)', 'var(--answer-blue)', 'var(--answer-amber)', 'var(--answer-green)'][j],
                          outline: j === q.correctIndex ? '2px solid #fff' : 'none',
                        }}
                      />
                      <div className="dist-label" style={{ fontSize: '.8rem' }}>{SHAPES[j]}</div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        <div className="editor-actions">
          <button className="btn danger" onClick={() => remove(selected)}>Delete report</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>History &amp; Reports</h1>
        {entries.length > 0 && <button className="btn danger small" onClick={clearAll}>Clear all</button>}
      </div>

      {entries.length === 0 ? (
        <div className="card center">
          <p>No games played yet. Host one and it will show up here.</p>
        </div>
      ) : (
        <div className="history-list">
          {entries.map((entry) => (
            <div key={entry.id} className="card history-item">
              <div className="grow">
                <h3>{entry.quizTitle}</h3>
                <p>
                  {new Date(entry.date).toLocaleString()} · {entry.players.length}{' '}
                  {entry.players.length === 1 ? 'player' : 'players'} · winner{' '}
                  <strong>{entry.winner ?? '—'}</strong>
                </p>
              </div>
              <button className="btn small" onClick={() => setSelected(entry)}>View</button>
              <button className="btn danger small" onClick={() => remove(entry)}>Delete</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
