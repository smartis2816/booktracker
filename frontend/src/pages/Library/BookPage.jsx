import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  getBook, updateBook, deleteBook,
  getNotes, addNote, updateNote, deleteNote,
  getQuotes, addQuote, deleteQuote,
} from '../../api/books'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Spinner from '../../components/ui/Spinner'
import StarRating from '../../components/ui/StarRating'
import CoverEditModal from '../../components/CoverEditModal'

const STATUS_OPTIONS = [
  { value: 'want_to_read', label: 'Хочу прочитать' },
  { value: 'reading',      label: 'Читаю'           },
  { value: 'finished',     label: 'Прочитал'        },
  { value: 'dropped',      label: 'Не буду дочитывать' },
]

const STATUS_COLORS = {
  want_to_read: 'bg-gray-100 text-gray-600',
  reading:      'bg-[#E1F0E3] text-[#2D6B3F]',
  finished:     'bg-green-100 text-green-700',
  dropped:      'bg-red-100 text-red-600',
}

const BookPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [userBook, setUserBook] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('notes')
  const [notes, setNotes] = useState([])
  const [quotes, setQuotes] = useState([])
  const [notesLoading, setNotesLoading] = useState(false)
  const [quotesLoading, setQuotesLoading] = useState(false)
  const [isCoverModalOpen, setIsCoverModalOpen] = useState(false)

  useEffect(() => {
    fetchBook()
  }, [id])

  const fetchBook = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await getBook(id)
      setUserBook(response.data)
      const [notesRes, quotesRes] = await Promise.all([
        getNotes(id),
        getQuotes(id),
      ])
      setNotes(notesRes.data)
      setQuotes(quotesRes.data)
    } catch {
      setError('Книга не найдена.')
    } finally {
      setLoading(false)
    }
  }


  const fetchNotes = async () => {
    setNotesLoading(true)
    try {
      const response = await getNotes(id)
      setNotes(response.data)
    } catch {
    } finally {
      setNotesLoading(false)
    }
  }

  const fetchQuotes = async () => {
    setQuotesLoading(true)
    try {
      const response = await getQuotes(id)
      setQuotes(response.data)
    } catch {
    } finally {
      setQuotesLoading(false)
    }
  }

  const handleUpdateBook = async (data) => {
    try {
      const response = await updateBook(id, data)
      setUserBook(response.data)
    } catch (error) {
      const message = error.response?.data?.current_page
        || error.response?.data?.error
        || 'Не удалось обновить.'
      alert(message)
    }
  }

  const handleDeleteBook = async () => {
    if (!window.confirm('Удалить книгу из библиотеки?')) return
    try {
      await deleteBook(id)
      navigate('/library')
    } catch {
      alert('Не удалось удалить книгу.')
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
        <p className="text-red-500 mb-4">{error}</p>
        <Button variant="secondary" onClick={() => navigate('/library')}>
          Вернуться в библиотеку
        </Button>
      </div>
    )
  }

  const { book, status, current_page, progress_percent, rating, review } = userBook
  const authors = book.authors?.map(a => a.name).join(', ') || 'Автор неизвестен'
  const genres = book.genres?.map(g => g.name).join(', ') || ''

  const coverUrl = book.cover_url
    ? book.cover_url.startsWith('/media/')
      ? `http://127.0.0.1:8000${book.cover_url}`
      : book.cover_url
    : null

  return (
    <div className="max-w-4xl">

      {/* Кнопка назад */}
      <button
        onClick={() => navigate('/library')}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-700
          text-sm mb-6 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 19l-7-7 7-7" />
        </svg>
        Библиотека
      </button>

      {/* Верхняя секция */}
      <div className="flex gap-8 mb-8">

        {/* Обложка */}
        <div className="flex flex-col items-center gap-2 flex-shrink-0">
          <div className="w-36 h-52 bg-gray-100 rounded-xl overflow-hidden shadow-md">
            {coverUrl ? (
              <img
                src={coverUrl}
                alt={book.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg className="w-12 h-12 text-[#D6E1D5]" fill="none"
                  stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            )}
          </div>

          {/* Кнопка обложки */}
          <button
            onClick={() => setIsCoverModalOpen(true)}
            className="text-xs text-[#2D6B3F] hover:underline cursor-pointer"
          >
            {coverUrl ? 'Изменить обложку' : 'Добавить обложку'}
          </button>
        </div>

        {/* Информация */}
        <div className="flex-1 flex flex-col gap-4">

          <div>
            <h1 className="text-2xl font-bold text-gray-900">{book.title}</h1>
            <p className="text-gray-500 mt-1">{authors}</p>
            {genres && (
              <p className="text-sm text-gray-400 mt-0.5">{genres}</p>
            )}
            {book.published_year && (
              <p className="text-sm text-gray-400">{book.published_year} г.</p>
            )}
          </div>

          <StatusSelector
            status={status}
            onChange={(newStatus) => handleUpdateBook({ status: newStatus })}
          />

          {(status === 'reading' || status === 'finished') && (
            <ProgressSection
              currentPage={current_page}
              totalPages={book.total_pages}
              progressPercent={progress_percent}
              onUpdate={(page) => handleUpdateBook({ current_page: page })}
            />
          )}

          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-gray-700">Оценка</p>
            <StarRating
              value={rating}
              onChange={(newRating) => handleUpdateBook({ rating: newRating })}
            />
          </div>

        </div>
      </div>

      {/* Описание */}
      {book.description && (
        <div className="mb-8 p-4 bg-gray-50 rounded-xl">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">Описание</h2>
          <p className="text-sm text-gray-600 leading-relaxed line-clamp-4">
            {book.description}
          </p>
        </div>
      )}

      {/* Отзыв */}
      <ReviewSection
        review={review}
        onSave={(text) => handleUpdateBook({ review: text })}
      />

      {/* Вкладки */}
      <div className="mt-8">
        <div className="flex border-b border-gray-200 mb-6">
          {[
            { key: 'notes',  label: `Заметки (${notes.length})`  },
            { key: 'quotes', label: `Цитаты (${quotes.length})`  },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2
                transition-colors duration-150
                ${activeTab === tab.key
                  ? 'border-[#2D6B3F] text-[#2D6B3F]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'notes' && (
          <NotesSection
            notes={notes}
            loading={notesLoading}
            bookId={id}
            onAdd={(note) => setNotes(prev => [note, ...prev])}
            onUpdate={(updated) => setNotes(prev =>
              prev.map(n => n.id === updated.id ? updated : n)
            )}
            onDelete={(noteId) => setNotes(prev =>
              prev.filter(n => n.id !== noteId)
            )}
          />
        )}

        {activeTab === 'quotes' && (
          <QuotesSection
            quotes={quotes}
            loading={quotesLoading}
            bookId={id}
            onAdd={(quote) => setQuotes(prev => [quote, ...prev])}
            onDelete={(quoteId) => setQuotes(prev =>
              prev.filter(q => q.id !== quoteId)
            )}
          />
        )}
      </div>

      {/* Удаление */}
      <div className="mt-12 pt-6 border-t border-gray-200">
        <Button variant="danger" onClick={handleDeleteBook}>
          Удалить из библиотеки
        </Button>
      </div>

      {/* Модалка обложки внутри BookPage, после всего контента */}
      <CoverEditModal
        isOpen={isCoverModalOpen}
        onClose={() => setIsCoverModalOpen(false)}
        bookId={id}
        currentCover={coverUrl}
        onUpdated={(newCoverUrl) => {
          setUserBook(prev => ({
            ...prev,
            book: { ...prev.book, cover_url: newCoverUrl }
          }))
          setIsCoverModalOpen(false)
        }}
      />

    </div>
  )
}

const StatusSelector = ({ status, onChange }) => (
  <div className="flex flex-col gap-1">
    <p className="text-sm font-medium text-gray-700">Статус</p>
    <div className="flex flex-wrap gap-2">
      {STATUS_OPTIONS.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium
            transition-colors duration-150 border
            ${status === option.value
              ? `${STATUS_COLORS[option.value]} border-transparent`
              : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  </div>
)

const ProgressSection = ({ currentPage, totalPages, progressPercent, onUpdate }) => {
  const [inputValue, setInputValue] = useState(String(currentPage))
  const [editing, setEditing] = useState(false)

  const handleSave = () => {
    const page = parseInt(inputValue, 10)
    if (!isNaN(page) && page >= 0) {
      onUpdate(page)
    }
    setEditing(false)
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-gray-700">Прогресс</p>
      <div className="w-full bg-gray-100 rounded-full h-2.5">
        <div
          className="bg-[#2D6B3F] h-2.5 rounded-full transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      <div className="flex items-center gap-3">
        {editing ? (
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              autoFocus
              className="w-20 px-2 py-1 border border-[#2D6B3F] rounded-lg
                text-sm outline-none text-center"
            />
            {totalPages && (
              <span className="text-sm text-gray-400">из {totalPages}</span>
            )}
            <Button onClick={handleSave} className="py-1 px-3 text-sm">
              Сохранить
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setInputValue(String(currentPage))
                setEditing(false)
              }}
              className="py-1 px-3 text-sm"
            >
              Отмена
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              Страница <strong>{currentPage}</strong>
              {totalPages && ` из ${totalPages}`}
            </span>
            <span className="text-sm text-gray-400">({progressPercent}%)</span>
            <button
              onClick={() => setEditing(true)}
              className="text-[#2D6B3F] hover:text-[#1E3322] text-sm"
            >
              Изменить
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

const ReviewSection = ({ review, onSave }) => {
  const [text, setText] = useState(review || '')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await onSave(text)
    setSaving(false)
    setEditing(false)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">Отзыв</h2>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-sm text-[#2D6B3F] hover:underline"
          >
            {review ? 'Редактировать' : 'Написать отзыв'}
          </button>
        )}
      </div>
      {editing ? (
        <div className="flex flex-col gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            placeholder="Напишите ваши впечатления о книге..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg
              outline-none focus:border-blue-500 text-sm resize-none"
          />
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Сохранение...' : 'Сохранить'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setText(review || '')
                setEditing(false)
              }}
            >
              Отмена
            </Button>
          </div>
        </div>
      ) : review ? (
        <p className="text-sm text-gray-600 leading-relaxed bg-gray-50
          rounded-xl p-4">
          {review}
        </p>
      ) : (
        <p className="text-sm text-gray-400">Отзыв ещё не написан</p>
      )}
    </div>
  )
}

const NotesSection = ({ notes, loading, bookId, onAdd, onUpdate, onDelete }) => {
  const [newNote, setNewNote] = useState('')
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')

  const handleAdd = async () => {
    if (!newNote.trim()) return
    setAdding(true)
    try {
      const response = await addNote(bookId, { content: newNote })
      onAdd(response.data)
      setNewNote('')
    } catch {
      alert('Не удалось добавить заметку.')
    } finally {
      setAdding(false)
    }
  }

  const handleUpdate = async (noteId) => {
    if (!editText.trim()) return
    try {
      const response = await updateNote(bookId, noteId, { content: editText })
      onUpdate(response.data)
      setEditingId(null)
    } catch {
      alert('Не удалось обновить заметку.')
    }
  }

  const handleDelete = async (noteId) => {
    if (!window.confirm('Удалить заметку?')) return
    try {
      await deleteNote(bookId, noteId)
      onDelete(noteId)
    } catch {
      alert('Не удалось удалить заметку.')
    }
  }

  if (loading) return <Spinner />

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Добавить заметку..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg
            outline-none focus:border-blue-500 text-sm resize-none"
        />
        <div>
          <Button onClick={handleAdd} disabled={adding || !newNote.trim()}>
            {adding ? 'Добавление...' : 'Добавить заметку'}
          </Button>
        </div>
      </div>

      {notes.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">
          Заметок пока нет
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {notes.map((note) => (
            <div key={note.id}
              className="bg-gray-50 rounded-xl p-4 flex flex-col gap-2">
              {editingId === note.id ? (
                <div className="flex flex-col gap-2">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={3}
                    autoFocus
                    className="w-full px-3 py-2 border border-[#2D6B3F]
                      rounded-lg outline-none text-sm resize-none"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleUpdate(note.id)}
                      className="py-1 px-3 text-sm"
                    >
                      Сохранить
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => setEditingId(null)}
                      className="py-1 px-3 text-sm"
                    >
                      Отмена
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {note.content}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      {formatDate(note.created_at)}
                      {note.updated_at !== note.created_at && ' (изменено)'}
                    </span>
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setEditingId(note.id)
                          setEditText(note.content)
                        }}
                        className="text-xs text-[#2D6B3F] hover:underline"
                      >
                        Изменить
                      </button>
                      <button
                        onClick={() => handleDelete(note.id)}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const QuotesSection = ({ quotes, loading, bookId, onAdd, onDelete }) => {
  const [content, setContent] = useState('')
  const [pageNumber, setPageNumber] = useState('')
  const [adding, setAdding] = useState(false)

  const handleAdd = async () => {
    if (!content.trim()) return
    setAdding(true)
    try {
      const response = await addQuote(bookId, {
        content,
        page_number: pageNumber ? Number(pageNumber) : null,
      })
      onAdd(response.data)
      setContent('')
      setPageNumber('')
    } catch {
      alert('Не удалось добавить цитату.')
    } finally {
      setAdding(false)
    }
  }

  const handleDelete = async (quoteId) => {
    if (!window.confirm('Удалить цитату?')) return
    try {
      await deleteQuote(bookId, quoteId)
      onDelete(quoteId)
    } catch {
      alert('Не удалось удалить цитату.')
    }
  }

  if (loading) return <Spinner />

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Текст цитаты..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg
            outline-none focus:border-blue-500 text-sm resize-none"
        />
        <div className="flex items-center gap-3">
          <input
            type="number"
            value={pageNumber}
            onChange={(e) => setPageNumber(e.target.value)}
            placeholder="Стр."
            className="w-20 px-2 py-2 border border-gray-300 rounded-lg
              outline-none focus:border-blue-500 text-sm text-center"
          />
          <Button onClick={handleAdd} disabled={adding || !content.trim()}>
            {adding ? 'Добавление...' : 'Добавить цитату'}
          </Button>
        </div>
      </div>

      {quotes.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">
          Цитат пока нет
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {quotes.map((quote) => (
            <div key={quote.id}
              className="border-l-4 border-[#B7D0B9] pl-4 py-2 flex
                flex-col gap-1">
              <p className="text-sm text-gray-700 leading-relaxed italic">
                «{quote.content}»
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  {quote.page_number
                    ? `Стр. ${quote.page_number}`
                    : formatDate(quote.created_at)
                  }
                </span>
                <button
                  onClick={() => handleDelete(quote.id)}
                  className="text-xs text-red-500 hover:underline"
                >
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default BookPage
