import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { login } from '../../api/auth'
import Input from '../../components/ui/Input'

const LoginPage = () => {
  const navigate = useNavigate()
  const { loginUser } = useAuth()

  const [formData, setFormData] = useState({ username: '', password: '' })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const validate = () => {
    const e = {}
    if (!formData.username.trim()) e.username = 'Введите имя пользователя'
    if (!formData.password) e.password = 'Введите пароль'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError('')
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    try {
      const response = await login(formData)
      loginUser(response.data.user, response.data.tokens)
      navigate('/')
    } catch (err) {
      setServerError(
        err.response?.data?.error || 'Неверное имя пользователя или пароль.'
      )
    } finally { setLoading(false) }
  }

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>

      <aside
        className="w-[520px] flex-shrink-0 flex flex-col gap-7 px-12 py-14"
        style={{ background: 'var(--green-dark)', color: '#fff' }}
      >
        {/* Бренд */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--green)' }}
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor"
              strokeWidth={2.2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <span className="text-2xl font-bold tracking-tight">BookTracker</span>
        </div>

        {/* Заголовок */}
        <h1 className="text-[40px] font-extrabold leading-[1.08] tracking-tight">
          Ваш персональный дневник чтения
        </h1>

        {/* Описание */}
        <p className="text-base leading-relaxed" style={{ color: '#D9E8DC' }}>
          Личная библиотека, прогресс по книгам, заметки, цитаты и статистика.
        </p>

        {/* Фичи */}
        <div className="flex flex-col gap-3 mt-2">
          {[
            { icon: '📚', text: 'Ведите каталог своих книг и отслеживайте прогресс чтения' },
            { icon: '🎯', text: 'Ставьте годовые и месячные цели чтения'           },
            { icon: '📝', text: 'Сохраняйте заметки и цитаты к каждой книге'       },
            { icon: '📊', text: 'Смотрите статистику по жанрам, авторам и неделям' },
          ].map((item) => (
            <div
              key={item.text}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium"
              style={{ background: '#263F2A', border: '1px solid #3B5440' }}
            >
              <span className="text-lg flex-shrink-0">{item.icon}</span>
              <span style={{ color: '#D9E8DC' }}>{item.text}</span>
            </div>
          ))}
        </div>
      </aside>

      <section className="flex-1 flex items-center justify-center p-8">
        <form
          onSubmit={handleSubmit}
          noValidate
          className="w-full max-w-[460px] bg-white rounded-xl border border-[#D6E1D5] p-8 flex flex-col gap-[18px]"
        >
          <div>
            <h2 className="text-3xl font-extrabold" style={{ color: 'var(--text)' }}>
              Вход
            </h2>
            <p className="text-sm mt-1.5" style={{ color: 'var(--muted)' }}>
              Введите имя пользователя и пароль.
            </p>
          </div>

          {serverError && (
            <div
              className="text-sm rounded-md px-3 py-2.5"
              style={{
                color: '#8a4242',
                background: '#fbe9e9',
                border: '1px solid #f0c8c8',
              }}
            >
              {serverError}
            </div>
          )}

          <Input
            label="Имя пользователя"
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="Введите имя пользователя"
            error={errors.username}
            required
          />

          <Input
            label="Пароль"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••••"
            error={errors.password}
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2.5 h-12 rounded-md
              text-sm font-extrabold text-white
              transition-colors duration-150
              disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: 'var(--green)' }}
            onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.background = '#265c36')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--green)')}
          >
            <span>{loading ? 'Входим…' : 'Войти'}</span>
            {!loading && (
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            )}
          </button>

          <p className="text-center text-sm font-semibold" style={{ color: 'var(--text)' }}>
            Нет аккаунта?{' '}
            <Link
              to="/register"
              className="font-bold"
              style={{ color: 'var(--green)' }}
            >
              Зарегистрироваться
            </Link>
          </p>
        </form>
      </section>

    </div>
  )
}

export default LoginPage
