import { useState } from 'react'

const StarRating = ({
  value,
  onChange,
  readonly = false,
  size = 'md',
}) => {
  const [hovered, setHovered] = useState(null)

  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' }

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = hovered ? star <= hovered : star <= (value || 0)
        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => !readonly && onChange(star)}
            onMouseEnter={() => !readonly && setHovered(star)}
            onMouseLeave={() => !readonly && setHovered(null)}
            className={`${sizes[size]} transition-colors duration-100 ${readonly ? 'cursor-default' : 'cursor-pointer'}`}
          >
            <svg
              viewBox="0 0 24 24"
              fill={filled ? 'currentColor' : 'none'}
              stroke="currentColor"
              style={{ color: filled ? '#FBBF24' : '#D6E1D5' }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              />
            </svg>
          </button>
        )
      })}
    </div>
  )
}

export default StarRating
