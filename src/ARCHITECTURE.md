# Архитектура WebcamClassifier

## Обзор
Компонент `WebcamClassifier` был разбит на модульную архитектуру с использованием кастомных хуков и переиспользуемых компонентов.

## Структура файлов

```
src/
├── types/
│   └── ml5.d.ts                 # Типы для ml5.js и интерфейсы
├── hooks/
│   ├── index.ts                 # Экспорт всех хуков
│   ├── useModel.ts              # Хук для работы с ML модели
│   ├── useCamera.ts             # Хук для работы с камерой
│   ├── useStream.ts             # Хук для работы с видео стримом
│   └── usePredictions.ts        # Хук для классификации и автоанализа
├── components/
│   ├── index.ts                 # Экспорт всех компонентов
│   ├── ModelStatus.tsx          # Статус загрузки модели
│   ├── StreamControls.tsx       # Управление видео стримом
│   ├── CameraControls.tsx       # Управление камерой
│   ├── VideoDisplay.tsx         # Отображение видео и canvas
│   └── PredictionsDisplay.tsx   # Отображение результатов ИИ
├── WebcamClassifier.tsx         # Оригинальный компонент
├── WebcamClassifier.refactored.tsx  # Рефакторенный компонент
└── ARCHITECTURE.md              # Этот файл
```

## Хуки (Custom Hooks)

### useModel
**Файл**: `hooks/useModel.ts`
**Назначение**: Управление загрузкой и состоянием ML модели MobileNet
**Возвращает**: `{ loaded: boolean, classifier: any }`

### useCamera
**Файл**: `hooks/useCamera.ts`
**Назначение**: Управление доступом к веб-камере и MediaStream
**Возвращает**: 
```typescript
{
  cameraState: CameraState,
  requestPermission: () => Promise<void>,
  enableCamera: (videoRef) => Promise<void>,
  disableCamera: () => void
}
```

### useStream
**Файл**: `hooks/useStream.ts`
**Назначение**: Управление загрузкой внешнего видео по URL
**Возвращает**:
```typescript
{
  streamState: StreamState,
  loadStream: (videoRef) => boolean,
  stopStream: (videoRef) => void,
  setUrl: (url: string) => void
}
```

### usePredictions
**Файл**: `hooks/usePredictions.ts`
**Назначение**: Обработка классификации изображений через ML модель
**Возвращает**:
```typescript
{
  analysisState: AnalysisState,
  classifyFrame: (classifier, videoRef, canvasRef, enabled) => Promise<void>,
  clearPredictions: () => void
}
```

### useAutoClassification
**Файл**: `hooks/usePredictions.ts`
**Назначение**: Автоматический запуск классификации через заданные интервалы
**Параметры**: `(enabled, modelLoaded, classifyFrame, interval = 2000)`

## Компоненты (UI Components)

### ModelStatus
**Назначение**: Показывает статус загрузки ML модели
**Пропсы**: `{ modelLoaded: boolean }`

### StreamControls
**Назначение**: Интерфейс для загрузки внешнего видео
**Пропсы**: 
```typescript
{
  streamState: StreamState,
  modelLoaded: boolean,
  onUrlChange: (url: string) => void,
  onLoadStream: () => void,
  onStopStream: () => void
}
```

### CameraControls
**Назначение**: Интерфейс управления веб-камерой
**Пропсы**: 
```typescript
{
  cameraState: CameraState,
  modelLoaded: boolean,
  onRequestPermission: () => void,
  onEnableCamera: () => void,
  onDisableCamera: () => void
}
```

### VideoDisplay
**Назначение**: Отображение видео потока и кнопка ручного анализа
**Пропсы**: 
```typescript
{
  cameraEnabled: boolean,
  isAnalyzing: boolean,
  modelLoaded: boolean,
  onClassifyFrame: () => void,
  videoRef: RefObject<HTMLVideoElement>,
  canvasRef: RefObject<HTMLCanvasElement>
}
```

### PredictionsDisplay
**Назначение**: Отображение результатов классификации ИИ
**Пропсы**: `{ predictions: Prediction[] }`

## Типы (TypeScript Interfaces)

### Основные интерфейсы
```typescript
interface Prediction {
  label: string
  confidence: number
}

interface CameraState {
  enabled: boolean
  stream: MediaStream | null
  permissionGranted: boolean | null
}

interface ModelState {
  loaded: boolean
  classifier: any
}

interface StreamState {
  url: string
  isStreamMode: boolean
}

interface AnalysisState {
  isAnalyzing: boolean
  predictions: Prediction[]
}
```

## Преимущества новой архитектуры

1. **Разделение ответственности**: Каждый хук отвечает за одну область функциональности
2. **Переиспользуемость**: Компоненты и хуки можно использовать независимо
3. **Тестируемость**: Легче писать unit-тесты для отдельных компонентов
4. **Читаемость**: Код стал более структурированным и понятным
5. **Типизация**: Полная типизация с TypeScript
6. **Модульность**: Легко добавлять новые функции или изменять существующие

## Миграция

Для использования новой архитектуры:

1. Замените импорт:
   ```typescript
   // Старый способ
   import { WebcamClassifier } from './WebcamClassifier'
   
   // Новый способ
   import { WebcamClassifier } from './WebcamClassifier.refactored'
   ```

2. Убедитесь, что подключен файл типов `types/ml5.d.ts`

## Расширение функциональности

### Добавление нового хука
1. Создайте файл в `hooks/`
2. Добавьте экспорт в `hooks/index.ts`
3. Используйте в главном компоненте

### Добавление нового компонента
1. Создайте файл в `components/`
2. Добавьте экспорт в `components/index.ts`
3. Импортируйте и используйте в главном компоненте 