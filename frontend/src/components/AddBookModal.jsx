import { useState } from 'react'
import Modal from './ui/Modal'
import Button from './ui/Button'
import Input from './ui/Input'
import Spinner from './ui/Spinner'
import { searchBooks, addBook } from '../api/books'

const TABS = {
  SEARCH: 'search',
  MANUAL: 'manual',
}

const AddBookModal = ({ isOpen, onClose, onBookAdded }) => {
  const [activeTab, setActiveTab] = useState(TABS.SEARCH)

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')

  const [manualForm, setManualForm] = useState({
    title: '',
    author: '',
    genre: '',
    total_pages: '',
    published_year: '',
  })
  const [manualErrors, setManualErrors] = useState({})

  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setSearching(true)
    setSearchError('')
    setSearchResults([])

    try {
      const response = await searchBooks(searchQuery)
      setSearchResults(response.data)
      if (response.data.length === 0) {
        setSearchError('Ничего не найдено. Попробуйте другой запрос или добавьте книгу вручную.')
      }
    } catch {
      setSearchError('Ошибка поиска. Проверьте подключение к интернету.')
    } finally {
      setSearching(false)
    }
  }

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch()
  }

  const handleAddFromSearch = async (bookData) => {
    setAdding(true)
    setAddError('')
    try {
      const response = await addBook({
        book: bookData,
        status: 'want_to_read',
      })
      onBookAdded(response.data)
      handleClose()
    } catch (error) {
      const message = error.response?.data?.error || 'Не удалось добавить книгу.'
      setAddError(message)
    } finally {
      setAdding(false)
    }
  }

  const validateManual = () => {
    const errors = {}
    if (!manualForm.title.trim()) errors.title = 'Введите название'
    if (!manualForm.author.trim()) errors.author = 'Введите автора'
    if (manualForm.total_pages && isNaN(Number(manualForm.total_pages))) {
      errors.total_pages = 'Введите число'
    }
    if (manualForm.published_year && isNaN(Number(manualForm.published_year))) {
      errors.published_year = 'Введите год'
    }
    return errors
  }

  const handleManualSubmit = async (e) => {
    e.preventDefault()
    const errors = validateManual()
    if (Object.keys(errors).length > 0) {
      setManualErrors(errors)
      return
    }

    setAdding(true)
    setAddError('')

    try {
      const response = await addBook({
        book: {
          ...manualForm,
          total_pages: manualForm.total_pages
            ? Number(manualForm.total_pages) : null,
          published_year: manualForm.published_year
            ? Number(manualForm.published_year) : null,
        },
        status: 'want_to_read',
      })
      onBookAdded(response.data)
      handleClose()
    } catch (error) {
      const message = error.response?.data?.error || 'Не удалось добавить книгу.'
      setAddError(message)
    } finally {
      setAdding(false)
    }
  }

  const handleClose = () => {
    setSearchQuery('')
    setSearchResults([])
    setSearchError('')
    setManualForm({
      title: '', author: '', genre: '',
      total_pages: '', published_year: '',
    })
    setManualErrors({})
    setAddError('')
    setActiveTab(TABS.SEARCH)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Добавить книгу">

      {/* Вкладки */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg mb-4">
        <button
          onClick={() => setActiveTab(TABS.SEARCH)}
          className={`flex-1 py-1.5 px-3 rounded-md text-sm font-bold
            transition-colors duration-150
            ${activeTab === TABS.SEARCH
              ? 'bg-white shadow-sm'
              : 'hover:text-[#1E3322]'
            }`}
          style={activeTab === TABS.SEARCH
            ? { color: '#1E3322' }
            : { color: '#6B7B6B' }
          }
        >
          Поиск
        </button>
        <button
          onClick={() => setActiveTab(TABS.MANUAL)}
          className={`flex-1 py-1.5 px-3 rounded-md text-sm font-bold
            transition-colors duration-150
            ${activeTab === TABS.SEARCH
              ? 'bg-white shadow-sm'
              : 'hover:text-[#1E3322]'
            }`}
          style={activeTab === TABS.SEARCH
            ? { color: '#1E3322' }
            : { color: '#6B7B6B' }
          }
        >
          Вручную
        </button>
      </div>

      {/* Общая ошибка добавления */}
      {addError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg
          text-red-600 text-sm">
          {addError}
        </div>
      )}

      {/* Вкладка поиска */}
      {activeTab === TABS.SEARCH && (
        <div className="flex flex-col gap-4">

          {/* Строка поиска */}
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Название или автор..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg
                outline-none focus:border-blue-500 text-sm"
            />
            <Button onClick={handleSearch} disabled={searching}>
              {searching ? '...' : 'Найти'}
            </Button>
          </div>

          {/* Состояние загрузки */}
          {searching && <Spinner />}

          {/* Ошибка поиска */}
          {searchError && !searching && (
            <p className="text-sm text-gray-500 text-center">{searchError}</p>
          )}

          {/* Результаты поиска */}
          {!searching && searchResults.length > 0 && (
            <div className="flex flex-col gap-2">
              {searchResults.map((book, index) => (
                <div
                  key={book.external_id || index}
                  className="flex gap-3 p-3 border border-gray-200 rounded-lg
                    hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  {/* Обложка */}
                  <div className="w-10 h-14 bg-gray-100 rounded flex-shrink-0 overflow-hidden">
                    {book.cover_url ? (
                      <img
                        src={book.cover_url}
                        alt={book.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-gray-300" fill="none"
                          stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round"
                            strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Данные книги */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 line-clamp-1">
                      {book.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{book.author}</p>
                    {book.published_year && (
                      <p className="text-xs text-gray-400">{book.published_year}</p>
                    )}
                  </div>

                  {/* Кнопка добавления */}
                  <button
                    onClick={() => handleAddFromSearch(book)}
                    disabled={adding}
                    className="flex-shrink-0 text-sm font-bold disabled:opacity-50
                      transition-colors duration-150"
                    style={{ color: '#2D6B3F' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#1E3322')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#2D6B3F')}
                  >
                    Добавить
                  </button>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* Вкладка ручного добавления */}
      {activeTab === TABS.MANUAL && (
        <form onSubmit={handleManualSubmit} className="flex flex-col gap-3">

          <Input
            label="Название"
            name="title"
            value={manualForm.title}
            onChange={(e) => setManualForm(prev =>
              ({ ...prev, title: e.target.value }))}
            error={manualErrors.title}
            required
          />

          <Input
            label="Автор"
            name="author"
            value={manualForm.author}
            onChange={(e) => setManualForm(prev =>
              ({ ...prev, author: e.target.value }))}
            placeholder="Несколько авторов через запятую"
            error={manualErrors.author}
            required
          />

          <Input
            label="Жанр"
            name="genre"
            value={manualForm.genre}
            onChange={(e) => setManualForm(prev =>
              ({ ...prev, genre: e.target.value }))}
            placeholder="Несколько жанров через запятую"
          />

          <div className="flex gap-3">
            <Input
              label="Страниц"
              name="total_pages"
              value={manualForm.total_pages}
              onChange={(e) => setManualForm(prev =>
                ({ ...prev, total_pages: e.target.value }))}
              placeholder="480"
              error={manualErrors.total_pages}
              className="flex-1"
            />
            <Input
              label="Год"
              name="published_year"
              value={manualForm.published_year}
              onChange={(e) => setManualForm(prev =>
                ({ ...prev, published_year: e.target.value }))}
              placeholder="2024"
              error={manualErrors.published_year}
              className="flex-1"
            />
          </div>

          <Button
            type="submit"
            disabled={adding}
            className="w-full mt-2"
          >
            {adding ? 'Добавление...' : 'Добавить книгу'}
          </Button>

        </form>
      )}

    </Modal>
  )
}

export default AddBookModal
