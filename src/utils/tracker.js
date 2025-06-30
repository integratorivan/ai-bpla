/**
 * Simple Object Tracker - простая система трекинга объектов по ID
 * Фокусируется только на присвоении уникальных ID объектам
 */

export class ObjectTracker {
  constructor(maxDisappeared = 5, maxDistance = 80) {
    this.nextObjectID = 0;
    this.objects = new Map(); // ID -> {centroid, bbox, class, lastSeen}
    this.disappeared = new Map(); // ID -> frames_count
    this.maxDisappeared = maxDisappeared;
    this.maxDistance = maxDistance;
  }

  /**
   * Вычисляет центр прямоугольника
   */
  getCentroid(bbox) {
    const [y1, x1, y2, x2] = bbox;
    return {
      x: (x1 + x2) / 2,
      y: (y1 + y2) / 2
    };
  }

  /**
   * Вычисляет евклидово расстояние между двумя точками
   */
  distance(point1, point2) {
    return Math.sqrt(
      Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2)
    );
  }

  /**
   * Регистрирует новый объект
   */
  register(centroid, bbox, classId) {
    const objectId = this.nextObjectID++;
    this.objects.set(objectId, {
      centroid,
      bbox,
      class: classId,
      lastSeen: Date.now()
    });
    this.disappeared.set(objectId, 0);
    return objectId;
  }

  /**
   * Удаляет объект
   */
  deregister(objectId) {
    this.objects.delete(objectId);
    this.disappeared.delete(objectId);
  }

  /**
   * Основная функция трекинга
   */
  update(detections) {
    // detections: [{bbox: [y1,x1,y2,x2], score, class}, ...]
    
    if (detections.length === 0) {
      // Если нет детекций, увеличиваем счетчик исчезновения для всех объектов
      const objectIds = Array.from(this.disappeared.keys());
      for (const objectId of objectIds) {
        this.disappeared.set(objectId, this.disappeared.get(objectId) + 1);
        
        if (this.disappeared.get(objectId) > this.maxDisappeared) {
          this.deregister(objectId);
        }
      }
      return this.getCurrentTracks();
    }

    // Если у нас нет отслеживаемых объектов, регистрируем все детекции
    if (this.objects.size === 0) {
      for (const detection of detections) {
        const centroid = this.getCentroid(detection.bbox);
        this.register(centroid, detection.bbox, detection.class);
      }
      return this.getCurrentTracks();
    }

    // Вычисляем центроиды для всех детекций
    const inputCentroids = detections.map(d => this.getCentroid(d.bbox));
    const objectIds = Array.from(this.objects.keys());
    const objectCentroids = objectIds.map(id => this.objects.get(id).centroid);

    // Простое сопоставление по минимальному расстоянию
    const usedDetectionIndices = new Set();
    const usedObjectIndices = new Set();

    // Для каждого существующего объекта находим ближайшую детекцию
    for (let i = 0; i < objectIds.length; i++) {
      if (usedObjectIndices.has(i)) continue;

      const objectId = objectIds[i];
      const objectCentroid = objectCentroids[i];
      const objectClass = this.objects.get(objectId).class;

      let bestDistance = Infinity;
      let bestDetectionIndex = -1;

      for (let j = 0; j < inputCentroids.length; j++) {
        if (usedDetectionIndices.has(j)) continue;

        const distance = this.distance(objectCentroid, inputCentroids[j]);
        const sameClass = detections[j].class === objectClass;

        // Учитываем класс - объекты того же класса имеют приоритет
        const adjustedDistance = sameClass ? distance : distance * 1.5;

        if (adjustedDistance < bestDistance && adjustedDistance <= this.maxDistance) {
          bestDistance = adjustedDistance;
          bestDetectionIndex = j;
        }
      }

      if (bestDetectionIndex !== -1) {
        // Обновляем объект
        const detection = detections[bestDetectionIndex];
        const centroid = inputCentroids[bestDetectionIndex];

        this.objects.set(objectId, {
          centroid,
          bbox: detection.bbox,
          class: detection.class,
          lastSeen: Date.now()
        });

        this.disappeared.set(objectId, 0);
        usedObjectIndices.add(i);
        usedDetectionIndices.add(bestDetectionIndex);
      }
    }

    // Обрабатываем несопоставленные объекты
    for (let i = 0; i < objectIds.length; i++) {
      if (!usedObjectIndices.has(i)) {
        const objectId = objectIds[i];
        this.disappeared.set(objectId, this.disappeared.get(objectId) + 1);

        if (this.disappeared.get(objectId) > this.maxDisappeared) {
          this.deregister(objectId);
        }
      }
    }

    // Регистрируем новые объекты
    for (let i = 0; i < detections.length; i++) {
      if (!usedDetectionIndices.has(i)) {
        const centroid = inputCentroids[i];
        this.register(centroid, detections[i].bbox, detections[i].class);
      }
    }

    return this.getCurrentTracks();
  }

  /**
   * Возвращает текущие треки
   */
  getCurrentTracks() {
    const tracks = [];
    for (const [objectId, object] of this.objects.entries()) {
      tracks.push({
        id: objectId,
        bbox: object.bbox,
        class: object.class,
        centroid: object.centroid,
        lastSeen: object.lastSeen
      });
    }
    return tracks;
  }

  /**
   * Получает статистику по уникальным объектам
   */
  getUniqueObjectsStats() {
    const stats = {};
    for (const [objectId, object] of this.objects.entries()) {
      const className = object.class;
      stats[className] = (stats[className] || 0) + 1;
    }
    return stats;
  }

  /**
   * Очищает все треки
   */
  reset() {
    this.objects.clear();
    this.disappeared.clear();
    this.nextObjectID = 0;
  }

  /**
   * Получает общее количество уникальных объектов за сессию
   */
  getTotalUniqueCount() {
    return this.nextObjectID;
  }
} 