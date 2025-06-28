import { useEffect, useRef } from 'preact/hooks'
import type { Detection } from '../types/ml5'

interface DetectionDisplayProps {
  detections: Detection[]
  videoRef: { current: HTMLVideoElement | null }
  isAnalyzing: boolean
}

export function DetectionDisplay({ detections, videoRef, isAnalyzing }: DetectionDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Отрисовка bounding boxes на canvas
  useEffect(() => {
    if (!canvasRef.current || !videoRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const video = videoRef.current

    // Устанавливаем размер canvas равным размеру видео
    canvas.width = video.videoWidth || video.clientWidth || 640
    canvas.height = video.videoHeight || video.clientHeight || 480

    // Очищаем canvas
    ctx?.clearRect(0, 0, canvas.width, canvas.height)

    if (!ctx || detections.length === 0) return

    // Получаем коэффициенты масштабирования
    const scaleX = canvas.width / (video.videoWidth || canvas.width)
    const scaleY = canvas.height / (video.videoHeight || canvas.height)

    // Отрисовываем каждую детекцию
    detections.forEach((detection, index) => {
      const [x, y, width, height] = detection.bbox
      
      // Масштабируем координаты
      const scaledX = x * scaleX
      const scaledY = y * scaleY
      const scaledWidth = width * scaleX
      const scaledHeight = height * scaleY

      // Выбираем цвет для bounding box (уникальный для каждого класса)
      const hue = (detection.classId * 137) % 360
      const color = `hsl(${hue}, 70%, 50%)`
      const bgColor = `hsla(${hue}, 70%, 50%, 0.2)`

      // Рисуем заливку
      ctx.fillStyle = bgColor
      ctx.fillRect(scaledX, scaledY, scaledWidth, scaledHeight)

      // Рисуем рамку
      ctx.strokeStyle = color
      ctx.lineWidth = 3
      ctx.strokeRect(scaledX, scaledY, scaledWidth, scaledHeight)

      // Подготавливаем текст
      const label = `${detection.class} ${Math.round(detection.confidence * 100)}%`
      const fontSize = Math.max(12, Math.min(16, scaledWidth / 10))
      ctx.font = `bold ${fontSize}px Arial`
      ctx.fillStyle = '#fff'
      ctx.strokeStyle = '#000'
      ctx.lineWidth = 3

      // Измеряем размер текста
      const textMetrics = ctx.measureText(label)
      const textWidth = textMetrics.width
      const textHeight = fontSize

      // Рисуем фон для текста
      const padding = 4
      const labelX = scaledX
      const labelY = scaledY > textHeight + padding ? scaledY - padding : scaledY + scaledHeight + textHeight + padding

      ctx.fillStyle = color
      ctx.fillRect(labelX, labelY - textHeight - padding, textWidth + padding * 2, textHeight + padding * 2)

      // Рисуем текст
      ctx.strokeText(label, labelX + padding, labelY - padding)
      ctx.fillStyle = '#fff'
      ctx.fillText(label, labelX + padding, labelY - padding)
    })
  }, [detections, videoRef])

  // Получаем статистику детекций
  const detectionStats = detections.reduce((acc, detection) => {
    acc[detection.class] = (acc[detection.class] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const sortedStats = Object.entries(detectionStats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10) // Показываем топ-10

  return (
    <div class="detection-display">
      <div class="detection-header">
        <h3>🎯 Детекция объектов YOLO</h3>
        {isAnalyzing && <div class="analyzing-indicator">⏳ Анализируем...</div>}
      </div>

      {/* Canvas для отображения bounding boxes */}
      <div class="detection-canvas-container">
        <canvas 
          ref={canvasRef}
          class="detection-canvas"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            pointerEvents: 'none',
            zIndex: 10
          }}
        />
      </div>

      {/* Статистика детекций */}
      {detections.length > 0 ? (
        <div class="detection-stats">
          <h4>📊 Обнаружено объектов: {detections.length}</h4>
          <div class="stats-grid">
            {sortedStats.map(([className, count]) => (
              <div key={className} class="stat-item">
                <span class="stat-class">{className}</span>
                <span class="stat-count">{count}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div class="no-detections">
          <p>🔍 Объекты не обнаружены</p>
          <small>Попробуйте изменить угол камеры или добавить объекты в кадр</small>
        </div>
      )}

      {/* Список всех детекций */}
      {detections.length > 0 && (
        <details class="detection-details">
          <summary>🔍 Подробности детекций ({detections.length})</summary>
          <div class="detection-list">
            {detections.map((detection, index) => (
              <div key={index} class="detection-item">
                <div class="detection-class">
                  {detection.class}
                </div>
                <div class="detection-confidence">
                  {Math.round(detection.confidence * 100)}%
                </div>
                <div class="detection-bbox">
                  [{detection.bbox.map(coord => Math.round(coord)).join(', ')}]
                </div>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  )
} 