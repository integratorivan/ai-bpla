import { useRef, useEffect } from 'preact/hooks'
import type { Detection } from '../types/ml5'

interface VideoWithOverlayProps {
  cameraEnabled: boolean
  isAnalyzing: boolean
  modelLoaded: boolean
  onClassifyFrame: () => void
  videoRef: { current: HTMLVideoElement | null }
  canvasRef: { current: HTMLCanvasElement | null }
  detections: Detection[]
}

export function VideoWithOverlay({ 
  cameraEnabled, 
  isAnalyzing, 
  modelLoaded, 
  onClassifyFrame,
  videoRef,
  canvasRef,
  detections
}: VideoWithOverlayProps) {
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null)

  // Убеждаемся, что видео элемент зарегистрирован
  useEffect(() => {
    console.log('🎬 VideoWithOverlay монтирован, videoRef.current:', videoRef.current)
    
    const checkVideoRef = () => {
      if (videoRef.current) {
        console.log('✅ Видео элемент найден:', videoRef.current)
        videoRef.current.addEventListener('loadedmetadata', () => {
          console.log('📹 Метаданные загружены в компоненте')
        })
      } else {
        console.warn('⚠️ videoRef.current все еще null, повторная проверка через 100мс')
        setTimeout(checkVideoRef, 100)
      }
    }
    
    checkVideoRef()
  }, [])

  // Отрисовка bounding boxes на overlay canvas
  useEffect(() => {
    if (!overlayCanvasRef.current || !videoRef.current) return

    const canvas = overlayCanvasRef.current
    const ctx = canvas.getContext('2d')
    const video = videoRef.current

    // Получаем реальные размеры видео
    const videoRect = video.getBoundingClientRect()
    const videoWidth = video.videoWidth || 640
    const videoHeight = video.videoHeight || 480
    const displayWidth = videoRect.width || 640
    const displayHeight = videoRect.height || 480

    console.log('📹 Размеры видео:', { videoWidth, videoHeight, displayWidth, displayHeight })

    // Устанавливаем размер canvas равным отображаемому размеру видео
    canvas.width = displayWidth
    canvas.height = displayHeight
    canvas.style.width = `${displayWidth}px`
    canvas.style.height = `${displayHeight}px`
    
    // Очищаем canvas
    ctx?.clearRect(0, 0, canvas.width, canvas.height)

    if (!ctx || detections.length === 0) return

    // Отрисовываем каждую детекцию
    detections.forEach((detection, index) => {
      const [x, y, width, height] = detection.bbox

      // Выбираем цвет для bounding box (уникальный для каждого класса)
      const hue = (detection.classId * 137) % 360
      const color = `hsl(${hue}, 70%, 50%)`
      const bgColor = `hsla(${hue}, 70%, 50%, 0.2)`

      // Рисуем заливку
      ctx.fillStyle = bgColor
      ctx.fillRect(x, y, width, height)

      // Рисуем рамку
      ctx.strokeStyle = color
      ctx.lineWidth = 3
      ctx.strokeRect(x, y, width, height)

      // Подготавливаем текст
      const label = `${detection.class} ${Math.round(detection.confidence * 100)}%`
      const fontSize = Math.max(12, Math.min(18, width / 8))
      ctx.font = `bold ${fontSize}px Arial`
      
      // Измеряем размер текста
      const textMetrics = ctx.measureText(label)
      const textWidth = textMetrics.width
      const textHeight = fontSize

      // Рисуем фон для текста
      const padding = 6
      const labelX = x
      const labelY = y > textHeight + padding ? y - padding : y + height + textHeight + padding

      ctx.fillStyle = color
      ctx.fillRect(labelX, labelY - textHeight - padding, textWidth + padding * 2, textHeight + padding * 2)

      // Рисуем обводку для текста
      ctx.strokeStyle = '#000'
      ctx.lineWidth = 3
      ctx.strokeText(label, labelX + padding, labelY - padding)
      
      // Рисуем белый текст
      ctx.fillStyle = '#fff'
      ctx.fillText(label, labelX + padding, labelY - padding)
    })
  }, [detections, videoRef])

  if (!cameraEnabled) {
    return null
  }

  return (
    <div className="video-overlay-container">
      <video
        ref={(el) => {
          if (videoRef) {
            videoRef.current = el
            console.log('🎬 Видео элемент установлен:', el)
          }
        }}
        autoPlay
        muted
        playsInline
        controls
        className="video-element"
        style={{
          width: '100%',
          maxWidth: '640px',
          height: 'auto'
        }}
        onLoadedData={() => console.log('📹 Видео данные загружены')}
        onPlay={() => console.log('📹 Видео начало воспроизведение')}
        onError={(e) => console.error('❌ Ошибка видео:', e)}
        onLoadedMetadata={() => console.log('📹 Метаданные видео загружены')}
      />
      
      {/* Canvas для детекций, наложенный поверх видео */}
      <canvas
        ref={overlayCanvasRef}
        className="detection-overlay"
      />
      
      {/* Скрытый canvas для захвата кадров */}
      <canvas
        ref={canvasRef}
        style={{ display: 'none' }}
      />
      
      {/* Ручная классификация */}
      <div className="manual-controls">
        <button 
          onClick={onClassifyFrame}
          disabled={isAnalyzing || !modelLoaded}
          className="btn-analyze"
        >
          {isAnalyzing ? '🔄 Анализируем...' : '🔍 Анализировать сейчас'}
        </button>
      </div>
    </div>
  )
} 