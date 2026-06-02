import { useState, useEffect, useCallback } from 'react'
import { getBooks } from '../../api/books'
import BookCard from '../../components/BookCard'
import AddBookModal from '../../components/AddBookModal'
import Spinner from '../../components/ui/Spinner'

const STATUS_FILTERS = [
  { value: '',             label: 'Все книги'          },
  { value: 'reading',      label: 'Читаю'              },
  { value: 'want_to_read', label: 'Хочу прочитать'     },
  { value: 'finished',     label: 'Прочитал'           },
  { value: 'dropped',      label: 'Не буду дочитывать' },
]

const LibraryPage = () => {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeStatus, setActiveStatus] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  const fetchBooks = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = {}
      if (activeStatus) params.status = activeStatus
      if (searchQuery) params.title = searchQuery
      const response = await getBooks(params)
      setBooks(response.data)
    } catch {
      setError('Не удалось загрузить библиотеку.')
    } finally {
      setLoading(false)
    }
  }, [activeStatus, searchQuery])

  useEffect(() => { fetchBooks() }, [fetchBooks])

  return (
    <div className="flex flex-col gap-6">

      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight" style={{ color: 'var(--text)' }}>
            Библиотека
          </h1>
          <p className="text-sm mt-1.5" style={{ color: 'var(--muted)' }}>
            {books.length} {getBookWord(books.length)}
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
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

      {/* Фильтры */}
      <div
        className="bg-white border border-[#D6E1D5] rounded-xl p-3 flex items-center gap-3 flex-wrap"
        style={{ minHeight: 70 }}
      >
        {/* Поиск */}
        <div
          className="flex items-center gap-2.5 h-[46px] px-3.5 rounded-md border flex-1 min-w-[200px]"
          style={{ background: 'var(--bg)', borderColor: '#D6E1D5' }}
        >
          <svg className="w-[18px] h-[18px] flex-shrink-0" fill="none"
            stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
            style={{ color: 'var(--muted)' }}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" />
          </svg>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && setSearchQuery(searchInput)}
            placeholder="Название или автор"
            className="flex-1 bg-transparent border-0 outline-none text-sm
              placeholder-[#6B7B6B]"
            style={{ color: 'var(--text)' }}
          />
        </div>

        {/* Фильтры статуса */}
        <div className="flex gap-1.5 flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setActiveStatus(f.value)}
              className="px-3.5 py-2 rounded-md text-sm font-bold
                transition-colors duration-150 border"
              style={activeStatus === f.value
                ? { background: 'var(--green)', color: '#fff', borderColor: 'var(--green)' }
                : { background: '#fff', color: 'var(--muted)', borderColor: '#D6E1D5' }
              }
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Сброс */}
        {(searchQuery || activeStatus) && (
          <button
            onClick={() => {
              setSearchInput('')
              setSearchQuery('')
              setActiveStatus('')
            }}
            className="px-3 py-2 rounded-md text-sm font-bold border
              border-[#D6E1D5] transition-colors hover:bg-[#F3F7F2]"
            style={{ color: 'var(--muted)' }}
          >
            Сбросить
          </button>
        )}
      </div>

      {/* Контент */}
      {loading ? (
        <div className="py-20"><Spinner size="lg" /></div>
      ) : error ? (
        <div className="py-20 text-center">
          <p className="text-red-500">{error}</p>
          <button
            onClick={fetchBooks}
            className="mt-4 px-4 py-2.5 border border-[#D6E1D5] rounded-md
              text-sm font-bold bg-white hover:bg-[#F3F7F2]"
            style={{ color: 'var(--muted)' }}
          >
            Повторить
          </button>
        </div>
      ) : books.length === 0 ? (
        <EmptyState
          hasFilters={!!activeStatus || !!searchQuery}
          onAdd={() => setIsAddModalOpen(true)}
          onClear={() => {
            setActiveStatus('')
            setSearchInput('')
            setSearchQuery('')
          }}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {books.map((userBook) => (
            <BookCard key={userBook.id} userBook={userBook} />
          ))}
        </div>
      )}

      <AddBookModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onBookAdded={(newBook) => setBooks(prev => [newBook, ...prev])}
      />
    </div>
  )
}

const EmptyState = ({ hasFilters, onAdd, onClear }) => (
  <div className="py-20 flex flex-col items-center gap-4 text-center">
    <div
      className="w-16 h-16 rounded-full flex items-center justify-center"
      style={{ background: '#E1F0E3' }}
    >
      <svg className="w-8 h-8" style={{ color: 'var(--green)' }} fill="none"
        stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    </div>
    {hasFilters ? (
      <>
        <p style={{ color: 'var(--muted)' }}>Ничего не найдено по вашему запросу</p>
        <button
          onClick={onClear}
          className="px-4 py-2.5 border border-[#D6E1D5] rounded-md
            text-sm font-bold bg-white hover:bg-[#F3F7F2]"
          style={{ color: 'var(--muted)' }}
        >
          Сбросить фильтры
        </button>
      </>
    ) : (
      <>
        <p style={{ color: 'var(--muted)' }}>В вашей библиотеке пока нет книг</p>
        <button
          onClick={onAdd}
          className="px-4 py-[11px] rounded-md text-sm font-bold text-white"
          style={{ background: 'var(--green)' }}
        >
          Добавить первую книгу
        </button>
      </>
    )}
  </div>
)

const getBookWord = (n) => {
  const m10 = n % 10, m100 = n % 100
  if (m100 >= 11 && m100 <= 14) return 'книг'
  if (m10 === 1) return 'книга'
  if (m10 >= 2 && m10 <= 4) return 'книги'
  return 'книг'
}

export default LibraryPage
