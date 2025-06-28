import { useRef } from 'preact/hooks'
import { ModelStatus, PredictionsDisplay } from '../components'
import { useModel, usePredictions } from '../hooks'
import type { Prediction } from '../types/ml5'

// Пример 1: Только статус модели
export function SimpleModelStatus() {
  const model = useModel()
  
  return (
    <div>
      <h3>Простой индикатор модели</h3>
      <ModelStatus modelLoaded={model.loaded} />
    </div>
  )
}

// Пример 2: Только отображение результатов
export function SimplePredictions() {
  const mockPredictions: Prediction[] = [
    { label: 'Cat', confidence: 0.89 },
    { label: 'Dog', confidence: 0.76 },
    { label: 'Bird', confidence: 0.43 }
  ]
  
  return (
    <div>
      <h3>Результаты распознавания</h3>
      <PredictionsDisplay predictions={mockPredictions} />
    </div>
  )
}

// Пример 3: Минимальный классификатор только с камерой
export function MinimalCameraClassifier() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  const model = useModel()
  const predictions = usePredictions()
  
  const handleClassify = async () => {
    await predictions.classifyFrame(
      model.classifier,
      videoRef,
      canvasRef,
      true // camera enabled
    )
  }
  
  return (
    <div>
      <h3>Минимальный классификатор</h3>
      <ModelStatus modelLoaded={model.loaded} />
      
      <video
        ref={videoRef}
        width="320"
        height="240"
        autoPlay
        muted
        playsInline
      />
      
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
      <button 
        onClick={handleClassify}
        disabled={!model.loaded || predictions.analysisState.isAnalyzing}
      >
        {predictions.analysisState.isAnalyzing ? 'Анализ...' : 'Анализировать'}
      </button>
      
      <PredictionsDisplay predictions={predictions.analysisState.predictions} />
    </div>
  )
} 