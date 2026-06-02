import { useNavigate } from 'react-router-dom'

const STATUS_CONFIG = {
  want_to_read: {
    label: 'Хочу прочитать',
    style: { background: '#F3F7F2', color: '#6B7B6B' },
  },
  reading: {
    label: 'Читаю',
    style: { background: '#E1F0E3', color: '#2D6B3F' },
  },
  finished: {
    label: 'Прочитал',
    style: { background: '#E1F0E3', color: '#1E3322' },
  },
  dropped: {
    label: 'Не буду дочитывать',
    style: { background: '#fce8e8', color: '#8a4242' },
  },
}

const MiniStars = ({ rating }) => {
  if (!rating) return null
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className="w-3.5 h-3.5"
          fill="currentColor"
          viewBox="0 0 24 24"
          style={{ color: star <= rating ? '#FBBF24' : '#D6E1D5' }}
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  )
}

const BookCard = ({ userBook }) => {
  const navigate = useNavigate()
  const { book, status, progress_percent, rating } = userBook
  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.want_to_read
  const authors = book.authors?.map(a => a.name).join(', ') || 'Автор неизвестен'

  return (
    <div
      onClick={() => navigate(`/library/${userBook.id}`)}
      className="bg-white rounded-lg border border-[#D6E1D5] overflow-hidden
        hover:shadow-md hover:border-[#BFD6C3]
        transition-all duration-200 cursor-pointer flex flex-col"
    >
      {/* Обложка */}
      <div
        className="aspect-[3/4] relative overflow-hidden flex items-center justify-center p-3"
        style={{ background: '#F3F7F2' }}
      >
        {book.cover_url ? (
          <img
            src={book.cover_url}
            alt={book.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <span
            className="text-center text-xs font-extrabold leading-tight"
            style={{ color: '#2D6B3F', wordSpacing: '9999px' }}
          >
            {book.title.toUpperCase()}
          </span>
        )}
      </div>

      {/* Информация */}
      <div className="p-3 flex flex-col gap-2 flex-1">
        <div>
          <h3 className="font-bold text-sm leading-tight line-clamp-2" style={{ color: 'var(--text)' }}>
            {book.title}
          </h3>
          <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--muted)' }}>
            {authors}
          </p>
        </div>

        {/* Статус */}
        <span
          className="text-xs px-2 py-1 rounded font-bold w-fit leading-none"
          style={statusConfig.style}
        >
          {statusConfig.label}
        </span>

        {/* Прогресс */}
        {status === 'reading' && (
          <div>
            <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--muted)' }}>
              <span>Прогресс</span>
              <span className="font-mono font-bold">{progress_percent}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full" style={{ background: '#E2E9E1' }}>
              <div
                className="h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${progress_percent}%`, background: '#2D6B3F' }}
              />
            </div>
          </div>
        )}

        {/* Рейтинг */}
        {status === 'finished' && <MiniStars rating={rating} />}
      </div>
    </div>
  )
}

export default BookCard
