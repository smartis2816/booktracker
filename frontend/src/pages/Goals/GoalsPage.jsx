import { useState, useEffect } from 'react'
import { getGoals, createGoal, updateGoal, deleteGoal } from '../../api/goals'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import Modal from '../../components/ui/Modal'

const PERIOD_OPTIONS = [
  { value: 'year',  label: 'Год'   },
  { value: 'month', label: 'Месяц' },
]

const MEASURE_OPTIONS = [
  { value: 'books', label: 'Книги'    },
  { value: 'pages', label: 'Страницы' },
]

const EMPTY_FORM = {
  period_type:  'year',
  measure_type: 'books',
  target:       '',
  period_start: '',
  period_end:   '',
}

const GoalsPage = () => {
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState(null)

  useEffect(() => {
    fetchGoals()
  }, [])

  const fetchGoals = async () => {
    setLoading(true)
    try {
      const response = await getGoals()
      setGoals(response.data)
    } catch {
    } finally {
      setLoading(false)
    }
  }

  const handleOpenCreate = () => {
    setEditingGoal(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (goal) => {
    setEditingGoal(goal)
    setIsModalOpen(true)
  }

  const handleSaved = (savedGoal, isNew) => {
    if (isNew) {
      setGoals(prev => [savedGoal, ...prev])
    } else {
      setGoals(prev => prev.map(g => g.id === savedGoal.id ? savedGoal : g))
    }
    setIsModalOpen(false)
  }

  const handleDelete = async (goalId) => {
    if (!window.confirm('Удалить цель?')) return
    try {
      await deleteGoal(goalId)
      setGoals(prev => prev.filter(g => g.id !== goalId))
    } catch {
      alert('Не удалось удалить цель.')
    }
  }

  return (
    <div>

      {/* Шапка */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Цели чтения</h1>
          <p className="text-gray-500 text-sm mt-1">
            Ставьте цели и отслеживайте прогресс
          </p>
        </div>
        <Button onClick={handleOpenCreate}>+ Новая цель</Button>
      </div>

      {/* Контент */}
      {loading ? (
        <div className="py-20">
          <Spinner size="lg" />
        </div>
      ) : goals.length === 0 ? (
        <EmptyState onAdd={handleOpenCreate} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={() => handleOpenEdit(goal)}
              onDelete={() => handleDelete(goal.id)}
            />
          ))}
        </div>
      )}

      {/* Модалка создания/редактирования */}
      <GoalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingGoal={editingGoal}
        onSaved={handleSaved}
      />

    </div>
  )
}

const GoalCard = ({ goal, onEdit, onDelete }) => {
  const percent = goal.progress_percent
  const isCompleted = percent >= 100

  const periodLabel = goal.period_type === 'year' ? 'Год' : 'Месяц'
  const measureLabel = goal.measure_type === 'books' ? 'книг' : 'страниц'

  const startDate = formatDate(goal.period_start)
  const endDate = formatDate(goal.period_end)

  return (
    <div className={`bg-white border rounded-xl p-5 flex flex-col gap-4
      ${isCompleted ? 'border-[#B7D0B9]' : 'border-gray-200'}`}>

      {/* Шапка карточки */}
      <div className="flex items-start justify-between">
        <div>
          {/* Бейдж типа периода */}
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium
            ${goal.period_type === 'year'
              ? 'bg-[#E1F0E3] text-[#1E3322]'
              : 'bg-[#E1F0E3] text-[#2D6B3F]'
            }`}>
            {periodLabel}
          </span>
          <h3 className="font-semibold text-gray-900 mt-2">
            {goal.target} {measureLabel}
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {startDate} — {endDate}
          </p>
        </div>

        {/* Процент выполнения */}
        <div className={`text-2xl font-bold
          ${isCompleted ? 'text-green-600' : 'text-[#2D6B3F]'}`}>
          {percent}%
        </div>
      </div>

      {/* Прогресс-бар */}
      <div>
        <div className="w-full bg-[#E2E9E1] rounded-full h-3 overflow-hidden">
          <div
            className={`h-3 rounded-full transition-all duration-700
              ${isCompleted ? 'bg-[#2D6B3F]' : 'bg-[#2D6B3F]'}`}
            style={{ width: `${Math.min(percent, 100)}%` }}
          />
        </div>
        <p className="text-sm text-gray-500 mt-2">
          {goal.current_value} из {goal.target} {measureLabel}
          {isCompleted && (
            <span className="text-green-600 font-medium ml-2">
              ✓ Выполнено!
            </span>
          )}
        </p>
      </div>

      {/* Кнопки */}
      <div className="flex gap-2 pt-1 border-t border-gray-100">
        <button
          onClick={onEdit}
          className="text-xs text-[#2D6B3F] hover:underline"
        >
          Изменить
        </button>
        <button
          onClick={onDelete}
          className="text-xs text-red-500 hover:underline"
        >
          Удалить
        </button>
      </div>

    </div>
  )
}

const GoalModal = ({ isOpen, onClose, editingGoal, onSaved }) => {
  const isEditing = !!editingGoal

  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [serverError, setServerError] = useState('')

  useEffect(() => {
    if (isOpen) {
      if (editingGoal) {
        setForm({
          period_type:  editingGoal.period_type,
          measure_type: editingGoal.measure_type,
          target:       String(editingGoal.target),
          period_start: editingGoal.period_start,
          period_end:   editingGoal.period_end,
        })
      } else {
        setForm(EMPTY_FORM)
      }
      setErrors({})
      setServerError('')
    }
  }, [isOpen, editingGoal])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const validate = () => {
    const newErrors = {}

    if (!form.target || isNaN(Number(form.target)) || Number(form.target) < 1) {
      newErrors.target = 'Введите целевое значение (больше 0)'
    }
    if (!form.period_start) {
      newErrors.period_start = 'Выберите дату начала'
    }
    if (!form.period_end) {
      newErrors.period_end = 'Выберите дату окончания'
    }
    if (form.period_start && form.period_end
      && form.period_start >= form.period_end) {
      newErrors.period_end = 'Дата окончания должна быть позже даты начала'
    }

    return newErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError('')

    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setSaving(true)
    try {
      const payload = {
        ...form,
        target: Number(form.target),
      }

      let response
      if (isEditing) {
        response = await updateGoal(editingGoal.id, payload)
      } else {
        response = await createGoal(payload)
      }

      onSaved(response.data, !isEditing)

    } catch (error) {
      const data = error.response?.data
      if (data && typeof data === 'object') {
        // Пытаемся показать ошибки по конкретным полям
        const fieldErrors = {}
        Object.entries(data).forEach(([key, value]) => {
          fieldErrors[key] = Array.isArray(value) ? value[0] : value
        })
        setErrors(fieldErrors)
      } else {
        setServerError('Не удалось сохранить цель.')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleQuickFill = (type) => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')

    if (type === 'this_year') {
      setForm(prev => ({
        ...prev,
        period_type:  'year',
        period_start: `${year}-01-01`,
        period_end:   `${year}-12-31`,
      }))
    }

    if (type === 'this_month') {
      const lastDay = new Date(year, now.getMonth() + 1, 0).getDate()
      setForm(prev => ({
        ...prev,
        period_type:  'month',
        period_start: `${year}-${month}-01`,
        period_end:   `${year}-${month}-${lastDay}`,
      }))
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Редактировать цель' : 'Новая цель'}
    >
      {serverError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200
          rounded-lg text-red-600 text-sm">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">

        {/* Тип периода и единица измерения */}
        <div className="flex gap-3">

          {/* Период */}
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-sm font-medium text-gray-700">
              Период
            </label>
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
              {PERIOD_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm(prev =>
                    ({ ...prev, period_type: opt.value }))}
                  className={`flex-1 py-1.5 rounded-md text-sm font-medium
                    transition-colors duration-150
                    ${form.period_type === opt.value
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Единица измерения */}
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-sm font-medium text-gray-700">
              Измерять в
            </label>
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
              {MEASURE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm(prev =>
                    ({ ...prev, measure_type: opt.value }))}
                  className={`flex-1 py-1.5 rounded-md text-sm font-medium
                    transition-colors duration-150
                    ${form.measure_type === opt.value
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Целевое значение */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            Цель <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              name="target"
              value={form.target}
              onChange={handleChange}
              placeholder={form.measure_type === 'books' ? '24' : '5000'}
              min="1"
              className={`w-32 px-3 py-2 border rounded-lg outline-none
                text-center transition-colors
                ${errors.target
                  ? 'border-red-400'
                  : 'border-gray-300 focus:border-blue-500'
                }`}
            />
            <span className="text-sm text-gray-500">
              {form.measure_type === 'books' ? 'книг' : 'страниц'}
            </span>
          </div>
          {errors.target && (
            <span className="text-red-500 text-sm">{errors.target}</span>
          )}
        </div>

        {/* Быстрое заполнение дат */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">
            Период
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill('this_year')}
              className="text-xs px-3 py-1.5 rounded-md font-bold
                transition-colors duration-150"
              style={{ background: '#EEF4ED', color: 'var(--muted)' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#D6E1D5')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#EEF4ED')}
            >
              Этот год
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('this_month')}
              className="text-xs px-3 py-1.5 rounded-md font-bold
                transition-colors duration-150"
              style={{ background: '#EEF4ED', color: 'var(--muted)' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#D6E1D5')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#EEF4ED')}
            >
              Этот месяц
            </button>
          </div>
        </div>

        {/* Даты */}
        <div className="flex gap-3">
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-sm font-medium text-gray-700">
              Начало <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="period_start"
              value={form.period_start}
              onChange={handleChange}
              className={`px-3 py-2 border rounded-lg outline-none
                transition-colors text-sm
                ${errors.period_start
                  ? 'border-red-400'
                  : 'border-gray-300 focus:border-blue-500'
                }`}
            />
            {errors.period_start && (
              <span className="text-red-500 text-xs">{errors.period_start}</span>
            )}
          </div>

          <div className="flex flex-col gap-1 flex-1">
            <label className="text-sm font-medium text-gray-700">
              Конец <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="period_end"
              value={form.period_end}
              onChange={handleChange}
              className={`px-3 py-2 border rounded-lg outline-none
                transition-colors text-sm
                ${errors.period_end
                  ? 'border-red-400'
                  : 'border-gray-300 focus:border-blue-500'
                }`}
            />
            {errors.period_end && (
              <span className="text-red-500 text-xs">{errors.period_end}</span>
            )}
          </div>
        </div>

        {/* Кнопки */}
        <div className="flex gap-2 pt-2">
          <Button type="submit" disabled={saving} className="flex-1">
            {saving
              ? 'Сохранение...'
              : isEditing ? 'Сохранить' : 'Создать цель'
            }
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="flex-1"
          >
            Отмена
          </Button>
        </div>

      </form>
    </Modal>
  )
}

const EmptyState = ({ onAdd }) => (
  <div className="py-20 flex flex-col items-center gap-4 text-center">
    <div className="w-16 h-16 bg-gray-100 rounded-full
      flex items-center justify-center">
      <svg className="w-8 h-8 text-gray-400" fill="none"
        stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    </div>
    <div>
      <p className="text-gray-700 font-medium">У вас пока нет целей</p>
      <p className="text-gray-400 text-sm mt-1">
        Поставьте цель на год или месяц и отслеживайте прогресс
      </p>
    </div>
    <Button onClick={onAdd}>Поставить первую цель</Button>
  </div>
)

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default GoalsPage
