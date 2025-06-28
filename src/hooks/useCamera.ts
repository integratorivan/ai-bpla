import { useState, useEffect } from 'preact/hooks'
import type { CameraState, VideoDevice } from '../types/ml5'

// Функция для определения iPhone камеры по названию устройства
function detectIPhoneCamera(label: string): { isIPhone: boolean; isContinuityCamera: boolean } {
  const labelLower = label.toLowerCase()
  
  // Паттерны для определения iPhone камеры
  const iphonePatterns = [
    'iphone',
    'continuity camera',
    'continuity',
    'айфон',
    'iphone camera',
    'ios camera'
  ]
  
  const isIPhone = iphonePatterns.some(pattern => labelLower.includes(pattern))
  const isContinuityCamera = labelLower.includes('continuity') || (isIPhone && labelLower.includes('camera'))
  
  return { isIPhone, isContinuityCamera }
}

export function useCamera() {
  const [cameraState, setCameraState] = useState<CameraState>({
    enabled: false,
    stream: null,
    permissionGranted: null,
    devices: [],
    selectedDeviceId: null,
    isLoadingDevices: false
  })

  // Загрузка доступных видео устройств
  const loadVideoDevices = async (): Promise<VideoDevice[]> => {
    try {
      setCameraState(prev => ({ ...prev, isLoadingDevices: true }))
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        throw new Error('MediaDevices API не поддерживается')
      }

      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices
        .filter(device => device.kind === 'videoinput')
        .map(device => {
          const { isIPhone, isContinuityCamera } = detectIPhoneCamera(device.label || 'Неизвестная камера')
          
          return {
            deviceId: device.deviceId,
            groupId: device.groupId,
            kind: device.kind,
            label: device.label || `Камера ${device.deviceId.substring(0, 8)}`,
            isIPhone,
            isContinuityCamera
          } as VideoDevice
        })

      console.log('📹 Найденные видео устройства:', videoDevices)
      
      // Приоритизируем iPhone камеру
      const sortedDevices = videoDevices.sort((a, b) => {
        if (a.isContinuityCamera && !b.isContinuityCamera) return -1
        if (!a.isContinuityCamera && b.isContinuityCamera) return 1
        if (a.isIPhone && !b.isIPhone) return -1
        if (!a.isIPhone && b.isIPhone) return 1
        return 0
      })

      setCameraState(prev => ({ 
        ...prev, 
        devices: sortedDevices,
        isLoadingDevices: false,
        // Автоматически выбираем iPhone камеру если доступна
        selectedDeviceId: prev.selectedDeviceId || 
          (sortedDevices.find(d => d.isContinuityCamera)?.deviceId) ||
          (sortedDevices.find(d => d.isIPhone)?.deviceId) ||
          sortedDevices[0]?.deviceId || null
      }))

      return sortedDevices
    } catch (error) {
      console.error('❌ Ошибка загрузки видео устройств:', error)
      setCameraState(prev => ({ ...prev, isLoadingDevices: false }))
      return []
    }
  }

  // Автоматическая загрузка устройств при изменении разрешений
  useEffect(() => {
    if (cameraState.permissionGranted === true && cameraState.devices.length === 0) {
      loadVideoDevices()
    }
  }, [cameraState.permissionGranted])

  const requestPermission = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('MediaDevices API не поддерживается. Попробуйте HTTPS или другой браузер.')
      }

      // Запрашиваем разрешение на доступ к камере
      const tempStream = await navigator.mediaDevices.getUserMedia({ video: true })
      tempStream.getTracks().forEach(track => track.stop())
      
      setCameraState(prev => ({ ...prev, permissionGranted: true }))
      console.log('✅ Разрешение на камеру получено')
      
      // Загружаем список устройств после получения разрешения
      await loadVideoDevices()
    } catch (error) {
      setCameraState(prev => ({ ...prev, permissionGranted: false }))
      console.error('❌ Разрешение на камеру отклонено:', error)
    }
  }

  const selectDevice = (deviceId: string) => {
    setCameraState(prev => ({ ...prev, selectedDeviceId: deviceId }))
    console.log('📹 Выбрано устройство:', deviceId)
  }

  const enableCamera = async (videoRef: { current: HTMLVideoElement | null }) => {
    try {
      console.log('📹 Запрашиваем доступ к камере...')
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('MediaDevices API не поддерживается. Попробуйте HTTPS или другой браузер.')
      }

      // Определяем настройки для камеры
      const selectedDevice = cameraState.devices.find(d => d.deviceId === cameraState.selectedDeviceId)
      console.log('📹 Выбранное устройство:', selectedDevice)

      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: cameraState.selectedDeviceId ? { exact: cameraState.selectedDeviceId } : undefined,
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          frameRate: { ideal: 30, min: 15 }
        }
      }

      // Для iPhone камеры используем оптимальные настройки
      if (selectedDevice?.isIPhone) {
        console.log('📱 Настраиваем параметры для iPhone камеры')
        const videoConstraints = constraints.video as MediaTrackConstraints
        constraints.video = {
          ...videoConstraints,
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 },
          frameRate: { ideal: 60, min: 30 },
          facingMode: 'user' // Для фронтальной камеры iPhone
        }
      }
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)

      console.log('📹 MediaStream получен:', mediaStream)
      
      // Выводим информацию о треке
      const videoTrack = mediaStream.getVideoTracks()[0]
      if (videoTrack) {
        const settings = videoTrack.getSettings()
        console.log('📹 Настройки видео трека:', settings)
        if (selectedDevice?.isIPhone) {
          console.log('📱 iPhone камера активна!', settings)
        }
      }
      
      setCameraState(prev => ({ 
        ...prev, 
        stream: mediaStream,
        enabled: true 
      }))
      
      if (videoRef.current) {
        console.log('📹 Подключаем поток к video элементу')
        videoRef.current.srcObject = mediaStream
        
        videoRef.current.onloadedmetadata = () => {
          console.log('📹 Метаданные видео загружены')
          console.log('📹 Размеры видео:', videoRef.current?.videoWidth, 'x', videoRef.current?.videoHeight)
          
          if (selectedDevice?.isIPhone) {
            console.log('📱 iPhone камера готова к работе!')
          }
        }
        
        // Добавляем обработчики событий для диагностики
        videoRef.current.oncanplay = () => console.log('📹 Видео готово к воспроизведению')
        videoRef.current.onplaying = () => console.log('📹 Видео начало воспроизведение')
        videoRef.current.onerror = (e) => console.error('❌ Ошибка видео элемента:', e)
        
        try {
          await videoRef.current.play()
          console.log('✅ Камера включена и видео воспроизводится!')
        } catch (playError) {
          console.error('❌ Ошибка воспроизведения видео:', playError)
        }
      } else {
        console.error('❌ videoRef.current is null - видео элемент не найден')
        console.log('💡 Попробуйте включить камеру после загрузки страницы')
        
        // Попробуем подождать и повторить попытку
        setTimeout(() => {
          if (videoRef.current) {
            console.log('📹 Повторная попытка подключения видео')
            videoRef.current.srcObject = mediaStream
            videoRef.current.play().catch(e => console.error('❌ Повторная ошибка воспроизведения:', e))
          }
        }, 100)
      }
    } catch (error) {
      console.error('❌ Ошибка доступа к камере:', error)
      
      let errorMessage = 'Не удалось получить доступ к камере.'
      if (error instanceof Error) {
        if (error.name === 'NotFoundError') {
          errorMessage = 'Камера не найдена. Убедитесь, что устройство подключено.'
        } else if (error.name === 'NotAllowedError') {
          errorMessage = 'Доступ к камере запрещен. Проверьте разрешения в браузере.'
        } else if (error.name === 'NotReadableError') {
          errorMessage = 'Камера используется другим приложением.'
        }
      }
      
      alert(errorMessage)
    }
  }

  const disableCamera = () => {
    if (cameraState.stream) {
      cameraState.stream.getTracks().forEach(track => track.stop())
    }
    
    setCameraState(prev => ({
      ...prev,
      enabled: false,
      stream: null
    }))
    console.log('📹 Камера отключена')
  }

  const refreshDevices = async () => {
    await loadVideoDevices()
  }

  return {
    cameraState,
    requestPermission,
    enableCamera,
    disableCamera,
    selectDevice,
    refreshDevices,
    loadVideoDevices
  }
} 