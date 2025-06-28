# YOLOv8 Models Directory

Эта папка предназначена для локальных YOLOv8 моделей в формате TensorFlow.js.

## Структура папок

```
yolov8/
├── yolov8n/     # YOLOv8 Nano (6.2 MB)
├── yolov8s/     # YOLOv8 Small (21.5 MB)  
├── yolov8m/     # YOLOv8 Medium (49.7 MB)
├── yolov8l/     # YOLOv8 Large (83.7 MB)
└── yolov8x/     # YOLOv8 Extra Large (136.7 MB)
```

## Добавление локальных моделей

Для каждого варианта модели в соответствующей папке должны быть файлы:

### Обязательные файлы:
- `model.json` - Архитектура модели TensorFlow.js
- `*.bin` - Веса модели (один или несколько файлов)

### Пример для yolov8s:
```
yolov8s/
├── model.json
├── weights_1.bin
├── weights_2.bin
└── weights_3.bin
```

## Как получить модели TensorFlow.js

### Вариант 1: Конвертация из PyTorch
```bash
# Установите ultralytics
pip install ultralytics

# Экспорт в формат TensorFlow.js
yolo export model=yolov8s.pt format=tfjs
```

### Вариант 2: Скачивание готовых моделей
- [TensorFlow Hub](https://tfhub.dev/s?q=yolov8)
- [Ultralytics GitHub Releases](https://github.com/ultralytics/assets/releases)

### Вариант 3: Использование онлайн конвертеров
- [TensorFlow.js Converter](https://www.tensorflow.org/js/guide/conversion)

## Проверка загрузки

После добавления моделей:

1. Откройте консоль браузера (F12)
2. Выберите YOLOv8 модель в селекторе
3. Наблюдайте за логами загрузки

Если модель загрузилась успешно, вы увидите:
```
✅ YOLOv8 [variant] успешно загружена!
```

## Устранение проблем

### Ошибка CORS
Локальные модели должны загружаться через dev server, а не file:// протокол.

### Неправильный формат
Убедитесь, что модели конвертированы именно в TensorFlow.js формат, а не ONNX или PyTorch.

### Размер файлов
Большие модели (yolov8l, yolov8x) могут долго загружаться и потреблять много памяти.

---

**Примечание:** Если локальные модели недоступны, приложение будет использовать демо-модель для тестирования функционала. 