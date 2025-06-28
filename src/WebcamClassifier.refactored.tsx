import { useRef, useEffect } from 'preact/hooks'

// Хуки
import { useModel, useCamera, useStream, usePredictions, useAutoClassification } from './hooks'

// Компоненты
import { 
  ModelStatus, 
  StreamControls, 
  CameraControls, 
  VideoDisplay, 
  VideoWithOverlay,
  PredictionsDisplay,
  FileUpload,
  ModelSelector,
  DetectionStats
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

  // Инициализация модели при первом запуске
  useEffect(() => {
    model.initialize()
  }, [])

  // Функция для анализа в зависимости от типа модели
  const handleAnalyze = async () => {
    if (model.modelType === 'coco-ssd' && model.tensorflowModel) {
      // Детекция объектов с COCO-SSD (рекомендуется)
      await predictions.detectObjectsCocoSSD(model.tensorflowModel, videoRef, canvasRef)
    } else if (model.modelType === 'yolo' && model.tensorflowModel) {
      // Детекция объектов с YOLO (экспериментально)
      await predictions.detectObjects(model.tensorflowModel, videoRef, canvasRef)
    } else if (model.modelType === 'mobilenet' && model.classifier) {
      // Классификация с MobileNet
      await predictions.classifyFrame(model.classifier, videoRef, canvasRef)
    }
  }

  // Автоматический анализ каждые 2 секунды
  useAutoClassification(
    camera.cameraState.enabled || stream.streamState.isStreamMode || stream.streamState.isFileMode, 
    model.loaded, 
    handleAnalyze, 
    300
  )

  return (
    <div class="webcam-classifier">
      {/* Выбор модели ИИ */}
      <div class="card">
        <ModelSelector 
          modelState={model}
          onSwitchModel={model.switchModel}
          disabled={predictions.isAnalyzing}
        />
      </div>

      {/* Выбор источника видео */}
      <div class="card source-selector">
        <h3>📹 Источник видео</h3>
        
        {/* Элементы управления камерой */}
        <CameraControls
          cameraState={camera.cameraState}
          modelLoaded={model.loaded}
          onRequestPermission={camera.requestPermission}
          onEnableCamera={() => camera.enableCamera(videoRef)}
          onDisableCamera={camera.disableCamera}
          onSelectDevice={camera.selectDevice}
          onRefreshDevices={camera.refreshDevices}
        />

        {/* Элементы управления стримом */}
        <StreamControls
          streamState={stream.streamState}
          modelLoaded={model.loaded}
          onLoadStream={() => stream.loadStream(videoRef)}
          onStopStream={() => stream.stopStream(videoRef)}
          onUrlChange={stream.setUrl}
        />

        {/* Загрузка файлов */}
        <FileUpload 
          streamState={stream.streamState}
          modelLoaded={model.loaded}
          onFileLoad={(file) => stream.loadFile(videoRef, file)}
          onStopStream={() => stream.stopStream(videoRef)}
        />
      </div>

      {/* Видео дисплей */}
      <div class="card video-section">
        {/* Всегда показываем VideoWithOverlay для обеспечения наличия видео элемента */}
        <VideoWithOverlay 
          videoRef={videoRef}
          canvasRef={canvasRef}
          cameraEnabled={camera.cameraState.enabled || stream.streamState.isStreamMode || stream.streamState.isFileMode}
          onClassifyFrame={handleAnalyze}
          isAnalyzing={predictions.isAnalyzing}
          modelLoaded={model.loaded}
          detections={(model.modelType === 'yolo' || model.modelType === 'coco-ssd') ? predictions.detections : []}
        />
      </div>

      {/* Результаты анализа */}
      <div class="results-section">
        {/* Классификация (MobileNet) */}
        {model.modelType === 'mobilenet' && predictions.predictions.length > 0 && (
          <div class="card">
            <PredictionsDisplay 
              predictions={predictions.predictions}
            />
          </div>
        )}

        {/* Детекция объектов (YOLO/COCO-SSD) - только статистика */}
        {(model.modelType === 'yolo' || model.modelType === 'coco-ssd') && (
          <div class="card">
            <DetectionStats 
              detections={predictions.detections}
              isAnalyzing={predictions.isAnalyzing}
            />
          </div>
        )}
      </div>

    </div>
  )
} 