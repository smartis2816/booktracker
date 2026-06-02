const Button = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  disabled = false,
  className = '',
}) => {
  const base = `inline-flex items-center justify-center gap-2
    px-4 py-[11px] rounded-md text-sm font-bold leading-none
    transition-colors duration-150 whitespace-nowrap
    disabled:opacity-50 disabled:cursor-not-allowed`

  const variants = {
    primary:   'bg-[#2D6B3F] text-white hover:bg-[#265c36]',
    secondary: 'bg-white text-[#1E3322] border border-[#D6E1D5] hover:bg-[#F3F7F2]',
    danger:    'bg-red-600 text-white hover:bg-red-700',
    dark:      'bg-[#1E3322] text-white hover:bg-[#16271b]',
    ghost:     'bg-transparent text-[#2D6B3F] hover:bg-[#F3F7F2]',
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant] || variants.primary} ${className}`}
    >
      {children}
    </button>
  )
}

export default Button
