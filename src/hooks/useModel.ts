import { useState, useEffect } from 'preact/hooks'
import type { ModelState } from '../types/ml5'

export function useModel() {
  const [modelState, setModelState] = useState<ModelState>({
    loaded: false,
    classifier: null
  })

  useEffect(() => {
    if (typeof ml5 !== 'undefined' && !modelState.loaded) {
      console.log('🔄 Загружаем модель MobileNet...')
      
      const newClassifier = ml5.imageClassifier('MobileNet', () => {
        console.log('✅ Модель MobileNet загружена!')
        setModelState({
          loaded: true,
          classifier: newClassifier
        })
      })
    }
  }, [modelState.loaded])

  return modelState
} 