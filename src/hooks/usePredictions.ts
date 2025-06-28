import { useState, useEffect } from 'preact/hooks'
import type { AnalysisState, Prediction, ModelState } from '../types/ml5'

export function usePredictions() {
  const [analysisState, setAnalysisState] = useState<AnalysisState>({
    isAnalyzing: false,
    predictions: []
  })

  const classifyFrame = async (
    classifier: any,
    videoRef: { current: HTMLVideoElement | null },
    canvasRef: { current: HTMLCanvasElement | null },
    cameraEnabled: boolean
  ) => {
    if (!classifier || !videoRef.current || !cameraEnabled) return
    
    if (videoRef.current.readyState < 2) {
      console.log('⏳ Видео еще не готово для анализа')
      return
    }
    
    setAnalysisState(prev => ({ ...prev, isAnalyzing: true }))
    
    if (canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      const video = videoRef.current
      
      canvas.width = video.videoWidth || 640
      canvas.height = video.videoHeight || 480
      
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      console.log('📸 Кадр захвачен, анализируем...')
      
      try {
        const results = await classifier.classify(canvas)
        console.log('📋 Результат (async):', results)
        
        if (results && Array.isArray(results)) {
          const formattedResults: Prediction[] = results.map((result: any) => ({
            label: result.label || result.className || 'Unknown',
            confidence: result.confidence || result.probability || 0
          }))
          
          setAnalysisState({
            isAnalyzing: false,
            predictions: formattedResults
          })
          console.log('✅ Отформатированные результаты:', formattedResults)
        } else {
          console.error('❌ Неожиданный формат результатов:', results)
          setAnalysisState(prev => ({ ...prev, isAnalyzing: false }))
        }
      } catch (error) {
        console.error('❌ Ошибка async классификации:', error)
        
        // Fallback: пробуем callback подход
        classifier.classify(canvas, (err: any, results: Prediction[]) => {
          console.log('📋 Результат (callback):', results, 'Ошибка:', err)
          
          if (results && Array.isArray(results)) {
            const formattedResults: Prediction[] = results.map((result: any) => ({
              label: result.label || result.className || 'Unknown',
              confidence: result.confidence || result.probability || 0
            }))
            
            setAnalysisState({
              isAnalyzing: false,
              predictions: formattedResults
            })
            console.log('✅ Отформатированные результаты (callback):', formattedResults)
          } else {
            setAnalysisState(prev => ({ ...prev, isAnalyzing: false }))
          }
        })
      }
    } else {
      setAnalysisState(prev => ({ ...prev, isAnalyzing: false }))
      console.error('❌ Canvas не найден')
    }
  }

  const clearPredictions = () => {
    setAnalysisState({
      isAnalyzing: false,
      predictions: []
    })
  }

  return {
    analysisState,
    classifyFrame,
    clearPredictions
  }
}

// Хук для автоматической классификации
export function useAutoClassification(
  enabled: boolean,
  modelLoaded: boolean,
  classifyFrame: () => Promise<void>,
  interval: number = 2000
) {
  useEffect(() => {
    if (!enabled || !modelLoaded) return
    
    const intervalId = setInterval(classifyFrame, interval)
    return () => clearInterval(intervalId)
  }, [enabled, modelLoaded, classifyFrame, interval])
} 