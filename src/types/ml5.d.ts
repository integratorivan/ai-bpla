// Типы для ml5.js
declare global {
  interface Window {
    ml5: any
  }
}

// Типы для TensorFlow.js
export interface TensorFlowModel {
  net: any
  inputShape: number[]
  outputShape: number[]
  modelType: 'classification' | 'detection'
}

export interface Detection {
  bbox: [number, number, number, number] // [x, y, width, height]
  class: string
  classId: number
  confidence: number
}

export interface Prediction {
  label: string
  confidence: number
}

// YOLOv8 специфичные типы
export interface YOLOv8Detection {
  bbox: [number, number, number, number] // [x, y, width, height]
  class: string
  classId: number
  confidence: number
  // Дополнительные поля специфичные для YOLOv8
  area?: number
  normalized?: boolean
}

export interface YOLOv8Config {
  modelUrl: string
  confThreshold: number
  iouThreshold: number
  inputSize: number
  maxDetections: number
  modelVariant: 'yolov8n' | 'yolov8s' | 'yolov8m' | 'yolov8l' | 'yolov8x'
}

// Новые типы для устройств захвата видео
export interface VideoDevice {
  deviceId: string
  groupId: string
  kind: MediaDeviceKind
  label: string
  isIPhone: boolean
  isContinuityCamera: boolean
}

export interface CameraState {
  stream: MediaStream | null
  isActive: boolean
  devices: MediaDeviceInfo[]
  selectedDevice: string | null
  error: string | null
}

export interface ModelState {
  loaded: boolean
  classifier?: any
  tensorflowModel?: any
  modelType: 'yolo' | 'coco-ssd' | 'yolov8'
  // Добавляем конфигурацию для YOLOv8
  yolov8Config?: YOLOv8Config
  // Добавляем информацию о загруженной модели
  modelInfo?: {
    name: string
    variant?: string
    size?: string
    accuracy?: string
  }
}

export interface StreamState {
  url: string
  isStreamMode: boolean
  isFileMode: boolean
  currentFile: File | null
  fileName: string
}

export interface PredictionState {
  predictions: Prediction[]
  detections: Detection[]
  // Добавляем YOLOv8 детекции
  yolov8Detections: YOLOv8Detection[]
  isClassifying: boolean
  isAnalyzing: boolean
  lastClassified: Date | null
}

export interface DragState {
  isDragOver: boolean
  isDragActive: boolean
} 