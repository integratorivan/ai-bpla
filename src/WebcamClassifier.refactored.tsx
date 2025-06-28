import { useRef } from 'preact/hooks'

// Хуки
import { useModel, useCamera, useStream, usePredictions, useAutoClassification } from './hooks'

// Компоненты
import { 
  ModelStatus, 
  StreamControls, 
  CameraControls, 
  VideoDisplay, 
  PredictionsDisplay 
} from './components'

export function WebcamClassifier() {
  // Рефы для DOM элементов
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  // Хуки для состояния
  const model = useModel()
  const camera = useCamera()
  const stream = useStream()
  const predictions = usePredictions()

  // Функция для классификации с привязкой к текущему состоянию
  const handleClassifyFrame = async () => {
    await predictions.classifyFrame(
      model.classifier,
      videoRef,
      canvasRef,
      camera.cameraState.enabled || stream.streamState.isStreamMode
    )
  }

  // Автоматическая классификация
  useAutoClassification(
    camera.cameraState.enabled || stream.streamState.isStreamMode,
    model.loaded,
    handleClassifyFrame
  )

  // Обработчики событий для камеры
  const handleEnableCamera = async () => {
    await camera.enableCamera(videoRef)
    if (stream.streamState.isStreamMode) {
      stream.stopStream(videoRef)
    }
    predictions.clearPredictions()
  }

  const handleDisableCamera = () => {
    camera.disableCamera()
    predictions.clearPredictions()
  }

  // Обработчики событий для стрима
  const handleLoadStream = () => {
    stream.loadStream(videoRef)
    if (camera.cameraState.enabled) {
      camera.disableCamera()
    }
    predictions.clearPredictions()
  }

  const handleStopStream = () => {
    stream.stopStream(videoRef)
    predictions.clearPredictions()
  }

  return (
    <div className="webcam-classifier">
      <h2>📸 Распознавание объектов через веб-камеру или стрим</h2>
      
      {/* Статус модели */}
      <ModelStatus modelLoaded={model.loaded} />

      {/* Выбор источника видео */}
      <div className="source-selector">
        <h3>Выберите источник видео:</h3>
        
        {/* Стрим URL */}
        <StreamControls
          streamState={stream.streamState}
          modelLoaded={model.loaded}
          onUrlChange={stream.setUrl}
          onLoadStream={handleLoadStream}
          onStopStream={handleStopStream}
        />
        
        <div className="separator">или</div>
      </div>

      {/* Управление камерой */}
      <div className="camera-controls">
        <CameraControls
          cameraState={camera.cameraState}
          modelLoaded={model.loaded}
          onRequestPermission={camera.requestPermission}
          onEnableCamera={handleEnableCamera}
          onDisableCamera={handleDisableCamera}
        />
      </div>

      {/* Видео с камеры */}
      <VideoDisplay
        cameraEnabled={camera.cameraState.enabled || stream.streamState.isStreamMode}
        isAnalyzing={predictions.analysisState.isAnalyzing}
        modelLoaded={model.loaded}
        onClassifyFrame={handleClassifyFrame}
        videoRef={videoRef}
        canvasRef={canvasRef}
      />

      {/* Результаты классификации */}
      <PredictionsDisplay predictions={predictions.analysisState.predictions} />
    </div>
  )
} 