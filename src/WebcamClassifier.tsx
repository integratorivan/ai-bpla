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

  // Функция для получения доступа к камере
  const enableCamera = async () => {
    try {
      console.log('📹 Запрашиваем доступ к камере...')
      
      // navigator.mediaDevices.getUserMedia - стандартный веб API для доступа к камере
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: 640, 
          height: 480,
          facingMode: 'user' // 'user' = фронтальная камера, 'environment' = задняя
        }
      })
      
      setStream(mediaStream)
      
      // Подключаем поток к video элементу
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        videoRef.current.play()
        setCameraEnabled(true)
        console.log('✅ Камера включена!')
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
  const classifyFrame = () => {
    if (!classifier || !videoRef.current || !cameraEnabled) return
    
    setIsAnalyzing(true)
    
    // ml5.js анализирует video элемент напрямую
    classifier.classify(videoRef.current, (error: any, results: Prediction[]) => {
      setIsAnalyzing(false)
      
      if (error) {
        console.error('❌ Ошибка классификации:', error)
        return
      }
      
      // results - массив объектов с label и confidence
      console.log('🔍 Результаты классификации:', results)
      setPredictions(results)
    })
  }

  // Автоматическая классификация каждые 2 секунды
  useEffect(() => {
    if (!cameraEnabled || !modelLoaded) return
    
    const interval = setInterval(() => {
      classifyFrame()
    }, 2000) // Анализируем каждые 2 секунды
    
    return () => clearInterval(interval)
  }, [cameraEnabled, modelLoaded, classifier])

  return (
    <div className="webcam-classifier">
      <h2>📸 Распознавание объектов через веб-камеру</h2>
      
      {/* Статус модели */}
      <div className="status">
        {!modelLoaded && <p>⏳ Загружаем модель MobileNet...</p>}
        {modelLoaded && <p>✅ Модель готова к работе</p>}
      </div>

      {/* Управление камерой */}
      <div className="camera-controls">
        {!cameraEnabled ? (
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