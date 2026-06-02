const Spinner = ({ size = 'md' }) => {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-4',
    lg: 'w-12 h-12 border-4',
  }

  return (
    <div className="flex justify-center items-center">
      <div
        className={`${sizes[size]} rounded-full animate-spin`}
        style={{
          borderColor: '#E2E9E1',
          borderTopColor: '#2D6B3F',
        }}
      />
    </div>
  )
}

export default Spinner
