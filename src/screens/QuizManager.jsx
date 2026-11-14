import { useEffect, useState } from 'react'
import { deleteQuiz, loadQuizzes, newQuiz, upsertQuiz } from '../lib/storage.js'

const ANSWER_COLORS = ['#e6492d', '#2d7ff0', '#e0a100', '#1faa59']
const TIME_OPTIONS = [5, 10, 15, 20, 30, 60]

export default function QuizManager({ onHostQuiz }) {
  const [quizzes, setQuizzes] = useState([])
  const [editing, setEditing] = useState(null) // working copy of a quiz, or null
  const [error, setError] = useState('')

  useEffect(() => {
    setQuizzes(loadQuizzes())
  }, [])

  const refresh = () => setQuizzes(loadQuizzes())

  const startNew = () => {
    setError('')
    setEditing(newQuiz())
  }

  const startEdit = (quiz) => {
    setError('')
    setEditing(JSON.parse(JSON.stringify(quiz)))
  }

  const removeQuiz = (quiz) => {
    if (window.confirm(`Delete “${quiz.title || 'Untitled quiz'}”? This cannot be undone.`)) {
      deleteQuiz(quiz.id)
      refresh()
    }
  }

  const updateEditing = (patch) => setEditing((q) => ({ ...q, ...patch }))

  const updateQuestion = (qIndex, patch) =>
    setEditing((quiz) => {
      const questions = quiz.questions.map((q, i) => (i === qIndex ? { ...q, ...patch } : q))
      return { ...quiz, questions }
    })

  const updateAnswer = (qIndex, aIndex, value) =>
    setEditing((quiz) => {
      const questions = quiz.questions.map((q, i) => {
        if (i !== qIndex) return q
        const answers = q.answers.map((a, j) => (j === aIndex ? value : a))
        return { ...q, answers }
      })
      return { ...quiz, questions }
    })

  const addQuestion = () =>
    setEditing((quiz) => ({
      ...quiz,
      questions: [
        ...quiz.questions,
        {
          id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          text: '',
          answers: ['', '', '', ''],
          correctIndex: 0,
          timeLimit: 15,
        },
      ],
    }))

  const removeQuestion = (qIndex) =>
    setEditing((quiz) => ({
      ...quiz,
      questions: quiz.questions.filter((_, i) => i !== qIndex),
    }))

  const save = () => {
    const title = editing.title.trim()
    if (!title) return setError('Give your quiz a title.')
    if (editing.questions.length === 0) return setError('Add at least one question.')
    for (const [i, q] of editing.questions.entries()) {
      if (!q.text.trim()) return setError(`Question ${i + 1} is missing its text.`)
      if (q.answers.some((a) => !a.trim()))
        return setError(`Question ${i + 1} needs all four answers filled in.`)
    }
    const clean = {
      ...editing,
      title,
      description: editing.description.trim(),
      questions: editing.questions.map((q) => ({
        ...q,
        text: q.text.trim(),
        answers: q.answers.map((a) => a.trim()),
      })),
    }
    upsertQuiz(clean)
    setEditing(null)
    setError('')
    refresh()
  }

  if (editing) {
    return (
      <div className="editor">
        <h1>{editing.questions.length ? 'Edit quiz' : 'New quiz'}</h1>
        {error && <div className="error-banner">{error}</div>}

        <div className="card" style={{ marginBottom: 16 }}>
          <div className="field">
            <label htmlFor="quiz-title">Title</label>
            <input
              id="quiz-title"
              className="input"
              value={editing.title}
              onChange={(e) => updateEditing({ title: e.target.value })}
              placeholder="e.g. Office Trivia Friday"
              autoFocus
            />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="quiz-desc">Description (optional)</label>
            <textarea
              id="quiz-desc"
              className="input"
              value={editing.description}
              onChange={(e) => updateEditing({ description: e.target.value })}
              placeholder="What is this quiz about?"
            />
          </div>
        </div>

        {editing.questions.map((q, qIndex) => (
          <div key={q.id} className="editor-question">
            <div className="field">
              <label htmlFor={`q-${q.id}`}>Question {qIndex + 1}</label>
              <input
                id={`q-${q.id}`}
                className="input"
                value={q.text}
                onChange={(e) => updateQuestion(qIndex, { text: e.target.value })}
                placeholder="Type the question…"
              />
            </div>
            {q.answers.map((answer, aIndex) => (
              <div className="answer-edit" key={aIndex}>
                <input
                  type="radio"
                  name={`correct-${q.id}`}
                  checked={q.correctIndex === aIndex}
                  onChange={() => updateQuestion(qIndex, { correctIndex: aIndex })}
                  aria-label={`Mark answer ${aIndex + 1} as correct`}
                  title="Correct answer"
                />
                <span className="swatch" style={{ background: ANSWER_COLORS[aIndex] }} />
                <input
                  className="input"
                  value={answer}
                  onChange={(e) => updateAnswer(qIndex, aIndex, e.target.value)}
                  placeholder={`Answer ${aIndex + 1}`}
                  aria-label={`Answer ${aIndex + 1}`}
                />
              </div>
            ))}
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 10 }}>
              <label className="muted" htmlFor={`time-${q.id}`} style={{ fontSize: '.85rem', fontWeight: 700 }}>
                Time limit
              </label>
              <select
                id={`time-${q.id}`}
                className="input"
                style={{ width: 'auto' }}
                value={q.timeLimit}
                onChange={(e) => updateQuestion(qIndex, { timeLimit: Number(e.target.value) })}
              >
                {TIME_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}s
                  </option>
                ))}
              </select>
              {editing.questions.length > 1 && (
                <button className="btn danger small" onClick={() => removeQuestion(qIndex)}>
                  Remove question
                </button>
              )}
            </div>
          </div>
        ))}

        <div className="editor-actions">
          <button className="btn" onClick={addQuestion}>+ Add question</button>
          <button className="btn primary" onClick={save}>Save quiz</button>
          <button className="btn ghost" onClick={() => setEditing(null)}>Cancel</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>My Quizzes</h1>
        <button className="btn primary" onClick={startNew}>+ New quiz</button>
      </div>

      {quizzes.length === 0 ? (
        <div className="card center">
          <p>No quizzes yet. Create your first one!</p>
          <button className="btn primary" onClick={startNew}>+ New quiz</button>
        </div>
      ) : (
        <div className="quiz-list">
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="card quiz-card">
              <h3>{quiz.title}</h3>
              <p>{quiz.description || 'No description'}</p>
              <p className="muted">
                {quiz.questions.length} question{quiz.questions.length === 1 ? '' : 's'}
              </p>
              <div className="row">
                <button className="btn primary small" onClick={() => onHostQuiz(quiz.id)}>▶ Host</button>
                <button className="btn small" onClick={() => startEdit(quiz)}>Edit</button>
                <button className="btn danger small" onClick={() => removeQuiz(quiz)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
