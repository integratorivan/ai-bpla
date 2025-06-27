import { useState, useEffect, useRef } from 'preact/hooks'

interface Prediction {
  label: string
  confidence: number
}

export function WebcamClassifier() {
  // Состояние компонента
  const [cameraEnabled, setCameraEnabled] = useState(false)
  const [modelLoaded, setModelLoaded] = useState(false)
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  
  // Рефы для DOM элементов
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  // Переменные для ml5.js
  const [classifier, setClassifier] = useState<any>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null)
  const [streamUrl, setStreamUrl] = useState('')
  const [isStreamMode, setIsStreamMode] = useState(false)
  
  // Загрузка модели MobileNet
  useEffect(() => {
    if (typeof ml5 !== 'undefined' && !modelLoaded) {
      console.log('🔄 Загружаем модель MobileNet...')
      
      // ml5.imageClassifier создаёт классификатор изображений
      const newClassifier = ml5.imageClassifier('MobileNet', () => {
        console.log('✅ Модель MobileNet загружена!')
        setModelLoaded(true)
        setClassifier(newClassifier)
      })
    }
  }, [modelLoaded])

  // Функция для запроса разрешения на камеру
  const requestCameraPermission = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('MediaDevices API не поддерживается. Попробуйте HTTPS или другой браузер.')
      }

      const tempStream = await navigator.mediaDevices.getUserMedia({ video: true })
      tempStream.getTracks().forEach(track => track.stop()) // Сразу останавливаем
      setPermissionGranted(true)
      console.log('✅ Разрешение на камеру получено')
    } catch (error) {
      setPermissionGranted(false)
      console.error('❌ Разрешение на камеру отклонено:', error)
    }
  }

  // Функция для получения доступа к камере
  const enableCamera = async () => {
    try {
      console.log('📹 Запрашиваем доступ к камере...')
      
      // Проверяем поддержку MediaDevices API
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('MediaDevices API не поддерживается. Попробуйте HTTPS или другой браузер.')
      }
      
      // navigator.mediaDevices.getUserMedia - стандартный веб API для доступа к камере
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: 640, 
          height: 480,
          facingMode: 'user' // 'user' = фронтальная камера, 'environment' = задняя
        }
      })

      console.log('📹 MediaStream получен:', mediaStream)
      console.log('📹 Video tracks:', mediaStream.getVideoTracks())
      
      setStream(mediaStream)
      
      // Подключаем поток к video элементу
      if (videoRef.current) {
        console.log('📹 Подключаем поток к video элементу')
        videoRef.current.srcObject = mediaStream
        
        // Ждем загрузки метаданных
        videoRef.current.onloadedmetadata = () => {
          console.log('📹 Метаданные видео загружены')
          console.log('📹 Размеры видео:', videoRef.current?.videoWidth, 'x', videoRef.current?.videoHeight)
        }
        
        videoRef.current.play()
        setCameraEnabled(true)
        console.log('✅ Камера включена!')
      } else {
        console.error('❌ videoRef.current is null')
      }
    } catch (error) {
      console.error('❌ Ошибка доступа к камере:', error)
      alert('Не удалось получить доступ к камере. Проверьте разрешения.')
    }
  }

  // Функция для отключения камеры
  const disableCamera = () => {
    if (stream) {
      // Останавливаем все треки (видео/аудио)
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    
    setCameraEnabled(false)
    setIsAnalyzing(false)
    setPredictions([])
    console.log('📹 Камера отключена')
  }

  // Функция для классификации текущего кадра
  const classifyFrame = async () => {
    if (!classifier || !videoRef.current || !cameraEnabled) return
    
    // Проверяем, что видео готово
    if (videoRef.current.readyState < 2) {
      console.log('⏳ Видео еще не готово для анализа')
      return
    }
    
    setIsAnalyzing(true)
    
    // Захватываем кадр из видео в canvas
    if (canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      const video = videoRef.current
      
      // Устанавливаем размеры canvas по размеру видео
      canvas.width = video.videoWidth || 640
      canvas.height = video.videoHeight || 480
      
      // Рисуем текущий кадр видео на canvas
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      console.log('📸 Кадр захвачен, анализируем...')
      
      try {
        // Пробуем async/await подход
        const results = await classifier.classify(canvas)
        setIsAnalyzing(false)
        console.log('📋 Результат (async):', results)
        
        if (results && Array.isArray(results)) {
          const formattedResults = results.map((result: any) => ({
            label: result.label || result.className || 'Unknown',
            confidence: result.confidence || result.probability || 0
          }))
          setPredictions(formattedResults)
          console.log('✅ Отформатированные результаты:', formattedResults)
        } else {
          console.error('❌ Неожиданный формат результатов:', results)
        }
      } catch (error) {
        setIsAnalyzing(false)
        console.error('❌ Ошибка async классификации:', error)
        
        // Fallback: пробуем callback подход
        classifier.classify(canvas, (err: any, results: Prediction[]) => {
          console.log('📋 Результат (callback):', results, 'Ошибка:', err)
          
          if (results && Array.isArray(results)) {
            const formattedResults = results.map((result: any) => ({
              label: result.label || result.className || 'Unknown',
              confidence: result.confidence || result.probability || 0
            }))
            setPredictions(formattedResults)
            console.log('✅ Отформатированные результаты (callback):', formattedResults)
          }
        })
      }
    } else {
      setIsAnalyzing(false)
      console.error('❌ Canvas не найден')
    }
  }

  // Автоматическая классификация каждые 2 секунды
  useEffect(() => {
    if (!cameraEnabled || !modelLoaded) return
    
    const interval = setInterval(() => {
      classifyFrame()
    }, 2000) // Анализируем каждые 2 секунды
    
    return () => clearInterval(interval)
  }, [cameraEnabled, modelLoaded, classifier])

  // Функция для загрузки видео
  const loadStream = () => {
    console.log('🔄 Загружаем видео:', streamUrl)
    if (!streamUrl) {
      console.error('❌ URL видео пустой')
      return
    }
    
    // Сначала показываем контейнер видео
    setCameraEnabled(true)
    setIsStreamMode(true)
    
    // Даем время на рендер, затем настраиваем видео
    setTimeout(() => {
      if (videoRef.current) {
      console.log('📹 Настройка video элемента')
      videoRef.current.src = streamUrl
      videoRef.current.crossOrigin = 'anonymous'
      
      // Добавляем обработчики событий
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
  }


  // Функция для остановки стрима
  const stopStream = () => {
    if (videoRef.current) {
      videoRef.current.src = ''
      videoRef.current.srcObject = null
    }
    setCameraEnabled(false)
    setIsStreamMode(false)
    console.log('📺 Видео остановлено')
  }

  return (
    <div className="webcam-classifier">
      <h2>📸 Распознавание объектов через веб-камеру или стрим</h2>
      
      {/* Статус модели */}
      <div className="status">
        {!modelLoaded && <p>⏳ Загружаем модель MobileNet...</p>}
        {modelLoaded && <p>✅ Модель готова к работе</p>}
      </div>

      {/* Выбор источника видео */}
      <div className="source-selector">
        <h3>Выберите источник видео:</h3>
        
        {/* Стрим URL */}
        <div className="stream-controls">
          <input
            type="text"
            placeholder="Вставьте ссылку на видео (.mp4, .webm, .mov)"
            value={streamUrl}
            onChange={(e) => setStreamUrl(e.target.value)}
            className="stream-input"
          />
          <button 
            onClick={loadStream}
            disabled={!modelLoaded || !streamUrl}
            className="btn-primary"
          >
            📺 Загрузить видео
          </button>
          {isStreamMode && (
            <button onClick={stopStream} className="btn-secondary">
              ⏹️ Остановить видео
            </button>
          )}
        </div>
        
        <div className="separator">или</div>
      </div>

      {/* Управление камерой */}
      <div className="camera-controls">
        {permissionGranted === null ? (
          <button 
            onClick={requestCameraPermission}
            disabled={!modelLoaded}
            className="btn-primary"
          >
            📋 Запросить доступ к камере
          </button>
        ) : permissionGranted === false ? (
          <div>
            <p>❌ Доступ к камере отклонен</p>
            <button onClick={requestCameraPermission} className="btn-primary">
              🔄 Повторить запрос
            </button>
          </div>
        ) : !cameraEnabled ? (
          <button 
            onClick={enableCamera} 
            disabled={!modelLoaded}
            className="btn-primary"
          >
            🎥 Включить камеру
          </button>
        ) : (
          <button 
            onClick={disableCamera}
            className="btn-secondary"
          >
            ⏹️ Отключить камеру
          </button>
        )}
      </div>

      {/* Видео с камеры */}
      {cameraEnabled && (
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
              onClick={classifyFrame}
              disabled={isAnalyzing || !modelLoaded}
              className="btn-analyze"
            >
              {isAnalyzing ? '🔄 Анализируем...' : '🔍 Анализировать сейчас'}
            </button>
          </div>
        </div>
      )}

      {/* Результаты классификации */}
      {predictions.length > 0 && (
        <div className="predictions">
          <h3>🎯 Что видит ИИ:</h3>
          <div className="predictions-list">
            {predictions.slice(0, 3).map((prediction, index) => (
              <div key={index} className="prediction-item">
                <span className="label">{prediction.label}</span>
                <span className="confidence">
                  {Math.round(prediction.confidence * 100)}%
                </span>
                <div className="confidence-bar">
                  <div 
                    className="confidence-fill"
                    style={{ width: `${prediction.confidence * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}