import { useRef, useEffect, useState } from 'preact/hooks'

// Хуки
import { useModel, useCamera, useStream, usePredictions, useAutoClassification } from './hooks'

// Компоненты
import { 
  ModelStatus, 
  StreamControls, 
  CameraControls, 
  VideoDisplay, 
  VideoWithOverlay,
  FileUpload,
  ModelSelector,
  DetectionControls,
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
  
  // Состояние для контроля детекции
  const [detectionInterval, setDetectionInterval] = useState(500)

  // Функция для анализа в зависимости от типа модели
  const handleAnalyze = async () => {
    if (model.modelState.modelType === 'coco-ssd' && model.modelState.tensorflowModel) {
      // Детекция объектов с COCO-SSD (рекомендуется)
      await predictions.detectObjectsCocoSSD(model.modelState.tensorflowModel, videoRef, canvasRef)
    } else if (model.modelState.modelType === 'yolov8' && model.modelState.tensorflowModel) {
      // Детекция объектов с YOLOv8 (новая версия)
      await predictions.detectObjectsYOLOv8(model.modelState, videoRef, canvasRef)
    } else if (model.modelState.modelType === 'yolo' && model.modelState.tensorflowModel) {
      // Детекция объектов с YOLO (экспериментально)
      await predictions.detectObjects(model.modelState.tensorflowModel, videoRef, canvasRef)
    } else {
      console.log('⚠️ Неизвестный тип модели или модель не загружена')
    }
  }

  // Автоматическая детекция объектов
  useAutoClassification(
    camera.cameraState.isActive || stream.streamState.isStreamMode || stream.streamState.isFileMode, 
    model.modelState.loaded, 
    handleAnalyze, 
    detectionInterval
  )

  return (
    <div class="webcam-classifier">
      {/* Выбор модели ИИ */}
      <div class="card">
        <ModelSelector 
          modelState={model.modelState}
          onSwitchModel={model.switchModel}
        />
      </div>

      {/* Статус модели с прогрессом загрузки */}
      <div class="card">
        <ModelStatus 
          modelState={model.modelState}
          loadingProgress={model.loadingProgress}
        />
      </div>

      {/* Настройки детекции */}
      <div class="card">
        <DetectionControls
          isAnalyzing={predictions.isAnalyzing || predictions.isClassifying}
          modelLoaded={model.modelState.loaded}
          interval={detectionInterval}
          onIntervalChange={setDetectionInterval}
          onAnalyzeNow={handleAnalyze}
        />
      </div>

      {/* Выбор источника видео */}
      <div class="card source-selector">
        <h3>📹 Источник видео</h3>
        
        {/* Элементы управления камерой */}
        <CameraControls
          cameraState={camera.cameraState}
          modelLoaded={model.modelState.loaded}
          onRequestPermission={camera.requestPermission}
          onEnableCamera={() => camera.enableCamera(videoRef)}
          onDisableCamera={camera.disableCamera}
          onSelectDevice={camera.selectDevice}
          onRefreshDevices={camera.refreshDevices}
        />

        {/* Элементы управления стримом */}
        <StreamControls
          streamState={stream.streamState}
          modelLoaded={model.modelState.loaded}
          onLoadStream={() => stream.loadStream(videoRef)}
          onStopStream={() => stream.stopStream(videoRef)}
          onUrlChange={stream.setUrl}
        />

        {/* Загрузка файлов */}
        <FileUpload 
          streamState={stream.streamState}
          modelLoaded={model.modelState.loaded}
          onFileLoad={(file) => stream.loadFile(videoRef, file)}
          onStopStream={() => stream.stopStream(videoRef)}
        />
      </div>

      {/* Видео дисплей */}
      <div class="card video-section">
        <VideoWithOverlay 
          videoRef={videoRef}
          canvasRef={canvasRef}
          cameraEnabled={camera.cameraState.isActive || stream.streamState.isStreamMode || stream.streamState.isFileMode}
          onClassifyFrame={handleAnalyze}
          isAnalyzing={predictions.isAnalyzing || predictions.isClassifying}
          modelLoaded={model.modelState.loaded}
          detections={predictions.detections}
          yolov8Detections={predictions.yolov8Detections}
          modelState={model.modelState}
        />
      </div>

      {/* Результаты анализа - только детекция объектов */}
      <div class="results-section">
        <div class="card">
          <DetectionStats 
            detections={predictions.detections}
            yolov8Detections={predictions.yolov8Detections}
            isAnalyzing={predictions.isAnalyzing || predictions.isClassifying}
            modelState={model.modelState}
          />
        </div>
      </div>

    </div>
  )
} 