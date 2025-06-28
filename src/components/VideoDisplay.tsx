import { useRef } from 'preact/hooks'

interface VideoDisplayProps {
  cameraEnabled: boolean
  isAnalyzing: boolean
  modelLoaded: boolean
  onClassifyFrame: () => void
  videoRef: { current: HTMLVideoElement | null }
  canvasRef: { current: HTMLCanvasElement | null }
}

export function VideoDisplay({ 
  cameraEnabled, 
  isAnalyzing, 
  modelLoaded, 
  onClassifyFrame,
  videoRef,
  canvasRef
}: VideoDisplayProps) {
  if (!cameraEnabled) {
    return null
  }

  return (
    <div className="video-container">
      <video
        ref={videoRef}
        width="640"
        height="480"
        autoPlay
        muted
        playsInline
        controls
      />
      
      {/* Скрытый canvas для захвата кадров */}
      <canvas
        ref={canvasRef}
        style={{ display: 'none' }}
      />
      
      {/* Ручная классификация */}
      <div className="manual-controls">
        <button 
          onClick={onClassifyFrame}
          disabled={isAnalyzing || !modelLoaded}
          className="btn-analyze"
        >
          {isAnalyzing ? '🔄 Анализируем...' : '🔍 Анализировать сейчас'}
        </button>
      </div>
    </div>
  )
} 