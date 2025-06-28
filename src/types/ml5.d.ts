// Типы для ml5.js
declare global {
  const ml5: {
    imageClassifier: (
      modelName: string,
      callback?: () => void
    ) => {
      classify: (
        input: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement,
        callback?: (error: any, results: any[]) => void
      ) => Promise<any[]>
    }
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
  enabled: boolean
  stream: MediaStream | null
  permissionGranted: boolean | null
  devices: VideoDevice[]
  selectedDeviceId: string | null
  isLoadingDevices: boolean
}

export interface ModelState {
  loaded: boolean
  classifier: any
  tensorflowModel?: TensorFlowModel
  modelType: 'mobilenet' | 'yolo' | 'coco-ssd'
}

export interface StreamState {
  url: string
  isStreamMode: boolean
  isFileMode: boolean
  currentFile: File | null
  fileName: string
}

export interface AnalysisState {
  isAnalyzing: boolean
  predictions: Prediction[]
  detections: Detection[]
}

export interface DragState {
  isDragOver: boolean
  isDragActive: boolean
} 