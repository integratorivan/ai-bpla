import { useState } from 'preact/hooks'
import type { StreamState } from '../types/ml5'

export function useStream() {
  const [streamState, setStreamState] = useState<StreamState>({
    url: '',
    isStreamMode: false,
    isFileMode: false,
    currentFile: null,
    fileName: ''
  })

  const loadStream = (videoRef: { current: HTMLVideoElement | null }) => {
    console.log('🔄 Загружаем видео:', streamState.url)
    if (!streamState.url) {
      console.error('❌ URL видео пустой')
      return false
    }
    
    setStreamState(prev => ({ 
      ...prev, 
      isStreamMode: true,
      isFileMode: false 
    }))
    
    setTimeout(() => {
      if (videoRef.current) {
        console.log('📹 Настройка video элемента для URL')
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

  const loadFile = (videoRef: { current: HTMLVideoElement | null }, file: File) => {
    console.log('🔄 Загружаем файл:', file.name)
    
    // Проверяем тип файла
    if (!file.type.startsWith('video/')) {
      console.error('❌ Выбранный файл не является видео')
      alert('Пожалуйста, выберите видеофайл (mp4, webm, mov, avi)')
      return false
    }

    const url = URL.createObjectURL(file)
    
    setStreamState(prev => ({
      ...prev,
      isStreamMode: false,
      isFileMode: true,
      currentFile: file,
      fileName: file.name,
      url: url
    }))

    setTimeout(() => {
      if (videoRef.current) {
        console.log('📹 Настройка video элемента для файла')
        videoRef.current.src = url
        
        videoRef.current.onloadstart = () => console.log('📹 Начинаем загрузку файла')
        videoRef.current.onloadedmetadata = () => {
          console.log('📹 Метаданные файла загружены')
          console.log('📹 Размеры:', videoRef.current?.videoWidth, 'x', videoRef.current?.videoHeight)
          console.log('📹 Длительность:', videoRef.current?.duration, 'сек')
        }
        videoRef.current.oncanplay = () => console.log('📹 Файл готов к воспроизведению')
        videoRef.current.onerror = (e) => console.error('❌ Ошибка загрузки файла:', e)
        
        videoRef.current.load()
        videoRef.current.play().then(() => {
          console.log('✅ Файл запущен успешно')
        }).catch(error => {
          console.error('❌ Ошибка воспроизведения файла:', error)
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
    
    // Освобождаем объект URL если это файл
    if (streamState.isFileMode && streamState.url) {
      URL.revokeObjectURL(streamState.url)
    }
    
    setStreamState(prev => ({ 
      ...prev, 
      isStreamMode: false,
      isFileMode: false,
      currentFile: null,
      fileName: '',
      url: ''
    }))
    console.log('📺 Видео остановлено')
  }

  const setUrl = (url: string) => {
    setStreamState(prev => ({ ...prev, url }))
  }

  return {
    streamState,
    loadStream,
    loadFile,
    stopStream,
    setUrl
  }
} 