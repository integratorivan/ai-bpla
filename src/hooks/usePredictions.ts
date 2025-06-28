import { useState, useCallback, useEffect } from 'preact/hooks'
import type { AnalysisState, Prediction, Detection, TensorFlowModel } from '../types/ml5'
import { YOLO_CLASSES } from '../constants'
import * as tf from '@tensorflow/tfjs'

export function usePredictions() {
  const [analysisState, setAnalysisState] = useState<AnalysisState>({
    isAnalyzing: false,
    predictions: [],
    detections: []
  })

  // Предобработка изображения для YOLO
  const preprocessImage = useCallback((
    videoElement: HTMLVideoElement,
    inputShape: number[]
  ): tf.Tensor => {
    const [batch, height, width, channels] = inputShape
    
    // Получаем tensor из видео элемента
    const imageTensor = tf.browser.fromPixels(videoElement)
    
    // Изменяем размер до нужного
    const resized = tf.image.resizeBilinear(imageTensor, [height || 416, width || 416])
    
    // Нормализуем значения (0-255 -> 0-1)
    const normalized = resized.div(255.0)
    
    // Добавляем batch размерность
    const batched = normalized.expandDims(0)
    
    // Освобождаем промежуточные tensors
    imageTensor.dispose()
    resized.dispose()
    normalized.dispose()
    
    return batched
  }, [])

  // Постобработка результатов YOLO
  const postprocessYOLO = useCallback((
    predictions: tf.Tensor,
    confidenceThreshold: number = 0.3,
    iouThreshold: number = 0.4
  ): Detection[] => {
    const detections: Detection[] = []
    
    // Получаем данные из tensor
    const predData = predictions.dataSync()
    const shape = predictions.shape
    
    // Парсим результаты (формат зависит от конкретной YOLO модели)
    // Обычно: [batch, grid_y, grid_x, anchors, (x, y, w, h, conf, class_probs...)]
    
    // Это примерная реализация - может потребоваться адаптация под конкретную модель
    if (shape.length >= 2 && shape[1] !== undefined) {
      const numDetections = shape[1]
      const detectionSize = shape[2] || 85 // 4 coords + 1 conf + 80 classes
      
      for (let i = 0; i < numDetections; i++) {
        const offset = i * detectionSize
        
        const confidence = predData[offset + 4]
        
        if (confidence > confidenceThreshold) {
          const x = predData[offset + 0]
          const y = predData[offset + 1]
          const w = predData[offset + 2]
          const h = predData[offset + 3]
          
          // Находим класс с максимальной вероятностью
          let maxClassProb = 0
          let classId = 0
          
          for (let j = 5; j < detectionSize; j++) {
            const classProb = predData[offset + j]
            if (classProb > maxClassProb) {
              maxClassProb = classProb
              classId = j - 5
            }
          }
          
          const finalConfidence = confidence * maxClassProb
          
          if (finalConfidence > confidenceThreshold && classId < YOLO_CLASSES.length) {
            detections.push({
              bbox: [
                x - w/2, // x_min
                y - h/2, // y_min
                w,       // width
                h        // height
              ],
              class: YOLO_CLASSES[classId],
              classId,
              confidence: finalConfidence
            })
          }
        }
      }
    }
    
    // Применяем Non-Maximum Suppression (NMS) для удаления дублирующихся детекций
    return applyNMS(detections, iouThreshold)
  }, [])

  // Простая реализация Non-Maximum Suppression
  const applyNMS = useCallback((detections: Detection[], iouThreshold: number): Detection[] => {
    if (detections.length === 0) return []
    
    // Сортируем по confidence (убывание)
    const sorted = detections.slice().sort((a, b) => b.confidence - a.confidence)
    const keep: Detection[] = []
    
    while (sorted.length > 0) {
      const current = sorted.shift()!
      keep.push(current)
      
      // Удаляем детекции с высоким IoU (пересечением)
      for (let i = sorted.length - 1; i >= 0; i--) {
        const iou = calculateIoU(current.bbox, sorted[i].bbox)
        if (iou > iouThreshold) {
          sorted.splice(i, 1)
        }
      }
    }
    
    return keep
  }, [])

  // Вычисление Intersection over Union (IoU)
  const calculateIoU = useCallback((bbox1: number[], bbox2: number[]): number => {
    const [x1_1, y1_1, w1, h1] = bbox1
    const [x1_2, y1_2, w2, h2] = bbox2
    
    const x2_1 = x1_1 + w1
    const y2_1 = y1_1 + h1
    const x2_2 = x1_2 + w2
    const y2_2 = y1_2 + h2
    
    // Пересечение
    const intersection_x1 = Math.max(x1_1, x1_2)
    const intersection_y1 = Math.max(y1_1, y1_2)
    const intersection_x2 = Math.min(x2_1, x2_2)
    const intersection_y2 = Math.min(y2_1, y2_2)
    
    const intersection_area = Math.max(0, intersection_x2 - intersection_x1) * 
                            Math.max(0, intersection_y2 - intersection_y1)
    
    // Объединение
    const area1 = w1 * h1
    const area2 = w2 * h2
    const union_area = area1 + area2 - intersection_area
    
    return intersection_area / union_area
  }, [])

  // Классификация с MobileNet (ml5.js)
  const classifyFrame = useCallback(async (
    classifier: any,
    videoRef: { current: HTMLVideoElement | null },
    canvasRef: { current: HTMLCanvasElement | null }
  ) => {
    if (!classifier || !videoRef.current) {
      console.log('⚠️ Classifier или видео не готов')
      return
    }

    setAnalysisState(prev => ({ ...prev, isAnalyzing: true }))

    try {
      const results = await classifier.classify(videoRef.current)
      console.log('🔍 Результаты классификации MobileNet:', results)

      const predictions: Prediction[] = results.map((result: any) => ({
        label: result.label,
        confidence: Math.round(result.confidence * 100)
      }))

      setAnalysisState(prev => ({
        ...prev,
        isAnalyzing: false,
        predictions,
        detections: [] // Очищаем детекции при классификации
      }))

    } catch (error) {
      console.error('❌ Ошибка классификации:', error)
      setAnalysisState(prev => ({ ...prev, isAnalyzing: false }))
    }
  }, [])

  // Детекция объектов с COCO-SSD (TensorFlow.js)
  const detectObjectsCocoSSD = useCallback(async (
    tensorflowModel: TensorFlowModel,
    videoRef: { current: HTMLVideoElement | null },
    canvasRef: { current: HTMLCanvasElement | null }
  ) => {
    if (!tensorflowModel?.net || !videoRef.current) {
      console.log('⚠️ COCO-SSD модель или видео не готов')
      return
    }

    setAnalysisState(prev => ({ ...prev, isAnalyzing: true }))

    try {
      console.log('🔍 Запускаем детекцию объектов COCO-SSD...')
      
      // COCO-SSD имеет простой API - просто передаем видео элемент
      const predictions = await tensorflowModel.net.detect(videoRef.current)
      
      // Конвертируем результаты COCO-SSD в наш формат Detection
      const detections: Detection[] = predictions.map((prediction: any, index: number) => ({
        bbox: [
          prediction.bbox[0], // x
          prediction.bbox[1], // y  
          prediction.bbox[2], // width
          prediction.bbox[3]  // height
        ],
        class: prediction.class,
        classId: index, // COCO-SSD не возвращает ID класса, используем индекс
        confidence: prediction.score
      }))
      
      console.log('🎯 Обнаружено объектов COCO-SSD:', detections.length)
      console.log('📊 Детекции:', detections)

      setAnalysisState(prev => ({
        ...prev,
        isAnalyzing: false,
        predictions: [], // Очищаем классификации при детекции
        detections
      }))

    } catch (error) {
      console.error('❌ Ошибка детекции COCO-SSD:', error)
      setAnalysisState(prev => ({ ...prev, isAnalyzing: false }))
    }
  }, [])

  // Детекция объектов с YOLO (TensorFlow.js)
  const detectObjects = useCallback(async (
    tensorflowModel: TensorFlowModel,
    videoRef: { current: HTMLVideoElement | null },
    canvasRef: { current: HTMLCanvasElement | null }
  ) => {
    if (!tensorflowModel?.net || !videoRef.current) {
      console.log('⚠️ YOLO модель или видео не готов')
      return
    }

    setAnalysisState(prev => ({ ...prev, isAnalyzing: true }))

    try {
      console.log('🔍 Запускаем детекцию объектов YOLO...')
      
      // Предобработка
      const inputTensor = preprocessImage(videoRef.current, tensorflowModel.inputShape)
      
      // Inference
      const predictions = tensorflowModel.net.predict(inputTensor) as tf.Tensor
      
      // Постобработка
      const detections = postprocessYOLO(predictions)
      
      console.log('🎯 Обнаружено объектов:', detections.length)
      console.log('📊 Детекции:', detections)

      setAnalysisState(prev => ({
        ...prev,
        isAnalyzing: false,
        predictions: [], // Очищаем классификации при детекции
        detections
      }))

      // Освобождаем память
      inputTensor.dispose()
      predictions.dispose()

    } catch (error) {
      console.error('❌ Ошибка детекции YOLO:', error)
      setAnalysisState(prev => ({ ...prev, isAnalyzing: false }))
    }
  }, [preprocessImage, postprocessYOLO])

  const clearResults = useCallback(() => {
    setAnalysisState({
      isAnalyzing: false,
      predictions: [],
      detections: []
    })
  }, [])

  return {
    ...analysisState,
    classifyFrame,
    detectObjects,
    detectObjectsCocoSSD,
    clearResults
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