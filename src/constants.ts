// YOLO классы объектов (COCO dataset)
export const YOLO_CLASSES = [
  'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck', 'boat',
  'traffic light', 'fire hydrant', 'stop sign', 'parking meter', 'bench', 'bird', 'cat',
  'dog', 'horse', 'sheep', 'cow', 'elephant', 'bear', 'zebra', 'giraffe', 'backpack',
  'umbrella', 'handbag', 'tie', 'suitcase', 'frisbee', 'skis', 'snowboard', 'sports ball',
  'kite', 'baseball bat', 'baseball glove', 'skateboard', 'surfboard', 'tennis racket',
  'bottle', 'wine glass', 'cup', 'fork', 'knife', 'spoon', 'bowl', 'banana', 'apple',
  'sandwich', 'orange', 'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake',
  'chair', 'couch', 'potted plant', 'bed', 'dining table', 'toilet', 'tv', 'laptop',
  'mouse', 'remote', 'keyboard', 'cell phone', 'microwave', 'oven', 'toaster', 'sink',
  'refrigerator', 'book', 'clock', 'vase', 'scissors', 'teddy bear', 'hair drier', 'toothbrush'
] as const

// Настройки по умолчанию для YOLO
export const YOLO_DEFAULTS = {
  CONFIDENCE_THRESHOLD: 0.3,
  IOU_THRESHOLD: 0.4,
  INPUT_SIZE: 416,
  MAX_DETECTIONS: 100
} as const

// YOLOv8 конфигурации и URLs
export const YOLOV8_MODELS = {
  // Nano - самая быстрая, наименьшая точность
  yolov8n: {
    name: 'YOLOv8 Nano',
    size: '~13 MB',
    accuracy: 'Средняя',
    speed: 'Очень быстрая',
    urls: [
      '/models/yolov8/yolov8n/yolov8n_web_model/model.json',
      'https://github.com/Hyuto/yolov8-tfjs/raw/master/public/yolov8n_web_model/model.json'
    ]
  },
  // Small - баланс скорости и точности  
  yolov8s: {
    name: 'YOLOv8 Small',
    size: '~22 MB', 
    accuracy: 'Хорошая',
    speed: 'Быстрая',
    urls: [
      '/models/yolov8/yolov8s/yolov8s_web_model/model.json'
    ]
  },
  // Medium - более точная детекция
  yolov8m: {
    name: 'YOLOv8 Medium',
    size: '~50 MB',
    accuracy: 'Высокая',
    speed: 'Средняя',
    urls: [
      '/models/yolov8/yolov8m/yolov8m_web_model/model.json'
    ]
  },
  // Large - очень точная детекция
  yolov8l: {
    name: 'YOLOv8 Large',
    size: '~84 MB',
    accuracy: 'Очень высокая',
    speed: 'Медленная',
    urls: [
      '/models/yolov8/yolov8l/yolov8l_web_model/model.json'
    ]
  },
  // Extra Large - максимальная точность
  yolov8x: {
    name: 'YOLOv8 Extra Large',
    size: '~137 MB',
    accuracy: 'Максимальная',
    speed: 'Очень медленная',
    urls: [
      '/models/yolov8/yolov8x/yolov8x_web_model/model.json'
    ]
  }
} as const

// YOLOv8 настройки по умолчанию
export const YOLOV8_DEFAULTS = {
  CONFIDENCE_THRESHOLD: 0.25,
  IOU_THRESHOLD: 0.45,
  INPUT_SIZE: 640,
  MAX_DETECTIONS: 300,
  DEFAULT_VARIANT: 'yolov8s' as const,
  // Готовые модели TensorFlow.js формата
  TFJS_MODEL_URLS: {
    yolov8n: 'https://kaggle.com/models/tensorflow/yolo-v8/TensorFlow2/yolo-v8-nano/1',
    yolov8s: 'https://kaggle.com/models/tensorflow/yolo-v8/TensorFlow2/yolo-v8-small/1',
    yolov8m: 'https://kaggle.com/models/tensorflow/yolo-v8/TensorFlow2/yolo-v8-medium/1',
    yolov8l: 'https://kaggle.com/models/tensorflow/yolo-v8/TensorFlow2/yolo-v8-large/1',
    yolov8x: 'https://kaggle.com/models/tensorflow/yolo-v8/TensorFlow2/yolo-v8-extra-large/1'
  }
} as const

// Цвета для разных классов объектов (для визуализации)
export const DETECTION_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2'
] as const 