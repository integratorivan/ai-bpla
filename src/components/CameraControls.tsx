import type { CameraState } from '../types/ml5'

interface CameraControlsProps {
  cameraState: CameraState
  modelLoaded: boolean
  onRequestPermission: () => void
  onEnableCamera: () => void
  onDisableCamera: () => void
  onSelectDevice: (deviceId: string) => void
  onRefreshDevices: () => void
}

export function CameraControls({ 
  cameraState, 
  modelLoaded, 
  onRequestPermission, 
  onEnableCamera, 
  onDisableCamera,
  onSelectDevice,
  onRefreshDevices
}: CameraControlsProps) {
  if (cameraState.permissionGranted === null) {
    return (
      <div className="camera-controls">
        <button 
          onClick={onRequestPermission}
          disabled={!modelLoaded}
          className="btn-primary"
        >
          📋 Запросить доступ к камере
        </button>
        <p className="text-sm text-gray-600 mt-2">
          💡 Если у вас iPhone рядом с Mac, включите Continuity Camera в настройках
        </p>
      </div>
    )
  }

  if (cameraState.permissionGranted === false) {
    return (
      <div className="camera-controls">
        <p>❌ Доступ к камере отклонен</p>
        <button onClick={onRequestPermission} className="btn-primary">
          🔄 Повторить запрос
        </button>
      </div>
    )
  }

  // Показываем селектор устройств если камера выключена
  if (!cameraState.enabled) {
    return (
      <div className="camera-controls">
        {/* Селектор видео устройств */}
        {cameraState.devices.length > 0 && (
          <div className="device-selector mb-4">
            <label className="block text-sm font-medium mb-2">
              📹 Выберите камеру:
            </label>
            <div className="flex gap-2 items-center">
              <select 
                value={cameraState.selectedDeviceId || ''} 
                onChange={(e) => onSelectDevice((e.target as HTMLSelectElement).value)}
                className="flex-1 p-2 border rounded"
                disabled={cameraState.isLoadingDevices}
              >
                {cameraState.devices.map(device => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.isContinuityCamera && '📱 '}
                    {device.isIPhone && !device.isContinuityCamera && '📱 '}
                    {device.label}
                    {device.isContinuityCamera && ' (Continuity Camera)'}
                    {device.isIPhone && !device.isContinuityCamera && ' (iPhone)'}
                  </option>
                ))}
              </select>
              <button 
                onClick={onRefreshDevices}
                className="btn-secondary"
                disabled={cameraState.isLoadingDevices}
                title="Обновить список устройств"
              >
                {cameraState.isLoadingDevices ? '⏳' : '🔄'}
              </button>
            </div>
            
            {/* Показываем информацию о выбранном устройстве */}
            {cameraState.selectedDeviceId && (
              <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                {(() => {
                  const selectedDevice = cameraState.devices.find(d => d.deviceId === cameraState.selectedDeviceId)
                  if (!selectedDevice) return null
                  
                  if (selectedDevice.isContinuityCamera) {
                    return (
                      <div className="text-blue-600">
                        📱 <strong>Continuity Camera обнаружена!</strong><br/>
                        Будет использована камера iPhone с оптимальным качеством (до 1080p)
                      </div>
                    )
                  }
                  
                  if (selectedDevice.isIPhone) {
                    return (
                      <div className="text-blue-600">
                        📱 <strong>iPhone камера выбрана!</strong><br/>
                        Оптимальное качество видео будет автоматически настроено
                      </div>
                    )
                  }
                  
                  return (
                    <div className="text-gray-600">
                      📹 Стандартная камера: {selectedDevice.label}
                    </div>
                  )
                })()}
              </div>
            )}
          </div>
        )}

        <button 
          onClick={onEnableCamera} 
          disabled={!modelLoaded || !cameraState.selectedDeviceId}
          className="btn-primary"
        >
          🎥 Включить камеру
          {cameraState.devices.find(d => d.deviceId === cameraState.selectedDeviceId)?.isIPhone && ' (iPhone)'}
        </button>

        {/* Инструкция для Continuity Camera */}
        {cameraState.devices.length > 0 && !cameraState.devices.some(d => d.isIPhone) && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
            <strong>💡 Как подключить iPhone камеру:</strong>
            <ol className="mt-2 ml-4 list-decimal space-y-1">
              <li>Убедитесь, что iPhone и Mac подключены к одной Apple ID</li>
              <li>Включите WiFi и Bluetooth на обоих устройствах</li>
              <li>На iPhone: Настройки → Основные → AirPlay и Handoff → Continuity Camera</li>
              <li>На Mac можете использовать iPhone как веб-камеру</li>
              <li>Нажмите 🔄 чтобы обновить список устройств</li>
            </ol>
          </div>
        )}
      </div>
    )
  }

  // Камера включена - показываем кнопку отключения
  return (
    <div className="camera-controls">
      <button 
        onClick={onDisableCamera}
        className="btn-secondary"
      >
        ⏹️ Отключить камеру
      </button>
      
      {/* Показываем информацию об активной камере */}
      {cameraState.selectedDeviceId && (
        <div className="mt-2 text-sm text-gray-600">
          {(() => {
            const activeDevice = cameraState.devices.find(d => d.deviceId === cameraState.selectedDeviceId)
            if (!activeDevice) return 'Активна: Неизвестная камера'
            
            if (activeDevice.isContinuityCamera) {
              return '📱 Активна: iPhone (Continuity Camera)'
            }
            
            if (activeDevice.isIPhone) {
              return `📱 Активна: ${activeDevice.label}`
            }
            
            return `📹 Активна: ${activeDevice.label}`
          })()}
        </div>
      )}
    </div>
  )
} 