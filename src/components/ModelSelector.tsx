import type { ModelState } from '../types/ml5'

interface ModelSelectorProps {
  modelState: ModelState
  onSwitchModel: (modelType: 'mobilenet' | 'yolo' | 'coco-ssd', modelUrl?: string) => void
  disabled: boolean
}

export function ModelSelector({ modelState, onSwitchModel, disabled }: ModelSelectorProps) {
  const handleModelChange = (event: Event) => {
    const target = event.target as HTMLSelectElement
    const modelType = target.value as 'mobilenet' | 'yolo' | 'coco-ssd'
    onSwitchModel(modelType)
  }

  const handleCustomYOLOUrl = () => {
    const url = prompt('Введите URL YOLO модели (model.json):')
    if (url) {
      onSwitchModel('yolo', url)
    }
  }

  return (
    <div class="model-selector">
      <h3>🤖 Выбор модели ИИ</h3>
      
      <div class="model-options">
        <select 
          value={modelState.modelType} 
          onChange={handleModelChange}
          disabled={disabled}
          class="model-select"
        >
          <option value="mobilenet">📱 MobileNet (Классификация)</option>
          <option value="coco-ssd">🎯 COCO-SSD (Детекция объектов) - Рекомендуется</option>
          <option value="yolo">⚡ YOLO (Детекция объектов) - Экспериментально</option>
        </select>

        {modelState.modelType === 'yolo' && (
          <button 
            onClick={handleCustomYOLOUrl}
            disabled={disabled}
            class="custom-model-btn"
            type="button"
          >
            📁 Загрузить свою YOLO модель
          </button>
        )}
      </div>

      <div class="model-info">
        <div class={`status-indicator ${modelState.loaded ? 'loaded' : 'loading'}`}>
          {modelState.loaded ? '✅' : '⏳'}
        </div>
        
        <div class="model-description">
          {modelState.modelType === 'mobilenet' ? (
            <div>
              <strong>MobileNet</strong> - быстрая классификация изображений
              <br />
              <small>🔍 Определяет тип объекта с процентом уверенности</small>
            </div>
          ) : modelState.modelType === 'coco-ssd' ? (
            <div>
              <strong>COCO-SSD</strong> - надежная детекция объектов от Google
              <br />
              <small>🎯 Официальная модель TensorFlow.js для детекции 90 классов объектов</small>
            </div>
          ) : (
            <div>
              <strong>YOLO</strong> - экспериментальная детекция объектов  
              <br />
              <small>⚡ Быстрая детекция, но требует правильную модель</small>
            </div>
          )}
        </div>
      </div>

      {modelState.tensorflowModel && (
        <div class="model-details">
          <h4>📊 Детали модели:</h4>
          <div class="model-specs">
            <div>Входной размер: {modelState.tensorflowModel.inputShape.join(' × ')}</div>
            <div>Выходной размер: {modelState.tensorflowModel.outputShape.join(' × ')}</div>
            <div>Тип: {modelState.tensorflowModel.modelType === 'detection' ? 'Детекция' : 'Классификация'}</div>
          </div>
        </div>
      )}
    </div>
  )
} 