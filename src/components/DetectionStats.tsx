import type { Detection } from '../types/ml5'

interface DetectionStatsProps {
  detections: Detection[]
  isAnalyzing: boolean
}

export function DetectionStats({ detections, isAnalyzing }: DetectionStatsProps) {
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