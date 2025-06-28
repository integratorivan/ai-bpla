interface ModelStatusProps {
  modelLoaded: boolean
}

export function ModelStatus({ modelLoaded }: ModelStatusProps) {
  return (
    <div className="status">
      {!modelLoaded && <p>⏳ Загружаем модель MobileNet...</p>}
      {modelLoaded && <p>✅ Модель готова к работе</p>}
    </div>
  )
} 