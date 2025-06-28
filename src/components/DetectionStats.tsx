import type { Detection, YOLOv8Detection, ModelState } from '../types/ml5'

interface DetectionStatsProps {
  detections: Detection[]
  yolov8Detections?: YOLOv8Detection[]
  isAnalyzing: boolean
  modelState?: ModelState
}

export function DetectionStats({ 
  detections, 
  yolov8Detections, 
  isAnalyzing, 
  modelState 
}: DetectionStatsProps) {
  // Получаем актуальные детекции в зависимости от типа модели
  const currentDetections = modelState?.modelType === 'yolov8' && yolov8Detections 
    ? yolov8Detections 
    : detections

  // Получаем статистику детекций
  const detectionStats = currentDetections.reduce((acc, detection) => {
    acc[detection.class] = (acc[detection.class] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const sortedStats = Object.entries(detectionStats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10) // Показываем топ-10

  // Определяем название модели для заголовка
  const modelName = modelState?.modelType === 'yolov8' 
    ? 'YOLOv8' 
    : modelState?.modelType === 'coco-ssd' 
    ? 'COCO-SSD' 
    : 'YOLO'

  return (
    <div class="detection-display">
      <div class="detection-header">
        <h3>🎯 Детекция объектов {modelName}</h3>
        {isAnalyzing && <div class="analyzing-indicator">⏳ Анализируем...</div>}
        {modelState?.modelInfo && (
          <div class="model-info-small">
            <small>📊 {modelState.modelInfo.name}</small>
          </div>
        )}
      </div>

      {/* Статистика детекций */}
      {currentDetections.length > 0 ? (
        <div class="detection-stats">
          <h4>📊 Обнаружено объектов: {currentDetections.length}</h4>
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
      {currentDetections.length > 0 && (
        <details class="detection-details">
          <summary>🔍 Подробности детекций ({currentDetections.length})</summary>
          <div class="detection-list">
            {currentDetections.map((detection, index) => (
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
                {/* Показываем дополнительную информацию для YOLOv8 */}
                {modelState?.modelType === 'yolov8' && 'area' in detection && (
                  <div class="detection-area">
                    <small>Площадь: {Math.round(Number((detection as any).area) || 0)}</small>
                  </div>
                )}
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  )
} 