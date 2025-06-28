import type { Prediction } from '../types/ml5'

interface PredictionsDisplayProps {
  predictions: Prediction[]
}

export function PredictionsDisplay({ predictions }: PredictionsDisplayProps) {
  if (predictions.length === 0) {
    return null
  }

  return (
    <div className="predictions">
      <h3>🎯 Что видит ИИ:</h3>
      <div className="predictions-list">
        {predictions.slice(0, 3).map((prediction, index) => (
          <div key={index} className="prediction-item">
            <span className="label">{prediction.label}</span>
            <span className="confidence">
              {Math.round(prediction.confidence * 100)}%
            </span>
            <div className="confidence-bar">
              <div 
                className="confidence-fill"
                style={{ width: `${prediction.confidence * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 