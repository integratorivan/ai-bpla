import type { CameraState } from '../types/ml5'

interface CameraControlsProps {
  cameraState: CameraState
  modelLoaded: boolean
  onRequestPermission: () => void
  onEnableCamera: () => void
  onDisableCamera: () => void
}

export function CameraControls({ 
  cameraState, 
  modelLoaded, 
  onRequestPermission, 
  onEnableCamera, 
  onDisableCamera 
}: CameraControlsProps) {
  if (cameraState.permissionGranted === null) {
    return (
      <button 
        onClick={onRequestPermission}
        disabled={!modelLoaded}
        className="btn-primary"
      >
        📋 Запросить доступ к камере
      </button>
    )
  }

  if (cameraState.permissionGranted === false) {
    return (
      <div>
        <p>❌ Доступ к камере отклонен</p>
        <button onClick={onRequestPermission} className="btn-primary">
          🔄 Повторить запрос
        </button>
      </div>
    )
  }

  if (!cameraState.enabled) {
    return (
      <button 
        onClick={onEnableCamera} 
        disabled={!modelLoaded}
        className="btn-primary"
      >
        🎥 Включить камеру
      </button>
    )
  }

  return (
    <button 
      onClick={onDisableCamera}
      className="btn-secondary"
    >
      ⏹️ Отключить камеру
    </button>
  )
} 