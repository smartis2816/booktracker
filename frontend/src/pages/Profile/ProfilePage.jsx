import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { updateMe } from '../../api/auth'
import {
  exportLibraryCSV, exportLibraryPDF,
  exportNotesCSV, exportNotesPDF,
} from '../../api/books'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'

const ProfilePage = () => {
  const { user, loginUser } = useAuth()

  return (
    <div className="max-w-2xl flex flex-col gap-6">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight" style={{ color: 'var(--text)' }}>
          Профиль
        </h1>
        <p className="text-sm mt-1.5" style={{ color: 'var(--muted)' }}>
          Управление аккаунтом и экспорт данных
        </p>
      </div>

      <ProfileSection user={user} onUpdated={(updatedUser) => {
        const tokens = {
          access:  localStorage.getItem('access_token'),
          refresh: localStorage.getItem('refresh_token'),
        }
        loginUser(updatedUser, tokens)
      }} />

      <ExportSection />
    </div>
  )
}

const ProfileSection = ({ user, onUpdated }) => {
  const [editing, setEditing]       = useState(false)
  const [form, setForm]             = useState({
    username: user?.username || '',
    email:    user?.email    || '',
  })
  const [errors, setErrors]         = useState({})
  const [saving, setSaving]         = useState(false)
  const [serverError, setServerError] = useState('')
  const [successMsg, setSuccessMsg]   = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setServerError('')
    setSuccessMsg('')
    const newErrors = {}
    if (!form.username.trim()) newErrors.username = 'Имя пользователя не может быть пустым'
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) newErrors.email = 'Некорректный email'
    if (Object.keys(newErrors).length) { setErrors(newErrors); return }
    setSaving(true)
    try {
      const response = await updateMe(form)
      onUpdated(response.data)
      setEditing(false)
      setSuccessMsg('Профиль успешно обновлён')
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (err) {
      const data = err.response?.data
      if (data && typeof data === 'object') {
        const fieldErrors = {}
        Object.entries(data).forEach(([k, v]) => {
          fieldErrors[k] = Array.isArray(v) ? v[0] : v
        })
        setErrors(fieldErrors)
      } else {
        setServerError('Не удалось обновить профиль.')
      }
    } finally { setSaving(false) }
  }

  const handleCancel = () => {
    setForm({ username: user?.username || '', email: user?.email || '' })
    setErrors({})
    setServerError('')
    setEditing(false)
  }

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : '??'

  const joinedDate = user?.date_joined
    ? new Date(user.date_joined).toLocaleDateString('ru-RU', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : ''

  return (
    <div className="rounded-xl border border-[#D6E1D5] overflow-hidden">

      {/* Шапка */}
      <div
        className="px-6 py-6 flex items-center gap-4 text-white"
        style={{ background: 'var(--green-dark)' }}
      >
        <div
          className="w-[72px] h-[72px] rounded-lg flex items-center justify-center
            text-2xl font-extrabold flex-shrink-0"
          style={{ background: 'var(--green)' }}
        >
          {initials}
        </div>
        <div>
          <h2 className="text-2xl font-extrabold">{user?.username}</h2>
          <p className="text-sm mt-0.5" style={{ color: '#D9E8DC' }}>
            {user?.email || 'Email не указан'}
          </p>
          {joinedDate && (
            <p className="text-xs mt-1" style={{ color: '#BFD6C3' }}>
              В системе с {joinedDate}
            </p>
          )}
        </div>
      </div>

      {/* Тело карточки */}
      <div className="bg-white p-6">

        {successMsg && (
          <div
            className="mb-4 p-3 rounded-lg text-sm border"
            style={{
              background: '#E1F0E3',
              borderColor: '#B7D0B9',
              color: '#1E3322',
            }}
          >
            {successMsg}
          </div>
        )}
        {serverError && (
          <div
            className="mb-4 p-3 rounded-lg text-sm border"
            style={{ background: '#fbe9e9', borderColor: '#f0c8c8', color: '#8a4242' }}
          >
            {serverError}
          </div>
        )}

        {editing ? (
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <Input
              label="Имя пользователя"
              name="username"
              value={form.username}
              onChange={handleChange}
              error={errors.username}
              required
            />
            <Input
              label="Email"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="example@mail.com"
              error={errors.email}
            />
            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? 'Сохранение…' : 'Сохранить'}
              </Button>
              <Button type="button" variant="secondary" onClick={handleCancel}>
                Отмена
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col gap-3">
            <InfoRow label="Имя пользователя" value={user?.username} />
            <InfoRow label="Email" value={user?.email || 'Не указан'} />
            <div className="pt-2">
              <Button variant="secondary" onClick={() => setEditing(true)}>
                Редактировать профиль
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const InfoRow = ({ label, value }) => (
  <div
    className="flex items-center gap-3 py-2.5 border-b last:border-0"
    style={{ borderColor: '#D6E1D5' }}
  >
    <span className="text-sm w-44 flex-shrink-0" style={{ color: 'var(--muted)' }}>
      {label}
    </span>
    <span className="text-sm" style={{ color: 'var(--text)' }}>{value}</span>
  </div>
)

const ExportSection = () => {
  const [formats, setFormats] = useState({ library: 'csv', notes: 'csv' })
  const [loading, setLoading] = useState({ library: false, notes: false })
  const [error, setError] = useState('')

  const EXPORT_CONFIG = {
    library: {
      label: 'Библиотека',
      desc:  'Список всех книг со статусами, оценками и прогрессом',
      icon:  '📚',
      options: {
        csv: { fn: exportLibraryCSV, filename: 'booktracker_library.csv' },
        pdf: { fn: exportLibraryPDF, filename: 'booktracker_library.pdf' },
      },
    },
    notes: {
      label: 'Заметки и цитаты',
      desc:  'Все заметки и цитаты с привязкой к книгам',
      icon:  '📝',
      options: {
        csv: { fn: exportNotesCSV, filename: 'booktracker_notes.csv' },
        pdf: { fn: exportNotesPDF, filename: 'booktracker_notes.pdf' },
      },
    },
  }

  const handleExport = async (type) => {
    setError('')
    setLoading(prev => ({ ...prev, [type]: true }))
    const config = EXPORT_CONFIG[type].options[formats[type]]
    try {
      const response = await config.fn()
      const url  = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.download = config.filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      setError('Не удалось экспортировать данные.')
    } finally {
      setLoading(prev => ({ ...prev, [type]: false }))
    }
  }

  return (
    <div className="bg-white border border-[#D6E1D5] rounded-xl p-6">
      <h2 className="text-base font-extrabold mb-1" style={{ color: 'var(--text)' }}>
        Экспорт данных
      </h2>
      <p className="text-sm mb-5" style={{ color: 'var(--muted)' }}>
        Скачайте данные в удобном формате. PDF подходит для архива, CSV — для таблиц.
      </p>

      {error && (
        <div
          className="mb-4 p-3 rounded-lg text-sm border"
          style={{ background: '#fbe9e9', borderColor: '#f0c8c8', color: '#8a4242' }}
        >
          {error}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {Object.entries(EXPORT_CONFIG).map(([type, config]) => (
          <div
            key={type}
            className="p-4 rounded-xl border"
            style={{
              background: '#F3F7F2',
              borderColor: '#D6E1D5',
            }}
          >
            {/* Описание */}
            <div className="flex items-start gap-3 mb-3">
              <span className="text-2xl">{config.icon}</span>
              <div>
                <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                  {config.label}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                  {config.desc}
                </p>
              </div>
            </div>

            {/* Переключатель + кнопка */}
            <div className="flex items-center justify-between gap-3">
              <div
                className="flex gap-1 p-0.5 rounded-md border"
                style={{ background: '#fff', borderColor: '#D6E1D5' }}
              >
                {['csv', 'pdf'].map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setFormats(prev => ({ ...prev, [type]: fmt }))}
                    className="px-3 py-1 rounded text-xs font-extrabold uppercase
                      tracking-wide transition-colors duration-150"
                    style={formats[type] === fmt
                      ? { background: 'var(--green)', color: '#fff' }
                      : { color: 'var(--muted)' }
                    }
                  >
                    {fmt}
                  </button>
                ))}
              </div>

              <Button
                variant="secondary"
                disabled={loading[type]}
                onClick={() => handleExport(type)}
              >
                {loading[type]
                  ? 'Загрузка…'
                  : `Скачать ${formats[type].toUpperCase()}`
                }
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ProfilePage
