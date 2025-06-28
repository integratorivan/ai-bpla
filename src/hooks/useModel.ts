import { useState, useCallback, useEffect } from 'preact/hooks'
import type { ModelState } from '../types/ml5'
import * as tf from '@tensorflow/tfjs'
import * as cocoSsd from '@tensorflow-models/coco-ssd'
import { loadYOLOv8Model, createYOLOv8Config } from '../utils/yolov8'
import { YOLOV8_MODELS } from '../constants'

export function useModel() {
  const [modelState, setModelState] = useState<ModelState>({
    loaded: false,
    modelType: 'coco-ssd' // По умолчанию используем COCO-SSD
  })

  const [loadingProgress, setLoadingProgress] = useState(0)

  // Инициализация TensorFlow.js
  const initializeTensorFlow = useCallback(async () => {
    try {
      // Ждем готовности TensorFlow
      await tf.ready()
      console.log('✅ TensorFlow.js инициализирован')
      console.log('Backend:', tf.getBackend())
    } catch (error) {
      console.error('❌ Ошибка инициализации TensorFlow.js:', error)
      // Fallback на CPU backend
      try {
        await tf.setBackend('cpu')
        await tf.ready()
        console.log('✅ TensorFlow.js инициализирован с CPU backend')
      } catch (fallbackError) {
        console.error('❌ Критическая ошибка инициализации TensorFlow.js:', fallbackError)
      }
    }
  }, [])

  // Загрузка YOLOv8 модели
  const loadYOLOv8 = useCallback(async (variant: keyof typeof YOLOV8_MODELS = 'yolov8s') => {
    try {
      console.log(`🔄 Загружаем модель YOLOv8 ${variant}...`)
      
      setModelState(prev => ({ 
        ...prev, 
        loaded: false,
        modelType: 'yolov8'
      }))
      setLoadingProgress(0)
      
      // Инициализируем TensorFlow.js перед загрузкой модели
      await initializeTensorFlow()
      
      // Загружаем YOLOv8 модель с отслеживанием прогресса
      const model = await loadYOLOv8Model(variant, (progress) => {
        setLoadingProgress(progress)
      })
      
      if (!model) {
        throw new Error('Не удалось загрузить YOLOv8 модель')
      }

      // Создаем конфигурацию для YOLOv8
      const config = createYOLOv8Config(variant)
      const modelInfo = YOLOV8_MODELS[variant]
      
      setModelState({
        loaded: true,
        tensorflowModel: model,
        modelType: 'yolov8',
        yolov8Config: config,
        modelInfo: {
          name: modelInfo.name,
          variant: variant,
          size: modelInfo.size,
          accuracy: modelInfo.accuracy
        }
      })
      setLoadingProgress(1)
      
      console.log(`✅ Модель YOLOv8 ${variant} загружена!`)
    } catch (error) {
      console.error('❌ Ошибка загрузки YOLOv8:', error)
      setModelState(prev => ({ 
        ...prev, 
        loaded: false,
        modelType: 'yolov8'
      }))
      setLoadingProgress(0)
    }
  }, [initializeTensorFlow])

  // Загрузка COCO-SSD модели
  const loadCocoSSD = useCallback(async () => {
    try {
      console.log('🔄 Загружаем модель COCO-SSD...')
      
      setModelState(prev => ({ 
        ...prev, 
        loaded: false,
        modelType: 'coco-ssd'
      }))
      setLoadingProgress(0)
      
      // Инициализируем TensorFlow.js перед загрузкой модели
      await initializeTensorFlow()
      
      // Загружаем COCO-SSD модель
      const model = await cocoSsd.load()
      
      setModelState({
        loaded: true,
        tensorflowModel: model,
        modelType: 'coco-ssd',
        modelInfo: {
          name: 'COCO-SSD',
          size: '~27 MB',
          accuracy: 'Высокая'
        }
      })
      setLoadingProgress(1)
      
      console.log('✅ Модель COCO-SSD загружена!')
    } catch (error) {
      console.error('❌ Ошибка загрузки COCO-SSD:', error)
      setModelState(prev => ({ ...prev, loaded: false }))
      setLoadingProgress(0)
    }
  }, [initializeTensorFlow])

  // Переключение модели
  const switchModel = useCallback((
    modelType: 'coco-ssd' | 'yolov8', 
    modelUrl?: string,
    yolov8Variant?: keyof typeof YOLOV8_MODELS
  ) => {
    setModelState(prev => ({ ...prev, loaded: false }))
    setLoadingProgress(0)
    
    if (modelType === 'coco-ssd') {
      console.log('🔄 Переключаемся на COCO-SSD...')
      loadCocoSSD()
    } else if (modelType === 'yolov8') {
      console.log(`🔄 Переключаемся на YOLOv8 ${yolov8Variant || 'yolov8s'}...`)
      loadYOLOv8(yolov8Variant || 'yolov8s')
    }
  }, [loadCocoSSD, loadYOLOv8])

  // По умолчанию загружаем COCO-SSD при первом использовании
  useEffect(() => {
    if (!modelState.loaded && !modelState.tensorflowModel) {
      loadCocoSSD()
    }
  }, [modelState.loaded, modelState.tensorflowModel, loadCocoSSD])

  return {
    modelState,
    loadingProgress,
    loadYOLOv8,
    loadCocoSSD,
    switchModel
  }
} 