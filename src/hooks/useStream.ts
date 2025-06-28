import { useState } from 'preact/hooks'
import type { StreamState } from '../types/ml5'

export function useStream() {
  const [streamState, setStreamState] = useState<StreamState>({
    url: '',
    isStreamMode: false
  })

  const loadStream = (videoRef: { current: HTMLVideoElement | null }) => {
    console.log('🔄 Загружаем видео:', streamState.url)
    if (!streamState.url) {
      console.error('❌ URL видео пустой')
      return false
    }
    
    setStreamState(prev => ({ ...prev, isStreamMode: true }))
    
    setTimeout(() => {
      if (videoRef.current) {
        console.log('📹 Настройка video элемента')
        videoRef.current.src = streamState.url
        videoRef.current.crossOrigin = 'anonymous'
        
        videoRef.current.onloadstart = () => console.log('📹 Начинаем загрузку видео')
        videoRef.current.onloadedmetadata = () => {
          console.log('📹 Метаданные загружены')
          console.log('📹 Размеры:', videoRef.current?.videoWidth, 'x', videoRef.current?.videoHeight)
        }
        videoRef.current.oncanplay = () => console.log('📹 Видео готово к воспроизведению')
        videoRef.current.onerror = (e) => console.error('❌ Ошибка загрузки видео:', e)
        
        videoRef.current.load()
        videoRef.current.play().then(() => {
          console.log('✅ Видео запущено успешно')
        }).catch(error => {
          console.error('❌ Ошибка воспроизведения:', error)
        })
      } else {
        console.error('❌ videoRef.current is null после таймаута')
      }
    }, 100)
    
    return true
  }

  const stopStream = (videoRef: { current: HTMLVideoElement | null }) => {
    if (videoRef.current) {
      videoRef.current.src = ''
      videoRef.current.srcObject = null
    }
    setStreamState(prev => ({ ...prev, isStreamMode: false }))
    console.log('📺 Видео остановлено')
  }

  const setUrl = (url: string) => {
    setStreamState(prev => ({ ...prev, url }))
  }

  return {
    streamState,
    loadStream,
    stopStream,
    setUrl
  }
} 