import { useState, useEffect } from 'react'
import { getStats } from '../../api/stats'
import Spinner from '../../components/ui/Spinner'
import Portal from '../../components/ui/Portal'
import useMousePosition from '../../hooks/useMousePosition'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie,
  Cell, Legend,
} from 'recharts'

const GENRE_COLORS = [
  '#2D6B3F', '#73966F', '#A9BE89', '#1E3322',
  '#3B5440', '#6B7B6B', '#D9E8DC', '#BFD6C3',
]

const StatsPage = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await getStats()
      setStats(response.data)
    } catch {
      setError('Не удалось загрузить статистику.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  const {
    summary, genres, top_authors,
    monthly_reading, weekly_reading, calendar
  } = stats

  const hasData = monthly_reading.length > 0
    || genres.length > 0
    || calendar.length > 0

  return (
    <div className="flex flex-col gap-8">

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Статистика</h1>
        <p className="text-gray-500 text-sm mt-1">
          Ваша читательская активность
        </p>
      </div>

      <SummarySection summary={summary} />

      {monthly_reading.length > 0 && (
        <MonthlyChart data={monthly_reading} />
      )}

      {weekly_reading.length > 0 && (
        <WeeklyChart data={weekly_reading} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {genres.length > 0 && (
          <GenresChart genres={genres} />
        )}
        {top_authors.length > 0 && (
          <AuthorsTable authors={top_authors} />
        )}
      </div>

      {calendar.length > 0 && (
        <CalendarSection calendar={calendar} />
      )}

      {!hasData && <EmptyState />}

    </div>
  )
}

const SummarySection = ({ summary }) => {
  const cards = [
    {
      label: 'Всего книг',
      value: summary.total_books,
      icon: '📚',
      color: 'bg-[#E1F0E3] border-[#B7D0B9]',
    },
    {
      label: 'Прочитано',
      value: summary.finished_books,
      icon: '✅',
      color: 'bg-[#E1F0E3] border-[#B7D0B9]',
    },
    {
      label: 'Читаю сейчас',
      value: summary.reading_books,
      icon: '📖',
      color: 'bg-[#EEF4ED] border-[#D6E1D5]',
    },
    {
      label: 'Страниц прочитано',
      value: summary.total_pages_read.toLocaleString('ru-RU'),
      icon: '📄',
      color: 'bg-[#F3F7F2] border-[#D6E1D5]',
    },
    {
      label: 'Средняя оценка',
      value: summary.average_rating
        ? `${summary.average_rating} ★`
        : '—',
      icon: '⭐',
      color: 'bg-[#EEF4ED] border-[#D6E1D5]',
    },
    {
      label: 'Хочу прочитать',
      value: summary.want_to_read_books,
      icon: '🔖',
      color: 'bg-[#F7FAF6] border-[#D6E1D5]',
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`border rounded-xl p-4 flex flex-col gap-2 ${card.color}`}
        >
          <span className="text-2xl">{card.icon}</span>
          <div>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

const MonthlyChart = ({ data }) => {
  const formattedData = data.map(item => ({
    ...item,
    monthLabel: formatMonth(item.month),
  }))

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h2 className="text-base font-semibold text-gray-900 mb-6">
        Страниц прочитано по месяцам
      </h2>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart
          data={formattedData}
          margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="monthLabel"
            tick={{ fontSize: 12, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(value) => [`${value} стр.`, 'Страниц']}
            contentStyle={{
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              fontSize: '13px',
            }}
          />
          <Bar dataKey="pages" fill="#2D6B3F" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

const WeeklyChart = ({ data }) => {
  const formattedData = data.map(item => ({
    ...item,
    weekLabel: formatWeek(item.week),
  }))

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h2 className="text-base font-semibold text-gray-900 mb-6">
        Страниц прочитано по неделям (последние 12 недель)
      </h2>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart
          data={formattedData}
          margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="weekLabel"
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(value) => [`${value} стр.`, 'Страниц']}
            contentStyle={{
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              fontSize: '13px',
            }}
          />
          <Bar dataKey="pages" fill="#73966F" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

const GenresChart = ({ genres }) => {
  const topGenres = genres.slice(0, 7)
  const otherCount = genres
    .slice(7)
    .reduce((sum, g) => sum + g.count, 0)

  const data = otherCount > 0
    ? [...topGenres, { genre: 'Другие', count: otherCount }]
    : topGenres

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h2 className="text-base font-semibold text-gray-900 mb-6">
        Распределение по жанрам
      </h2>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="genre"
            cx="50%"
            cy="50%"
            outerRadius={90}
            innerRadius={40}
            paddingAngle={3}
          >
            {data.map((_, index) => (
              <Cell
                key={index}
                fill={GENRE_COLORS[index % GENRE_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => [`${value} кн.`, name]}
            contentStyle={{
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              fontSize: '13px',
            }}
          />
          <Legend
            formatter={(value) => (
              <span style={{ fontSize: '12px', color: '#6b7280' }}>
                {value}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

const AuthorsTable = ({ authors }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-6">
    <h2 className="text-base font-semibold text-gray-900 mb-4">
      Топ авторов
    </h2>
    <div className="flex flex-col gap-3">
      {authors.map((author, index) => (
        <div key={author.author} className="flex items-center gap-3">
          <span className={`w-6 h-6 rounded-full flex items-center
            justify-center text-xs font-bold flex-shrink-0
            ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
              index === 1 ? 'bg-gray-100 text-gray-600' :
              index === 2 ? 'bg-orange-100 text-orange-700' :
              'bg-gray-50 text-gray-400'
            }`}>
            {index + 1}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {author.author}
            </p>
            {author.avg_rating && (
              <p className="text-xs text-gray-400">★ {author.avg_rating}</p>
            )}
          </div>
          <span className="text-sm font-semibold text-blue-600 flex-shrink-0">
            {author.books_count} кн.
          </span>
        </div>
      ))}
    </div>
  </div>
)

const CalendarSection = ({ calendar }) => {
  const [hoveredDay, setHoveredDay] = useState(null)
  const mousePosition = useMousePosition()

  const calendarMap = {}
  calendar.forEach(item => {
    calendarMap[item.date] = item
  })

  const today = new Date()
  const days = []
  for (let i = 83; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(today.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    days.push({
      date: dateStr,
      data: calendarMap[dateStr] || null,
    })
  }

  const weeks = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }

  const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

  const tooltipStyle = {
    position: 'fixed',
    left: mousePosition.x + 16,
    top: mousePosition.y - 8,
    transform: mousePosition.x > window.innerWidth - 220
      ? 'translateX(calc(-100% - 32px))'
      : 'none',
    ...(mousePosition.y < 100 && { top: mousePosition.y + 24 }),
    zIndex: 9999,
    pointerEvents: 'none',
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h2 className="text-base font-semibold text-gray-900 mb-6">
        Календарь чтения (последние 12 недель)
      </h2>

      <div className="flex gap-2">

        {/* Подписи дней */}
        <div className="flex flex-col gap-1 pt-6">
          {dayNames.map(day => (
            <div key={day}
              className="h-8 flex items-center text-xs text-gray-400 w-6">
              {day}
            </div>
          ))}
        </div>

        {/* Сетка */}
        <div className="flex gap-1 overflow-x-auto pb-2">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1">

              {/* Подпись месяца */}
              <div className="h-6 flex items-center">
                {week[0] && isFirstDayOfMonth(week[0].date) && (
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {formatMonthShort(week[0].date)}
                  </span>
                )}
              </div>

              {/* Дни */}
              {week.map((day, dayIndex) => {
                const pages = day.data?.pages_read || 0
                const level = getHeatLevel(pages)
                const color = getHeatColor(level)

                return (
                  <div
                    key={dayIndex}
                    className={`w-8 h-8 rounded-sm ${color}
                      transition-opacity
                      ${day.data ? 'cursor-default hover:opacity-70' : ''}`}
                    onMouseEnter={() => day.data && setHoveredDay(day)}
                    onMouseLeave={() => setHoveredDay(null)}
                  />
                )
              })}

            </div>
          ))}
        </div>

      </div>

      {/* Легенда */}
      <div className="flex items-center gap-2 mt-4">
        <span className="text-xs text-gray-400">Меньше</span>
        {[0, 1, 2, 3, 4].map(level => (
          <div
            key={level}
            className={`w-4 h-4 rounded-sm ${getHeatColor(level)}`}
          />
        ))}
        <span className="text-xs text-gray-400">Больше</span>
      </div>

      {hoveredDay && (
        <Portal>
          <div style={tooltipStyle}
            className="bg-gray-800 text-white text-xs rounded-lg
              px-3 py-2 shadow-xl max-w-48">
            <p className="font-medium">
              {formatDateFull(hoveredDay.date)}
            </p>
            <p className="text-gray-300 mt-0.5">
              {hoveredDay.data.pages_read} страниц
            </p>
            {hoveredDay.data.books?.length > 0 && (
              <p className="text-gray-400 mt-0.5 leading-relaxed">
                {hoveredDay.data.books.join(', ')}
              </p>
            )}
          </div>
        </Portal>
      )}

    </div>
  )
}

const EmptyState = () => (
  <div className="py-20 flex flex-col items-center gap-4 text-center">
    <div className="w-16 h-16 bg-gray-100 rounded-full
      flex items-center justify-center">
      <svg className="w-8 h-8 text-gray-400" fill="none"
        stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
      </svg>
    </div>
    <div>
      <p className="text-gray-700 font-medium">Статистики пока нет</p>
      <p className="text-gray-400 text-sm mt-1">
        Начните читать и отмечать прогресс — здесь появятся ваши данные
      </p>
    </div>
  </div>
)

const getHeatLevel = (pages) => {
  if (pages === 0) return 0
  if (pages < 20)  return 1
  if (pages < 50)  return 2
  if (pages < 100) return 3
  return 4
}

const getHeatColor = (level) => {
  const colors = {
    0: 'bg-[#F3F7F2]',
    1: 'bg-[#DDEBDD]',
    2: 'bg-[#B7D0B9]',
    3: 'bg-[#2D6B3F]',
    4: 'bg-[#1E3322]',
  }
  return colors[level] || 'bg-[#F3F7F2]'
}

const isFirstDayOfMonth = (dateStr) => dateStr.endsWith('-01')

const formatMonth = (monthStr) => {
  const [year, month] = monthStr.split('-')
  const date = new Date(year, month - 1)
  return date.toLocaleDateString('ru-RU', { month: 'short', year: '2-digit' })
}

const formatMonthShort = (dateStr) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('ru-RU', { month: 'short' })
}

const formatWeek = (weekStr) => {
  const date = new Date(weekStr)
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short'
  })
}

const formatDateFull = (dateStr) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default StatsPage
