import { useState } from 'preact/hooks'
import type { CameraState } from '../types/ml5'

export function useCamera() {
  const [cameraState, setCameraState] = useState<CameraState>({
    enabled: false,
    stream: null,
    permissionGranted: null
  })

  const requestPermission = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('MediaDevices API не поддерживается. Попробуйте HTTPS или другой браузер.')
      }

      const tempStream = await navigator.mediaDevices.getUserMedia({ video: true })
      tempStream.getTracks().forEach(track => track.stop())
      
      setCameraState(prev => ({ ...prev, permissionGranted: true }))
      console.log('✅ Разрешение на камеру получено')
    } catch (error) {
      setCameraState(prev => ({ ...prev, permissionGranted: false }))
      console.error('❌ Разрешение на камеру отклонено:', error)
    }
  }

  const enableCamera = async (videoRef: { current: HTMLVideoElement | null }) => {
    try {
      console.log('📹 Запрашиваем доступ к камере...')
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('MediaDevices API не поддерживается. Попробуйте HTTPS или другой браузер.')
      }
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: 640, 
          height: 480,
          facingMode: 'user'
        }
      })

      console.log('📹 MediaStream получен:', mediaStream)
      
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
        }
        
        videoRef.current.play()
        console.log('✅ Камера включена!')
      } else {
        console.error('❌ videoRef.current is null')
      }
    } catch (error) {
      console.error('❌ Ошибка доступа к камере:', error)
      alert('Не удалось получить доступ к камере. Проверьте разрешения.')
    }
  }

  const disableCamera = () => {
    if (cameraState.stream) {
      cameraState.stream.getTracks().forEach(track => track.stop())
    }
    
    setCameraState({
      enabled: false,
      stream: null,
      permissionGranted: cameraState.permissionGranted
    })
    console.log('📹 Камера отключена')
  }

  return {
    cameraState,
    requestPermission,
    enableCamera,
    disableCamera
  }
} 