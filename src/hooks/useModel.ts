import { useState, useCallback } from 'preact/hooks'
import type { ModelState, TensorFlowModel } from '../types/ml5'
import * as tf from '@tensorflow/tfjs'
import * as cocoSsd from '@tensorflow-models/coco-ssd'

export function useModel() {
  const [modelState, setModelState] = useState<ModelState>({
    loaded: false,
    classifier: null,
    tensorflowModel: undefined,
    modelType: 'mobilenet'
  })

  const loadMobileNet = useCallback(async () => {
    try {
      console.log('🔄 Загружаем модель MobileNet...')
      
      const newClassifier = ml5.imageClassifier('MobileNet', () => {
        console.log('✅ Модель MobileNet загружена!')
        setModelState(prev => ({ 
          ...prev, 
          loaded: true, 
          classifier: newClassifier,
          modelType: 'mobilenet'
        }))
      })
    } catch (error) {
      console.error('❌ Ошибка загрузки MobileNet:', error)
    }
  }, [])

  const loadCocoSSD = useCallback(async () => {
    try {
      console.log('🔄 Загружаем COCO-SSD модель...')
      
      // Загружаем официальную COCO-SSD модель
      const model = await cocoSsd.load({
        base: 'mobilenet_v2' // Можно также использовать 'lite_mobilenet_v2' для большей скорости
      })

      console.log('✅ COCO-SSD модель успешно загружена!')

      // Создаем TensorFlowModel объект для совместимости
      const tensorflowModel: TensorFlowModel = {
        net: model,
        inputShape: [1, 224, 224, 3], // COCO-SSD принимает изображения любого размера
        outputShape: [1, 100, 6], // Примерный формат: [batch, max_detections, [x, y, width, height, class, score]]
        modelType: 'detection'
      }

      setModelState(prev => ({
        ...prev,
        loaded: true,
        classifier: null, // Для детекции не используем ml5.js classifier
        tensorflowModel,
        modelType: 'coco-ssd'
      }))

    } catch (error) {
      console.error('❌ Ошибка загрузки COCO-SSD модели:', error)
      console.log('🔄 Переключаемся на MobileNet...')
      loadMobileNet()
    }
  }, [loadMobileNet])

  const loadYOLO = useCallback(async (modelUrl?: string) => {
    try {
      console.log('🔄 Загружаем YOLO модель...')
      
      // Попробуем несколько рабочих URL
      const fallbackUrls = [
        modelUrl, // Пользовательская модель
        '/models/yolo/model.json', // Локальная модель
        'https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json', // Пример рабочей модели
      ].filter(Boolean)

      let model = null
      let workingUrl = null

      for (const url of fallbackUrls) {
        try {
          console.log(`🔄 Пробуем загрузить: ${url}`)
          model = await tf.loadLayersModel(url!)
          workingUrl = url
          break
        } catch (urlError) {
          console.log(`❌ Не удалось загрузить ${url}:`, urlError)
          continue
        }
      }

      if (!model) {
        throw new Error('Не удалось загрузить ни одну YOLO модель')
      }

      console.log(`✅ YOLO модель загружена из: ${workingUrl}`)
      
      // Получаем информацию о входных и выходных слоях
      const inputShape = model.inputs[0].shape as number[]
      const outputShape = model.outputs[0].shape as number[]
      
      const tensorflowModel: TensorFlowModel = {
        net: model,
        inputShape,
        outputShape,
        modelType: 'detection'
      }

      console.log('📊 Входной размер:', inputShape)
      console.log('📊 Выходной размер:', outputShape)

      setModelState(prev => ({
        ...prev,
        loaded: true,
        classifier: null,
        tensorflowModel,
        modelType: 'yolo'
      }))

    } catch (error) {
      console.error('❌ Ошибка загрузки YOLO модели:', error)
      console.log('🔄 Переключаемся на COCO-SSD как альтернативу...')
      loadCocoSSD()
    }
  }, [loadCocoSSD])

  const switchModel = useCallback((modelType: 'mobilenet' | 'yolo' | 'coco-ssd', modelUrl?: string) => {
    setModelState(prev => ({ ...prev, loaded: false }))
    
    if (modelType === 'yolo') {
      loadYOLO(modelUrl)
    } else if (modelType === 'coco-ssd') {
      loadCocoSSD()
    } else {
      loadMobileNet()
    }
  }, [loadMobileNet, loadYOLO, loadCocoSSD])

  // По умолчанию загружаем MobileNet при первом использовании
  const initialize = useCallback(() => {
    if (!modelState.loaded && !modelState.classifier && !modelState.tensorflowModel) {
      loadMobileNet()
    }
  }, [modelState.loaded, modelState.classifier, modelState.tensorflowModel, loadMobileNet])

  return {
    ...modelState,
    loadMobileNet,
    loadYOLO,
    loadCocoSSD,
    switchModel,
    initialize
  }
} 