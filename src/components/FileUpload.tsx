import { useState } from 'preact/hooks'
import type { DragState, StreamState } from '../types/ml5'

interface FileUploadProps {
  streamState: StreamState
  modelLoaded: boolean
  onFileLoad: (file: File) => void
  onStopStream: () => void
}

export function FileUpload({ 
  streamState, 
  modelLoaded, 
  onFileLoad, 
  onStopStream 
}: FileUploadProps) {
  const [dragState, setDragState] = useState<DragState>({
    isDragOver: false,
    isDragActive: false
  })

  const handleDragEnter = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragState(prev => ({ ...prev, isDragOver: true, isDragActive: true }))
  }

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Проверяем, что мы действительно покинули зону дропа
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const x = e.clientX
    const y = e.clientY
    
    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setDragState(prev => ({ ...prev, isDragOver: false, isDragActive: false }))
    }
  }

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    setDragState({ isDragOver: false, isDragActive: false })
    
    const files = e.dataTransfer?.files
    if (files && files.length > 0) {
      const file = files[0]
      console.log('📁 Файл перетащен:', file.name, file.type)
      
      // Проверяем, что это видеофайл
      if (file.type.startsWith('video/')) {
        onFileLoad(file)
      } else {
        alert('Пожалуйста, выберите видеофайл (.mp4, .webm, .mov, .avi)')
      }
    }
  }

  const handleFileInput = (e: Event) => {
    const target = e.target as HTMLInputElement
    const files = target.files
    
    if (files && files.length > 0) {
      const file = files[0]
      console.log('📁 Файл выбран:', file.name, file.type)
      onFileLoad(file)
    }
  }

  const getDropZoneClass = () => {
    let className = 'file-upload-zone'
    if (dragState.isDragOver) className += ' drag-over'
    if (dragState.isDragActive) className += ' drag-active'
    if (!modelLoaded) className += ' disabled'
    return className
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="file-upload-container">
      {/* Drag & Drop зона */}
      <div
        className={getDropZoneClass()}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="upload-content">
          {dragState.isDragOver ? (
            <>
              <div className="upload-icon">📁</div>
              <div className="upload-text">Отпустите файл для загрузки</div>
            </>
          ) : (
            <>
              <div className="upload-icon">🎬</div>
              <div className="upload-text">
                <strong>Перетащите видеофайл сюда</strong>
                <br />
                или нажмите для выбора файла
              </div>
              <div className="upload-formats">
                Поддерживаемые форматы: MP4, WebM, MOV, AVI
              </div>
            </>
          )}
        </div>
        
        {/* Скрытый input для выбора файла */}
        <input
          type="file"
          accept="video/*"
          onChange={handleFileInput}
          className="file-input-hidden"
          disabled={!modelLoaded}
        />
      </div>

      {/* Информация о загруженном файле */}
      {streamState.isFileMode && streamState.currentFile && (
        <div className="file-info">
          <div className="file-details">
            <div className="file-name">
              📹 {streamState.fileName}
            </div>
            <div className="file-size">
              Размер: {formatFileSize(streamState.currentFile.size)}
            </div>
            <div className="file-type">
              Тип: {streamState.currentFile.type}
            </div>
          </div>
          <button onClick={onStopStream} className="btn-secondary">
            ❌ Удалить файл
          </button>
        </div>
      )}
    </div>
  )
} 