const Input = ({
  label,
  type = 'text',
  name,
  value,
  onChange,
  placeholder = '',
  error = '',
  required = false,
  className = '',
  icon,
}) => {
  return (
    <div className={`flex flex-col gap-[7px] w-full ${className}`}>

      {label && (
        <label className="text-xs font-bold" style={{ color: 'var(--muted)' }}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className={`
        flex items-center gap-2.5 h-[46px] px-3.5 rounded-md border
        transition-colors duration-150
        ${error
          ? 'border-red-400 bg-white'
          : 'border-[#D6E1D5] bg-[#F7FAF6] focus-within:border-[#2D6B3F] focus-within:bg-white'
        }
      `}>
        {icon && (
          <span className="flex items-center flex-shrink-0" style={{ color: 'var(--muted)' }}>
            {icon}
          </span>
        )}
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className="flex-1 bg-transparent border-0 outline-none text-sm min-w-0
            placeholder-[#6B7B6B]"
          style={{ color: 'var(--text)' }}
        />
      </div>

      {error && (
        <span className="text-red-500 text-xs">{error}</span>
      )}

    </div>
  )
}

export default Input
