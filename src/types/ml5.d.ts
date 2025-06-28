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

export interface Prediction {
  label: string
  confidence: number
}

export interface CameraState {
  enabled: boolean
  stream: MediaStream | null
  permissionGranted: boolean | null
}

export interface ModelState {
  loaded: boolean
  classifier: any
}

export interface StreamState {
  url: string
  isStreamMode: boolean
}

export interface AnalysisState {
  isAnalyzing: boolean
  predictions: Prediction[]
} 