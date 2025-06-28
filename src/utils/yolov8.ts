import * as tf from '@tensorflow/tfjs'
import type { YOLOv8Detection, YOLOv8Config } from '../types/ml5'
import { YOLO_CLASSES, YOLOV8_DEFAULTS, YOLOV8_MODELS } from '../constants'

/**
 * Загрузка YOLOv8 модели из различных источников
 */
export async function loadYOLOv8Model(
  variant: keyof typeof YOLOV8_MODELS = 'yolov8s',
  onProgress?: (progress: number) => void
): Promise<tf.GraphModel | null> {
  console.log(`🔄 Попытка загрузки YOLOv8 модели: ${variant}`)

  const modelConfig = YOLOV8_MODELS[variant]
  console.log(`📦 Загружаем модель: ${modelConfig.name} (${modelConfig.size})`)

  // Пробуем загрузить из разных источников по очереди
  for (let i = 0; i < modelConfig.urls.length; i++) {
    const url = modelConfig.urls[i]
    console.log(`🌐 Попытка загрузки с URL ${i + 1}/${modelConfig.urls.length}: ${url}`)

    try {
      // Используем tf.loadGraphModel для YOLOv8 (как в рабочем примере)
      const model = await tf.loadGraphModel(url, {
        onProgress: (fractions) => {
          const progress = fractions * 100
          console.log(`📊 Прогресс загрузки: ${progress.toFixed(1)}%`)
          onProgress?.(fractions)
        }
      })

      console.log('✅ Модель успешно загружена!')
      console.log('📊 Информация о модели:', {
        inputs: model.inputs.map(input => ({
          name: input.name,
          shape: input.shape,
          dtype: input.dtype
        })),
        outputs: model.outputs.map(output => ({
          name: output.name, 
          shape: output.shape,
          dtype: output.dtype
        }))
      })

      // Warming up модели (как в рабочем примере)
      console.log('🔥 Warming up модели...')
      if (model.inputs[0]?.shape) {
        const dummyInput = tf.ones(model.inputs[0].shape)
        const warmupResults = model.execute(dummyInput)
        
        // Очистка памяти
        tf.dispose([warmupResults, dummyInput])
        console.log('✅ Warming up завершен!')
      }

      return model

    } catch (error) {
      console.warn(`❌ Ошибка загрузки с URL ${url}:`, error)
      
      // Если это не последний URL, пробуем следующий
      if (i < modelConfig.urls.length - 1) {
        console.log('🔄 Пробуем следующий URL...')
        continue
      }
    }
  }

  console.error('❌ Не удалось загрузить модель YOLOv8 ни из одного источника')
  return null
}

/**
 * Создание демо модели YOLOv8 для тестирования
 * (пока реальные модели не доступны)
 */
function createDemoYOLOv8Model(): tf.LayersModel {
  console.log('🔄 Создаем минимальную заглушку YOLOv8...')
  
  try {
    // Минимальная модель-заглушка для демонстрации
    const input = tf.input({ 
      shape: [640, 640, 3],
      name: 'yolo_input'
    })
    
    // Очень простая модель: сразу переходим к выходу
    // Используем globalAveragePooling2d чтобы уменьшить размерность
    let x = tf.layers.globalAveragePooling2d({}).apply(input) as tf.SymbolicTensor
    
    // Простой выход: 10 детекций * 84 значения (вместо 8400)
    const output = tf.layers.dense({ 
      units: 10 * 84, // Только 10 детекций для демо
      activation: 'sigmoid',
      name: 'yolo_output'
    }).apply(x) as tf.SymbolicTensor

    const reshapedOutput = tf.layers.reshape({ 
      targetShape: [10, 84],
      name: 'yolo_reshape'
    }).apply(output) as tf.SymbolicTensor

    const model = tf.model({ 
      inputs: input, 
      outputs: reshapedOutput,
      name: 'minimal_yolov8_demo'
    })
    
    console.log('✅ Минимальная демо модель YOLOv8 создана')
    console.log('📊 Входная форма:', model.inputs[0].shape)
    console.log('📊 Выходная форма:', model.outputs[0].shape)
    
    return model
  } catch (error) {
    console.error('❌ Ошибка создания минимальной демо модели:', error)
    throw error
  }
}

/**
 * Предобработка изображения для YOLOv8
 */
export function preprocessImage(
  image: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement,
  modelInputShape: number[]
): tf.Tensor {
  return tf.tidy(() => {
    // Преобразуем изображение в тензор
    const tensor = tf.browser.fromPixels(image)
    
    // Изменяем размер под входную форму модели [1, height, width, 3]
    const [, height, width] = modelInputShape
    const resized = tf.image.resizeBilinear(tensor, [height, width])
    
    // Нормализуем значения в диапазон [0, 1]
    const normalized = resized.div(255.0)
    
    // Добавляем batch dimension
    const batched = normalized.expandDims(0)
    
    return batched
  })
}

/**
 * Постобработка результатов YOLOv8
 */
export function postprocessYOLOv8Results(
  predictions: tf.Tensor | tf.Tensor[],
  imageWidth: number,
  imageHeight: number,
  modelInputShape: number[],
  confidenceThreshold: number = 0.5
): YOLOv8Detection[] {
  // YOLOv8 возвращает результаты в формате [batch, 84, 8400] 
  // где 84 = 4 (bbox coords) + 80 (classes)
  const pred = Array.isArray(predictions) ? predictions[0] : predictions
  const [, , modelHeight, modelWidth] = modelInputShape
  
  // Получаем данные из тензора
  const predData = pred.dataSync()
  
  // Масштабирующие факторы для преобразования координат
  const xScale = imageWidth / modelWidth
  const yScale = imageHeight / modelHeight
  
  const detections: YOLOv8Detection[] = []
  const numDetections = pred.shape[2] || 8400 // 8400 или fallback
  const numClasses = 80
  
  for (let i = 0; i < numDetections; i++) {
    // Извлекаем координаты bbox (center_x, center_y, width, height)
    const centerX = predData[i * (4 + numClasses) + 0]
    const centerY = predData[i * (4 + numClasses) + 1] 
    const width = predData[i * (4 + numClasses) + 2]
    const height = predData[i * (4 + numClasses) + 3]
    
    // Находим класс с максимальной вероятностью
    let maxScore = 0
    let maxClassIndex = 0
    
    for (let j = 0; j < numClasses; j++) {
      const score = predData[i * (4 + numClasses) + 4 + j]
      if (score > maxScore) {
        maxScore = score
        maxClassIndex = j
      }
    }
    
    // Фильтруем по порогу confidence
    if (maxScore >= confidenceThreshold) {
      // Преобразуем координаты в формат [x1, y1, width, height]
      const x1 = (centerX - width / 2) * xScale
      const y1 = (centerY - height / 2) * yScale
      const x2 = (centerX + width / 2) * xScale  
      const y2 = (centerY + height / 2) * yScale
      
      detections.push({
        bbox: [
          Math.max(0, x1),
          Math.max(0, y1), 
          Math.min(imageWidth, x2) - Math.max(0, x1),
          Math.min(imageHeight, y2) - Math.max(0, y1)
        ] as [number, number, number, number],
        class: YOLO_CLASSES[maxClassIndex] || `unknown_${maxClassIndex}`,
        classId: maxClassIndex,
        confidence: maxScore,
        area: width * height,
        normalized: false
      })
    }
  }
  
  return detections
}

/**
 * Создание конфигурации YOLOv8 по умолчанию
 */
export function createYOLOv8Config(variant: keyof typeof YOLOV8_MODELS = 'yolov8s'): YOLOv8Config {
  const modelInfo = YOLOV8_MODELS[variant]
  
  return {
    modelUrl: modelInfo.urls[0], // Первый URL по умолчанию
    confThreshold: YOLOV8_DEFAULTS.CONFIDENCE_THRESHOLD,
    iouThreshold: YOLOV8_DEFAULTS.IOU_THRESHOLD,
    inputSize: YOLOV8_DEFAULTS.INPUT_SIZE,
    maxDetections: YOLOV8_DEFAULTS.MAX_DETECTIONS,
    modelVariant: variant
  }
}

/**
 * Выполнение YOLOv8 инференса на изображении
 */
export async function runYOLOv8Inference(
  model: tf.GraphModel,
  imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement,
  config: YOLOv8Config
): Promise<YOLOv8Detection[]> {
  console.log('🔍 Выполняем YOLOv8 инференс...')
  
  // Предобработка
  const preprocessed = preprocessImage(imageElement, [1, config.inputSize, config.inputSize, 3])
  
  try {
    // Инференс
    const startTime = performance.now()
    const predictions = model.execute(preprocessed) as tf.Tensor
    const inferenceTime = performance.now() - startTime
    
    console.log(`⏱️ Время инференса: ${inferenceTime.toFixed(1)}ms`)
    
    // Получаем размеры изображения
    let originalWidth: number
    let originalHeight: number
    
    if (imageElement instanceof HTMLVideoElement) {
      originalWidth = imageElement.videoWidth || 640
      originalHeight = imageElement.videoHeight || 480
    } else if (imageElement instanceof HTMLImageElement) {
      originalWidth = imageElement.naturalWidth || imageElement.width || 640
      originalHeight = imageElement.naturalHeight || imageElement.height || 480
    } else {
      // HTMLCanvasElement
      originalWidth = imageElement.width || 640
      originalHeight = imageElement.height || 480
    }
    
    // Постобработка
    const detections = postprocessYOLOv8Results(
      predictions,
      originalWidth,
      originalHeight,
      [1, config.inputSize, config.inputSize, 3],
      config.confThreshold
    )
    
    console.log(`✅ Найдено ${detections.length} объектов`)
    
    // Очистка памяти
    preprocessed.dispose()
    predictions.dispose()
    
    return detections.slice(0, config.maxDetections)
  } catch (error) {
    console.error('❌ Ошибка инференса YOLOv8:', error)
    preprocessed.dispose()
    return []
  }
} 