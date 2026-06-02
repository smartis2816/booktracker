import { useState, useRef } from 'react'
import Modal from './ui/Modal'
import Button from './ui/Button'
import Input from './ui/Input'
import { uploadCover, updateCoverUrl } from '../api/books'

const CoverEditModal = ({ isOpen, onClose, bookId, currentCover, onUpdated }) => {
  const [activeTab, setActiveTab] = useState('url')

  const [urlInput, setUrlInput] = useState('')
  const [urlError, setUrlError] = useState('')

  const [selectedFile, setSelectedFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [fileError, setFileError] = useState('')

  const [saving, setSaving] = useState(false)

  const fileInputRef = useRef(null)

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return

    setFileError('')

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      setFileError('Допустимые форматы: JPEG, PNG, WebP, GIF')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setFileError('Размер файла не должен превышать 5 МБ')
      return
    }

    setSelectedFile(file)

    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target.result)
    reader.readAsDataURL(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect({ target: { files: [file] } })
    }
  }

  const handleSaveUrl = async () => {
    if (!urlInput.trim()) {
      setUrlError('Введите ссылку на изображение')
      return
    }

    try {
      new URL(urlInput)
    } catch {
      setUrlError('Введите корректный URL')
      return
    }

    setSaving(true)
    try {
      const response = await updateCoverUrl(bookId, urlInput)
      onUpdated(response.data.cover_url)
      handleClose()
    } catch {
      setUrlError('Не удалось обновить обложку.')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveFile = async () => {
    if (!selectedFile) return

    setSaving(true)
    try {
      const formData = new FormData()
      formData.append('cover', selectedFile)

      const response = await uploadCover(bookId, formData)
      onUpdated(response.data.cover_url)
      handleClose()
    } catch (error) {
      const message = error.response?.data?.error
        || 'Не удалось загрузить обложку.'
      setFileError(message)
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    setUrlInput('')
    setUrlError('')
    setSelectedFile(null)
    setPreview(null)
    setFileError('')
    setActiveTab('url')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Изменить обложку">

      {/* Текущая обложка */}
      {currentCover && (
        <div className="flex justify-center mb-4">
          <div className="w-24 h-32 rounded-lg overflow-hidden bg-gray-100">
            <img
              src={currentCover}
              alt="Текущая обложка"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      {/* Вкладки */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg mb-4">
        <button
          onClick={() => setActiveTab('url')}
          className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium
            transition-colors duration-150
            ${activeTab === 'url'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          По ссылке
        </button>
        <button
          onClick={() => setActiveTab('file')}
          className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium
            transition-colors duration-150
            ${activeTab === 'file'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          С компьютера
        </button>
      </div>

      {/* ===== ВКЛАДКА URL ===== */}
      {activeTab === 'url' && (
        <div className="flex flex-col gap-4">
          <Input
            label="Ссылка на изображение"
            value={urlInput}
            onChange={(e) => {
              setUrlInput(e.target.value)
              setUrlError('')
            }}
            placeholder="https://example.com/cover.jpg"
            error={urlError}
          />

          {/* Предпросмотр по URL */}
          {urlInput && !urlError && (
            <div className="flex justify-center">
              <div className="w-24 h-32 rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={urlInput}
                  alt="Предпросмотр"
                  className="w-full h-full object-cover"
                  onError={() => setUrlError('Не удалось загрузить изображение по этой ссылке')}
                />
              </div>
            </div>
          )}

          <Button
            onClick={handleSaveUrl}
            disabled={saving || !urlInput.trim()}
            className="w-full"
          >
            {saving ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </div>
      )}

       {activeTab === 'file' && (
        <div className="flex flex-col gap-4">

          {/* Скрытый input для выбора файла */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Зона перетаскивания */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-xl
              p-8 text-center cursor-pointer
              hover:border-blue-400 hover:bg-blue-50
              transition-colors duration-150"
          >
            {preview ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-24 h-32 rounded-lg overflow-hidden">
                  <img
                    src={preview}
                    alt="Предпросмотр"
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-sm text-gray-500">
                  {selectedFile?.name}
                </p>
                <p className="text-xs text-blue-600">
                  Нажмите чтобы выбрать другой файл
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <svg className="w-10 h-10 text-gray-400" fill="none"
                  stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Нажмите или перетащите файл
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    JPEG, PNG, WebP, GIF — до 5 МБ
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Ошибка файла */}
          {fileError && (
            <p className="text-sm text-red-500">{fileError}</p>
          )}

          <Button
            onClick={handleSaveFile}
            disabled={saving || !selectedFile}
            className="w-full"
          >
            {saving ? 'Загрузка...' : 'Загрузить обложку'}
          </Button>

        </div>
      )}

    </Modal>
  )
}

export default CoverEditModal
