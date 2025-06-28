import React from "react";

const ModelSelector = ({ selectedModel, onModelChange, isLoading }) => {
  const models = [
    { id: "yolov8n", name: "YOLOv8n", description: "Быстрая, базовая версия" },
    { id: "yolo11n", name: "YOLOv11n", description: "Улучшенная точность" },
    { id: "yolo12n", name: "YOLOv12n", description: "Последняя версия" }
  ];

  return (
    <div className="model-selector">
      <div className="selector-header">
        <h3>Выбор модели YOLO</h3>
        <span className="current-model">Текущая: {selectedModel}</span>
      </div>
      
      <div className="model-options">
        {models.map((model) => (
          <div 
            key={model.id}
            className={`model-option ${selectedModel === model.id ? 'active' : ''} ${isLoading ? 'disabled' : ''}`}
            onClick={() => !isLoading && onModelChange(model.id)}
          >
            <div className="model-info">
              <span className="model-name">{model.name}</span>
              <span className="model-description">{model.description}</span>
            </div>
            {selectedModel === model.id && (
              <div className="model-indicator">✓</div>
            )}
          </div>
        ))}
      </div>
      
      {isLoading && (
        <div className="loading-indicator">
          <span>Загрузка модели...</span>
        </div>
      )}
    </div>
  );
};

export default ModelSelector; 