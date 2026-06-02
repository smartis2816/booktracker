import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { logout } from '../api/auth'

const HomeIcon = () => (
  <svg className="w-[18px] h-[18px] flex-shrink-0" fill="none" stroke="currentColor"
    strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
)
const BookIcon = () => (
  <svg className="w-[18px] h-[18px] flex-shrink-0" fill="none" stroke="currentColor"
    strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
)
const TargetIcon = () => (
  <svg className="w-[18px] h-[18px] flex-shrink-0" fill="none" stroke="currentColor"
    strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
)
const ChartIcon = () => (
  <svg className="w-[18px] h-[18px] flex-shrink-0" fill="none" stroke="currentColor"
    strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
  </svg>
)
const UserIcon = () => (
  <svg className="w-[18px] h-[18px] flex-shrink-0" fill="none" stroke="currentColor"
    strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)
const LogoutIcon = () => (
  <svg className="w-[18px] h-[18px] flex-shrink-0" fill="none" stroke="currentColor"
    strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
)

const navItems = [
  { to: '/',        label: 'Главная',    icon: <HomeIcon />   },
  { to: '/library', label: 'Библиотека', icon: <BookIcon />   },
  { to: '/goals',   label: 'Цели',       icon: <TargetIcon /> },
  { to: '/stats',   label: 'Статистика', icon: <ChartIcon />  },
  { to: '/profile', label: 'Профиль',    icon: <UserIcon />   },
]

const Layout = ({ children }) => {
  const { user, logoutUser } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token')
      await logout(refreshToken)
    } catch {}
    finally {
      logoutUser()
      navigate('/login')
    }
  }

  return (
    <div className="flex min-h-screen">

      {/* ===== Сайдбар ===== */}
      <aside
        className="w-60 flex-shrink-0 fixed h-full flex flex-col"
        style={{ background: 'var(--green-dark)' }}
      >
        {/* Кликабельный логотип */}
        <div className="px-5 pt-7 pb-5">
          <button
            onClick={() => navigate('/')}
            className="text-left w-full group"
          >
            <h1 className="text-2xl font-bold tracking-tight text-white
              group-hover:text-[#D9E8DC] transition-colors duration-150">
              BookTracker
            </h1>
            <p className="text-xs mt-1 transition-colors duration-150"
              style={{ color: '#BFD6C3' }}>
              Ваша библиотека
            </p>
          </button>
        </div>

        {/* Навигация */}
        <nav className="flex-1 px-3 flex flex-col gap-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 h-[44px] px-3.5 rounded-md
                 text-sm font-medium transition-all duration-150
                 ${isActive
                   ? 'font-semibold'
                   : 'hover:!bg-white/10'
                 }`
              }
              style={({ isActive }) => ({
                background: isActive ? 'var(--green)' : 'transparent',
                color:      isActive ? '#ffffff'      : '#CBD5CB',
              })}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Нижняя секция */}
        <div
          className="px-3 py-4"
          style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}
        >
          {/* Имя пользователя */}
          <div className="px-3.5 py-2 mb-1">
            <p className="text-xs" style={{ color: '#9DB8A4' }}>
              Вы вошли как
            </p>
            <p className="text-sm font-semibold text-white truncate">
              {user?.username}
            </p>
          </div>

          {/* Кнопка выхода */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-md
              text-sm font-medium transition-all duration-150"
            style={{ color: '#CBD5CB' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239,68,68,0.15)'
              e.currentTarget.style.color = '#FCA5A5'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = '#CBD5CB'
            }}
          >
            <LogoutIcon />
            <span>Выйти</span>
          </button>
        </div>
      </aside>

      <main
        className="ml-60 flex-1 px-10 py-8"
        style={{ background: 'var(--bg)', minHeight: '100vh' }}
      >
        {children}
      </main>

    </div>
  )
}

export default Layout
