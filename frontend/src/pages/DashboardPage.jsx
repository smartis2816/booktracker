import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getBooks } from '../api/books'
import { getGoals } from '../api/goals'
import Spinner from '../components/ui/Spinner'

const DashboardPage = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [readingBooks, setReadingBooks] = useState([])
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getBooks({ status: 'reading' }),
      getGoals(),
    ])
      .then(([bRes, gRes]) => {
        setReadingBooks(bRes.data)
        setGoals(gRes.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    )
  }

  const current   = readingBooks[0]
  const monthGoal = goals.find(g => g.period_type === 'month')
  const yearGoal  = goals.find(g => g.period_type === 'year')
  const activeGoal = monthGoal || yearGoal

  return (
    <div className="flex flex-col gap-6">

      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight"
            style={{ color: 'var(--text)' }}>
            Дашборд
          </h1>
          <p className="text-sm mt-1.5" style={{ color: 'var(--muted)' }}>
            Добро пожаловать, {user?.username} 👋
          </p>
        </div>
        <button
          onClick={() => navigate('/library')}
          className="inline-flex items-center gap-2 px-4 py-[11px] rounded-md
            text-sm font-bold text-white transition-colors duration-150"
          style={{ background: 'var(--green)' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#265c36')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--green)')}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <span>Добавить книгу</span>
        </button>
      </div>

      {/* Текущая книга + цель */}
      <section className="grid gap-6" style={{ gridTemplateColumns: '1fr 340px', minHeight: 280 }}>

        {/* Читаемая книга */}
        {current ? (
          <article
            className="rounded-xl p-6 flex gap-5 text-white"
            style={{ background: 'var(--green-dark)' }}
          >
            {/* Обложка-заглушка или реальная */}
            <div
              className="w-[130px] flex-shrink-0 rounded-lg flex items-center justify-center p-3"
              style={{ background: 'var(--green)' }}
            >
              {current.book.cover_url ? (
                <img
                  src={current.book.cover_url} alt={current.book.title}
                  className="w-full h-full object-cover rounded-md"
                />
              ) : (
                <span
                  className="text-sm font-extrabold text-white text-center leading-tight"
                  style={{ wordSpacing: '9999px' }}
                >
                  {current.book.title.toUpperCase()}
                </span>
              )}
            </div>

            <div className="flex-1 flex flex-col gap-3 min-w-0">
              <span
                className="self-start text-xs font-bold px-2.5 py-1.5 rounded-md"
                style={{ background: 'var(--green)' }}
              >
                Читаю
              </span>
              <h2 className="text-3xl font-extrabold leading-tight tracking-tight">
                {current.book.title}
              </h2>
              <p className="text-sm" style={{ color: '#D9E8DC' }}>
                {current.book.authors?.map(a => a.name).join(', ')}
                {' · '}{current.current_page} / {current.book.total_pages || '?'} стр.
              </p>
              <div className="w-full h-3 rounded-full" style={{ background: '#3B5440' }}>
                <div
                  className="h-3 rounded-full transition-all duration-500"
                  style={{ width: `${current.progress_percent}%`, background: '#fff' }}
                />
              </div>
              <button
                onClick={() => navigate(`/library/${current.id}`)}
                className="self-start inline-flex items-center justify-center
                  px-5 h-11 rounded-md text-sm font-extrabold
                  transition-colors duration-150"
                style={{ background: '#fff', color: 'var(--green-dark)' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#D9E8DC')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
              >
                Обновить прогресс
              </button>
            </div>
          </article>
        ) : (
          <article
            className="rounded-xl p-6 flex flex-col items-center justify-center gap-4 text-center text-white"
            style={{ background: 'var(--green-dark)' }}
          >
            <p className="text-base">Вы сейчас ничего не читаете</p>
            <button
              onClick={() => navigate('/library')}
              className="px-4 py-2.5 rounded-md text-sm font-bold text-white"
              style={{ background: 'var(--green)' }}
            >
              Перейти в библиотеку
            </button>
          </article>
        )}

        {/* Цель */}
        {activeGoal ? (
          <article className="bg-white rounded-xl border border-[#D6E1D5] p-6 flex flex-col gap-3.5">
            <span className="text-sm font-bold" style={{ color: 'var(--muted)' }}>
              {activeGoal.period_type === 'month' ? 'Цель месяца' : 'Годовая цель'}
            </span>
            <span className="text-[42px] font-bold leading-none font-mono"
              style={{ color: 'var(--text)' }}>
              {activeGoal.current_value} / {activeGoal.target}
            </span>
            <p className="text-sm leading-snug" style={{ color: '#334B36' }}>
              {activeGoal.measure_type === 'pages' ? 'страниц прочитано' : 'книг прочитано'}.
              {' '}Осталось {Math.max(0, activeGoal.target - activeGoal.current_value)}.
            </p>
            <div className="w-full h-4 rounded-full" style={{ background: '#E2E9E1' }}>
              <div
                className="h-4 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(activeGoal.progress_percent, 100)}%`,
                  background: 'var(--green)',
                }}
              />
            </div>
          </article>
        ) : (
          <article className="bg-white rounded-xl border border-[#D6E1D5] p-6
            flex flex-col items-center justify-center gap-3 text-center">
            <p className="text-sm" style={{ color: 'var(--muted)' }}>Нет активных целей</p>
            <button
              onClick={() => navigate('/goals')}
              className="px-4 py-2.5 rounded-md text-sm font-bold text-white"
              style={{ background: 'var(--green)' }}
            >
              Поставить цель
            </button>
          </article>
        )}

      </section>

      {/* KPI */}
      <section className="grid grid-cols-4 gap-4">
        {[
          { label: 'Читаю сейчас',   value: readingBooks.length },
          { label: 'Целей активно',  value: goals.length },
          {
            label: 'Прогресс книги',
            value: current ? `${current.progress_percent}%` : '—',
          },
          {
            label: 'Выполнение цели',
            value: activeGoal ? `${activeGoal.progress_percent}%` : '—',
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="bg-white border border-[#D6E1D5] rounded-xl p-[18px] flex flex-col gap-2"
          >
            <span className="text-xs font-bold" style={{ color: 'var(--muted)' }}>
              {kpi.label}
            </span>
            <span className="text-[38px] font-bold leading-none font-mono"
              style={{ color: 'var(--text)' }}>
              {kpi.value}
            </span>
          </div>
        ))}
      </section>

      {/* Очередь + цели */}
      <section className="grid gap-6" style={{ gridTemplateColumns: '520px 1fr' }}>

        {/* Очередь */}
        <article className="bg-white border border-[#D6E1D5] rounded-xl p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-extrabold" style={{ color: 'var(--text)' }}>
              Очередь чтения
            </h3>
            <button
              onClick={() => navigate('/library')}
              className="text-sm font-bold"
              style={{ color: 'var(--green)' }}
            >
              Вся библиотека →
            </button>
          </div>

          {readingBooks.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Добавьте книгу со статусом «Хочу прочитать».
            </p>
          ) : (
            <ul>
              {readingBooks.slice(0, 4).map((b) => (
                <li
                  key={b.id}
                  onClick={() => navigate(`/library/${b.id}`)}
                  className="flex items-center justify-between h-12
                    border-b border-[#D6E1D5] last:border-0 cursor-pointer group"
                >
                  <span
                    className="text-sm font-bold transition-colors duration-150
                      group-hover:text-[#2D6B3F]"
                    style={{ color: 'var(--text)' }}
                  >
                    {b.book.title}
                  </span>
                  <span className="text-sm font-mono" style={{ color: 'var(--muted)' }}>
                    {b.progress_percent}%
                  </span>
                </li>
              ))}
            </ul>
          )}
        </article>

        {/* Цели */}
        <article className="bg-white border border-[#D6E1D5] rounded-xl p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-extrabold" style={{ color: 'var(--text)' }}>
              Цели чтения
            </h3>
            <button
              onClick={() => navigate('/goals')}
              className="text-sm font-bold"
              style={{ color: 'var(--green)' }}
            >
              Все цели →
            </button>
          </div>

          {goals.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Нет активных целей
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {goals.slice(0, 3).map((goal) => (
                <div key={goal.id} className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--text)' }}>
                      {goal.period_type === 'year' ? 'Год' : 'Месяц'}:
                      {' '}{goal.target}{' '}
                      {goal.measure_type === 'books' ? 'книг' : 'стр.'}
                    </span>
                    <span
                      className="font-bold font-mono"
                      style={{ color: 'var(--green)' }}
                    >
                      {goal.progress_percent}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full" style={{ background: '#E2E9E1' }}>
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min(goal.progress_percent, 100)}%`,
                        background: 'var(--green)',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>

      </section>

    </div>
  )
}

export default DashboardPage
