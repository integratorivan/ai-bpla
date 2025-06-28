import { useState, useEffect } from 'preact/hooks'
import { WebcamClassifier } from './WebcamClassifier.refactored'
import './app.css'

export function App() {
  const [ml5Ready, setMl5Ready] = useState(false)
  const [ml5Version, setMl5Version] = useState('')

  useEffect(() => {
    // Проверяем, что ml5 загружен
    const checkMl5 = () => {
      if (typeof ml5 !== 'undefined') {
        setMl5Ready(true)
        setMl5Version(ml5.version)
        console.log('ml5.js загружен! Версия:', ml5.version)
      } else {
        // Если ml5 ещё не загружен, проверяем снова через 100ms
        setTimeout(checkMl5, 100)
      }
    }
    
    checkMl5()
  }, [])

  return (
    <>
      <div>
        <h1>🤖 Изучение ML5.js</h1>
        <h2>Vite + Preact + TypeScript</h2>
      </div>
      
      <div class="card">
        {ml5Ready ? (
          <div>
            <h3>✅ ML5.js готов к работе!</h3>
            <p>Версия: <strong>{ml5Version}</strong></p>
            <p>Библиотека успешно загружена и готова для создания ML приложений</p>
          </div>
        ) : (
          <div>
            <h3>⏳ Загрузка ML5.js...</h3>
            <p>Ожидаем загрузки библиотеки машинного обучения</p>
          </div>
        )}
      </div>

      {ml5Ready && <WebcamClassifier />}
    </>
  )
}
