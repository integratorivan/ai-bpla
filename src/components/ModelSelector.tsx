import type { ModelState } from '../types/ml5'
import { YOLOV8_MODELS } from '../constants'

interface ModelSelectorProps {
  modelState: ModelState
  onSwitchModel: (modelType: 'coco-ssd' | 'yolov8', modelUrl?: string, yolov8Variant?: keyof typeof YOLOV8_MODELS) => void
}

export function ModelSelector({ modelState, onSwitchModel }: ModelSelectorProps) {
  const handleModelChange = (e: Event) => {
    const target = e.target as HTMLSelectElement
    const value = target.value
    
    if (value === 'coco-ssd') {
      onSwitchModel('coco-ssd')
    } else if (value.startsWith('yolov8-')) {
      const variant = value.replace('yolov8-', '') as keyof typeof YOLOV8_MODELS
      onSwitchModel('yolov8', undefined, variant)
    }
  }

  const getCurrentValue = () => {
    if (modelState.modelType === 'coco-ssd') {
      return 'coco-ssd'
    } else if (modelState.modelType === 'yolov8' && modelState.modelInfo?.variant) {
      return `yolov8-${modelState.modelInfo.variant}`
    }
    return 'coco-ssd'
  }

  return (
    <div className="model-options">
      <div className="model-select">
        <label htmlFor="model-selector">🤖 Модель:</label>
        <select 
          id="model-selector" 
          value={getCurrentValue()} 
          onChange={handleModelChange}
        >
          <option value="coco-ssd">🎯 COCO-SSD - Детекция объектов</option>
          <optgroup label="🔍 YOLOv8 - Детекция объектов">
            {Object.entries(YOLOV8_MODELS).map(([variant, config]) => (
              <option key={variant} value={`yolov8-${variant}`}>
                🚀 {config.name} ({config.size})
              </option>
            ))}
          </optgroup>
        </select>
      </div>

      <div className="model-info">
        <div className="model-status">
          <span className={modelState.loaded ? 'status-loaded' : 'status-loading'}>
            {modelState.loaded ? '✅' : '⏳'}
          </span>
          <span>
            {modelState.loaded ? 'Модель загружена' : 'Загрузка модели...'}
          </span>
        </div>

        <div className="model-description">
          {modelState.modelType === 'coco-ssd' ? (
            <p>
              <strong>COCO-SSD</strong> - быстрая детекция и локализация объектов
            </p>
          ) : modelState.modelType === 'yolov8' ? (
            <p>
              <strong>YOLOv8</strong> - точная детекция объектов в реальном времени
              {modelState.modelInfo && (
                <span className="model-variant">
                  <br />📊 {modelState.modelInfo.name} - {modelState.modelInfo.size}
                  {modelState.modelInfo.accuracy && `, ${modelState.modelInfo.accuracy} точность`}
                </span>
              )}
            </p>
          ) : (
            <p>
              <strong>Модель</strong> - детекция объектов
            </p>
          )}
        </div>
      </div>
    </div>
  )
} 