const QUIZ_KEY = 'quizparty.quizzes.v1'
const HISTORY_KEY = 'quizparty.history.v1'
const LEGACY_SEED_KEY = 'quizparty.seeded.v1'
const LEGACY_SEED_IDS = ['seed-geography-warmup', 'seed-science-tech']

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

// One-time migration: drop the bundled demo quizzes that older builds planted
// in localStorage. User-created quizzes are never touched.
export function removeLegacySeeds() {
  const quizzes = read(QUIZ_KEY, [])
  const filtered = quizzes.filter((q) => !LEGACY_SEED_IDS.includes(q.id))
  if (filtered.length !== quizzes.length) write(QUIZ_KEY, filtered)
  localStorage.removeItem(LEGACY_SEED_KEY)
}

export function loadQuizzes() {
  return read(QUIZ_KEY, [])
}

export function saveQuizzes(quizzes) {
  write(QUIZ_KEY, quizzes)
}

export function upsertQuiz(quiz) {
  const quizzes = loadQuizzes()
  const idx = quizzes.findIndex((q) => q.id === quiz.id)
  if (idx >= 0) quizzes[idx] = quiz
  else quizzes.unshift(quiz)
  saveQuizzes(quizzes)
  return quiz
}

export function deleteQuiz(id) {
  saveQuizzes(loadQuizzes().filter((q) => q.id !== id))
}

export function newQuiz() {
  return {
    id: `quiz-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: '',
    description: '',
    createdAt: new Date().toISOString(),
    questions: [
      {
        id: `q-${Date.now()}`,
        text: '',
        answers: ['', '', '', ''],
        correctIndex: 0,
        timeLimit: 15,
      },
    ],
  }
}

export function loadHistory() {
  return read(HISTORY_KEY, [])
}

export function saveGameReport(report) {
  const history = loadHistory()
  history.unshift(report)
  write(HISTORY_KEY, history)
  return report
}

export function deleteHistoryEntry(id) {
  write(HISTORY_KEY, loadHistory().filter((h) => h.id !== id))
}

export function clearHistory() {
  write(HISTORY_KEY, [])
}
