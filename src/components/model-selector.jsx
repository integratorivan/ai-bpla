import React from "react";
import "../style/model-selector.css";

const ModelSelector = ({ selectedModel, onModelChange, isLoading }) => {
  const models = [
    { 
      id: "yolov8n", 
      name: "YOLO v8.NANO", 
      description: "FAST_DEPLOY • LIGHTWEIGHT",
      details: "~3M params • optimized speed"
    },
    { 
      id: "yolo11n", 
      name: "YOLO v11.NANO", 
      description: "ENHANCED_ACCURACY • IMPROVED",
      details: "new architecture • better detection"
    },
    { 
      id: "yolo12n", 
      name: "YOLO v12.NANO", 
      description: "LATEST_BUILD • EXPERIMENTAL",
      details: "highest accuracy • may be slower"
    }
  ];

  return (
    <div className="model-selector">
      
      <div className="selector-header">
        <h3>Neural Network Selection</h3>
        <span className="current-model">
          ACTIVE: {selectedModel.toUpperCase()}
        </span>
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
              <span className="model-details">{model.details}</span>
            </div>
            {selectedModel === model.id && (
              <div className="model-indicator">✓</div>
            )}
          </div>
        ))}
      </div>
      
      {isLoading && (
        <div className="loading-indicator">
          <span>NEURAL NETWORK INITIALIZATION...</span>
        </div>
      )}
    </div>
  );
};

export default ModelSelector; 