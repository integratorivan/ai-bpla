import type { StreamState } from '../types/ml5'

interface StreamControlsProps {
  streamState: StreamState
  modelLoaded: boolean
  onUrlChange: (url: string) => void
  onLoadStream: () => void
  onStopStream: () => void
}

export function StreamControls({ 
  streamState, 
  modelLoaded, 
  onUrlChange, 
  onLoadStream, 
  onStopStream 
}: StreamControlsProps) {
  const handleInputChange = (e: Event) => {
    const target = e.target as HTMLInputElement
    if (target) {
      onUrlChange(target.value)
    }
  }

  return (
    <div className="stream-controls">
      <input
        type="text"
        placeholder="Вставьте ссылку на видео (.mp4, .webm, .mov)"
        value={streamState.url}
        onChange={handleInputChange}
        className="stream-input"
      />
      <button 
        onClick={onLoadStream}
        disabled={!modelLoaded || !streamState.url}
        className="btn-primary"
      >
        📺 Загрузить видео
      </button>
      {streamState.isStreamMode && (
        <button onClick={onStopStream} className="btn-secondary">
          ⏹️ Остановить видео
        </button>
      )}
    </div>
  )
} 