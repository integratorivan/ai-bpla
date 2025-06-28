import { ModelStatus } from '../components'
import { useModel } from '../hooks'

// Пример простого статуса модели
export function SimpleModelStatus() {
  const { modelState } = useModel()

  return (
    <div>
      <h3>Статус модели</h3>
      <ModelStatus modelState={modelState} />
    </div>
  )
}

// Пример с кастомным классом
export function CustomModelStatus() {
  const { modelState } = useModel()

  return (
    <div>
      <h3>Кастомный статус модели</h3>
      <ModelStatus modelState={modelState} className="custom-status" />
    </div>
  )
}

// Пример детальной информации о модели
export function DetailedModelInfo() {
  const { modelState } = useModel()

  return (
    <div>
      <h3>Детальная информация о модели</h3>
      <ModelStatus modelState={modelState} />
      
      {modelState.loaded && (
        <div className="model-details">
          <p><strong>Тип модели:</strong> {modelState.modelType}</p>
          {modelState.modelInfo && (
            <>
              <p><strong>Название:</strong> {modelState.modelInfo.name}</p>
              <p><strong>Размер:</strong> {modelState.modelInfo.size}</p>
              {modelState.modelInfo.accuracy && (
                <p><strong>Точность:</strong> {modelState.modelInfo.accuracy}</p>
              )}
              {modelState.modelInfo.variant && (
                <p><strong>Вариант:</strong> {modelState.modelInfo.variant}</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

// Основной пример использования всех компонентов
export function ComponentUsageExample() {
  const { modelState } = useModel()

  return (
    <div className="component-usage-example">
      <h2>Примеры использования компонентов</h2>
      
      <div className="example-section">
        <SimpleModelStatus />
      </div>
      
      <div className="example-section">
        <CustomModelStatus />
      </div>
      
      <div className="example-section">
        <DetailedModelInfo />
      </div>
      
      <div className="example-section">
        <h3>Статус с расширенной информацией</h3>
        <ModelStatus modelState={modelState} className="enhanced-status" />
      </div>
    </div>
  )
} 