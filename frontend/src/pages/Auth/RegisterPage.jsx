import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { register } from '../../api/auth'
import Input from '../../components/ui/Input'

const RegisterPage = () => {
  const navigate = useNavigate()
  const { loginUser } = useAuth()

  const [formData, setFormData] = useState({
    username: '', email: '', password: '', password_confirm: '',
  })
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
    else if (formData.username.length < 3) e.username = 'Минимум 3 символа'
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email))
      e.email = 'Некорректный email'
    if (!formData.password) e.password = 'Введите пароль'
    else if (formData.password.length < 8) e.password = 'Минимум 8 символов'
    if (!formData.password_confirm) e.password_confirm = 'Подтвердите пароль'
    else if (formData.password !== formData.password_confirm)
      e.password_confirm = 'Пароли не совпадают'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError('')
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    try {
      const response = await register(formData)
      loginUser(response.data.user, response.data.tokens)
      navigate('/')
    } catch (err) {
      const data = err.response?.data
      if (data && typeof data === 'object') {
        const fieldErrors = {}
        let general = ''
        Object.entries(data).forEach(([key, value]) => {
          const msg = Array.isArray(value) ? value[0] : value
          if (['username','email','password','password_confirm'].includes(key))
            fieldErrors[key] = msg
          else general = msg
        })
        if (Object.keys(fieldErrors).length) setErrors(fieldErrors)
        if (general) setServerError(general)
      } else {
        setServerError('Произошла ошибка. Попробуйте ещё раз.')
      }
    } finally { setLoading(false) }
  }

  const steps = [
    { text: 'Добавьте книги через поиск Open Library API' },
    { text: 'Поставьте месячную или годовую цель' },
    { text: 'Следите за прогрессом, заметками и статистикой' },
  ]

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>

      <section className="w-[620px] flex-shrink-0 flex items-center justify-center p-8">
        <form
          onSubmit={handleSubmit}
          noValidate
          className="w-full max-w-[500px] bg-white rounded-xl
            border border-[#D6E1D5] p-8 flex flex-col gap-4"
        >
          <div>
            <h2 className="text-3xl font-extrabold" style={{ color: 'var(--text)' }}>
              Регистрация
            </h2>
            <p className="text-sm mt-1.5 leading-snug" style={{ color: 'var(--muted)' }}>
              Создайте аккаунт, чтобы хранить библиотеку, цели и заметки.
            </p>
          </div>

          {serverError && (
            <div
              className="text-sm rounded-md px-3 py-2.5"
              style={{ color: '#8a4242', background: '#fbe9e9', border: '1px solid #f0c8c8' }}
            >
              {serverError}
            </div>
          )}

          <Input
            label="Имя пользователя"
            type="text" name="username"
            value={formData.username} onChange={handleChange}
            placeholder="Минимум 3 символа"
            error={errors.username} required
          />
          <Input
            label="Email (необязательно)"
            type="email" name="email"
            value={formData.email} onChange={handleChange}
            placeholder="you@example.com"
            error={errors.email}
          />
          <Input
            label="Пароль"
            type="password" name="password"
            value={formData.password} onChange={handleChange}
            placeholder="Минимум 8 символов"
            error={errors.password} required
          />
          <Input
            label="Подтверждение пароля"
            type="password" name="password_confirm"
            value={formData.password_confirm} onChange={handleChange}
            placeholder="Повторите пароль"
            error={errors.password_confirm} required
          />

          <button
            type="submit"
            disabled={loading}
            className="h-12 flex items-center justify-center rounded-md
              text-sm font-extrabold text-white mt-2
              transition-colors duration-150
              disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: 'var(--green)' }}
            onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.background = '#265c36')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--green)')}
          >
            {loading ? 'Создаём…' : 'Создать аккаунт'}
          </button>

          <p className="text-center text-sm font-semibold" style={{ color: 'var(--text)' }}>
            Уже есть аккаунт?{' '}
            <Link to="/login" className="font-bold" style={{ color: 'var(--green)' }}>
              Войти
            </Link>
          </p>
        </form>
      </section>

      <aside
        className="flex-1 flex flex-col gap-6 px-14 py-14"
        style={{ background: 'var(--green-dark)', color: '#fff' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--green)' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
            </svg>
          </div>
          <span className="text-2xl font-bold tracking-tight">BookTracker</span>
        </div>

        <h1 className="text-[40px] font-extrabold leading-[1.08] tracking-tight">
          Первый маршрут чтения собирается за минуту
        </h1>

        <div className="flex flex-col gap-3 mt-2">
          {steps.map((step, i) => (
            <div
              key={i}
              className="flex items-center gap-4 p-[18px] rounded-lg text-base font-bold"
              style={{ background: '#263F2A', border: '1px solid #3B5440' }}
            >
              <span
                className="w-7 h-7 rounded-full flex items-center justify-center
                  text-sm font-extrabold flex-shrink-0"
                style={{ background: 'var(--green)' }}
              >
                {i + 1}
              </span>
              <span>{step.text}</span>
            </div>
          ))}
        </div>
      </aside>

    </div>
  )
}

export default RegisterPage
