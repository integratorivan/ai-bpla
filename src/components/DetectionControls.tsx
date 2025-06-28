import { useRef } from 'preact/hooks'

interface DetectionControlsProps {
  isAnalyzing: boolean
  modelLoaded: boolean
  interval: number
  onIntervalChange: (interval: number) => void
  onAnalyzeNow: () => void
}

export function DetectionControls({
  isAnalyzing,
  modelLoaded,
  interval,
  onIntervalChange,
  onAnalyzeNow
}: DetectionControlsProps) {
  const intervalRef = useRef<HTMLInputElement>(null)

  const handleIntervalChange = (e: Event) => {
    const target = e.target as HTMLInputElement
    const newInterval = parseInt(target.value)
    onIntervalChange(newInterval)
  }

  // Предустановленные значения интервалов
  const intervalPresets = [
    { value: 200, label: '🚀 Очень быстро (0.2с)', fps: '5 FPS' },
    { value: 500, label: '⚡ Быстро (0.5с)', fps: '2 FPS' },
    { value: 1000, label: '🔄 Средне (1с)', fps: '1 FPS' },
    { value: 2000, label: '🐌 Медленно (2с)', fps: '0.5 FPS' }
  ]

  return (
    <div className="detection-controls">
      <h4>⚙️ Настройки детекции</h4>
      
      {/* Контроль частоты обновления */}
      <div className="control-group">
        <label htmlFor="interval-slider">
          📈 Частота анализа: <strong>{1000/interval} FPS</strong> ({interval}мс)
        </label>
        
        <div className="interval-controls">
          <input
            ref={intervalRef}
            id="interval-slider"
            type="range"
            min="200"
            max="3000"
            step="100"
            value={interval}
            onInput={handleIntervalChange}
            className="interval-slider"
            disabled={isAnalyzing}
          />
          
          <div className="interval-display">
            <span className="current-interval">{interval}мс</span>
          </div>
        </div>

        {/* Быстрые предустановки */}
        <div className="interval-presets">
          {intervalPresets.map((preset) => (
            <button
              key={preset.value}
              onClick={() => onIntervalChange(preset.value)}
              className={`preset-btn ${interval === preset.value ? 'active' : ''}`}
              disabled={isAnalyzing}
              title={`Установить ${preset.fps}`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Ручной запуск анализа */}
      <div className="control-group">
        <button 
          onClick={onAnalyzeNow}
          disabled={isAnalyzing || !modelLoaded}
          className="btn-analyze-manual"
        >
          {isAnalyzing ? '🔄 Анализируется...' : '🔍 Анализировать сейчас'}
        </button>
      </div>

      {/* Информация о производительности */}
      <div className="performance-info">
        <p className="info-text">
          💡 <strong>Совет:</strong> Для лучшей производительности на мобильных устройствах 
          используйте частоту 1-2 FPS. На мощных устройствах можно до 5 FPS.
        </p>
      </div>
    </div>
  )
} 