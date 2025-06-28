import type { ModelState } from '../types/ml5'

interface ModelStatusProps {
  modelState: ModelState
  loadingProgress?: number
  className?: string
}

export function ModelStatus({ modelState, loadingProgress = 0, className = '' }: ModelStatusProps) {
  const getStatusText = () => {
    if (!modelState.loaded && !modelState.tensorflowModel) {
      const progressPercent = Math.round(loadingProgress * 100)
      return {
        icon: '⏳',
        text: `Загружаем модель ${modelState.modelType?.toUpperCase() || 'ИИ'}...`,
        progress: progressPercent,
        status: 'loading'
      }
    } else if (modelState.loaded && modelState.tensorflowModel) {
      const modelName = modelState.modelInfo?.name || modelState.modelType?.toUpperCase() || 'ИИ'
      return {
        icon: '✅',
        text: `${modelName} готова для детекции`,
        progress: 100,
        status: 'ready'
      }
    } else {
      return {
        icon: '❌',
        text: 'Ошибка загрузки модели',
        progress: 0,
        status: 'error'
      }
    }
  }

  const statusInfo = getStatusText()

  return (
    <div className={`model-status status-${statusInfo.status} ${className}`.trim()}>
      <span className="status-icon">{statusInfo.icon}</span>
      <div className="status-content">
        <span className="status-text">{statusInfo.text}</span>
        {statusInfo.status === 'loading' && statusInfo.progress > 0 && (
          <div className="progress-info">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${statusInfo.progress}%` }}
              />
            </div>
            <span className="progress-text">{statusInfo.progress}%</span>
          </div>
        )}
        {modelState.modelInfo?.size && statusInfo.status === 'ready' && (
          <span className="model-size">
            {modelState.modelInfo.size}
            {modelState.modelInfo.accuracy && ` • ${modelState.modelInfo.accuracy} точность`}
          </span>
        )}
      </div>
    </div>
  )
} 