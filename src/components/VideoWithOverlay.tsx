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

  // Адаптивная отрисовка bounding boxes на overlay canvas
  useEffect(() => {
    if (!overlayCanvasRef.current || !videoRef.current) return

    const canvas = overlayCanvasRef.current
    const ctx = canvas.getContext('2d')
    const video = videoRef.current

    // Ждем загрузки метаданных видео
    if (!video.videoWidth || !video.videoHeight) {
      console.log('⏳ Ждем загрузки метаданных видео...')
      return
    }

    // Получаем точные размеры элементов
    const videoRect = video.getBoundingClientRect()
    const actualVideoWidth = video.videoWidth
    const actualVideoHeight = video.videoHeight
    const displayWidth = Math.round(videoRect.width)
    const displayHeight = Math.round(videoRect.height)

    // Вычисляем коэффициенты масштабирования
    const scaleX = displayWidth / actualVideoWidth
    const scaleY = displayHeight / actualVideoHeight

    console.log('📹 Размеры видео:', { 
      actualVideoWidth, 
      actualVideoHeight, 
      displayWidth, 
      displayHeight,
      scaleX,
      scaleY
    })

    // Устанавливаем размер canvas с device pixel ratio для четкости
    const dpr = window.devicePixelRatio || 1
    canvas.width = displayWidth * dpr
    canvas.height = displayHeight * dpr
    canvas.style.width = `${displayWidth}px`
    canvas.style.height = `${displayHeight}px`
    
    // Масштабируем контекст для device pixel ratio
    ctx?.scale(dpr, dpr)
    
    // Очищаем canvas
    ctx?.clearRect(0, 0, displayWidth, displayHeight)

    if (!ctx || detections.length === 0) return

    // Отрисовываем каждую детекцию с правильным масштабированием
    detections.forEach((detection, index) => {
      const [x, y, width, height] = detection.bbox

      // Применяем масштабирование координат
      const scaledX = x * scaleX
      const scaledY = y * scaleY
      const scaledWidth = width * scaleX
      const scaledHeight = height * scaleY

      // Проверяем, что координаты в пределах canvas
      if (scaledX < 0 || scaledY < 0 || 
          scaledX + scaledWidth > displayWidth || 
          scaledY + scaledHeight > displayHeight) {
        console.log('⚠️ Детекция вне границ canvas:', { scaledX, scaledY, scaledWidth, scaledHeight })
        return
      }

      // Выбираем цвет для bounding box (уникальный для каждого класса)
      const hue = (detection.classId * 137) % 360
      const color = `hsl(${hue}, 70%, 50%)`
      const bgColor = `hsla(${hue}, 70%, 50%, 0.2)`

      // Рисуем заливку
      ctx.fillStyle = bgColor
      ctx.fillRect(scaledX, scaledY, scaledWidth, scaledHeight)

      // Рисуем рамку
      ctx.strokeStyle = color
      ctx.lineWidth = Math.max(2, Math.round(3 * Math.min(scaleX, scaleY)))
      ctx.strokeRect(scaledX, scaledY, scaledWidth, scaledHeight)

      // Подготавливаем текст с адаптивным размером
      const label = `${detection.class} ${Math.round(detection.confidence * 100)}%`
      const baseFontSize = Math.max(10, Math.min(16, scaledWidth / 8))
      const fontSize = Math.round(baseFontSize * Math.min(scaleX, scaleY))
      ctx.font = `bold ${fontSize}px Arial`
      
      // Измеряем размер текста
      const textMetrics = ctx.measureText(label)
      const textWidth = textMetrics.width
      const textHeight = fontSize

      // Адаптивный padding
      const padding = Math.max(4, Math.round(6 * Math.min(scaleX, scaleY)))
      const labelX = scaledX
      const labelY = scaledY > textHeight + padding ? 
        scaledY - padding : 
        scaledY + scaledHeight + textHeight + padding

      // Проверяем, что текст помещается в canvas
      const textBoxWidth = textWidth + padding * 2
      const adjustedLabelX = Math.min(labelX, displayWidth - textBoxWidth)

      // Рисуем фон для текста
      ctx.fillStyle = color
      ctx.fillRect(adjustedLabelX, labelY - textHeight - padding, textBoxWidth, textHeight + padding * 2)

      // Рисуем обводку для текста (адаптивная толщина)
      ctx.strokeStyle = '#000'
      ctx.lineWidth = Math.max(1, Math.round(2 * Math.min(scaleX, scaleY)))
      ctx.strokeText(label, adjustedLabelX + padding, labelY - padding)
      
      // Рисуем белый текст
      ctx.fillStyle = '#fff'
      ctx.fillText(label, adjustedLabelX + padding, labelY - padding)
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