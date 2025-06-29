import React, { useState, useEffect, useRef } from "react";
import * as tf from "@tensorflow/tfjs";
// import "@tensorflow/tfjs-backend-webgl"; // set backend to webgl
import "@tensorflow/tfjs-backend-webgpu";
import Loader from "./components/loader";
import ButtonHandler from "./components/btn-handler";
import Statistics from "./components/statistics";
import VideoControls from "./components/video-controls";
import ModelSelector from "./components/model-selector";
import { detect, detectVideo } from "./utils/detect";
import "./style/App.css";
import "./style/model-selector.css";

const App = () => {
  const [loading, setLoading] = useState({ loading: true, progress: 0 }); // loading state
  const [model, setModel] = useState({
    net: null,
    inputShape: [1, 0, 0, 3],
  }); // init model & input shape
  const [selectedModel, setSelectedModel] = useState("yolov8n"); // default model
  const [streaming, setStreaming] = useState(null); // current streaming mode
  const [statistics, setStatistics] = useState({}); // detection statistics
  const [backendInfo, setBackendInfo] = useState(""); // backend information
  const [performanceInfo, setPerformanceInfo] = useState({ avgTime: 0, detectionCount: 0 }); // performance stats
  const [modelDetails, setModelDetails] = useState({ params: 0, layers: 0 }); // model details

  // references
  const imageRef = useRef(null);
  const cameraRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Handle detection statistics
  const handleDetection = (detectedObjects, detectionTime) => {
    setStatistics(prevStats => {
      const newStats = { ...prevStats };
      Object.entries(detectedObjects).forEach(([className, count]) => {
        newStats[className] = (newStats[className] || 0) + count;
      });
      return newStats;
    });

    // Update performance info if detection time is provided
    if (detectionTime !== undefined) {
      setPerformanceInfo(prev => {
        const newCount = prev.detectionCount + 1;
        const newAvgTime = ((prev.avgTime * prev.detectionCount) + detectionTime) / newCount;
        return {
          avgTime: newAvgTime,
          detectionCount: newCount
        };
      });
    }
  };

  // Clear statistics
  const clearStatistics = () => {
    setStatistics({});
    setPerformanceInfo({ avgTime: 0, detectionCount: 0 });
  };

  // Initialize TensorFlow.js with fallback
  const initializeTensorFlow = async () => {
        tf.setBackend("webgpu"); // set backend to webgpu
        await tf.ready();
  };

  // Load model function with error handling
  const loadModel = async (modelName) => {
    try {
      console.log(`📦 Начинаю загрузку модели: ${modelName}`);
      setLoading({ loading: true, progress: 0 });
      
      const modelPath = `${window.location.href}/${modelName}_web_model/model.json`;
      console.log(`📍 Путь к модели: ${modelPath}`);
      
      const yoloModel = await tf.loadGraphModel(
        modelPath,
        {
          onProgress: (fractions) => {
            setLoading({ loading: true, progress: fractions });
            console.log(`⏳ Загрузка ${modelName}: ${(fractions * 100).toFixed(1)}%`);
          },
        }
      );

      console.log(`✅ Модель ${modelName} загружена, тестирую выполнение...`);
      console.log(`📊 Размер входа модели: ${JSON.stringify(yoloModel.inputs[0].shape)}`);
      
      // Безопасный доступ к топологии модели
      let layerCount = 'н/д';
      try {
        if (yoloModel.modelTopology && yoloModel.modelTopology.node_def) {
          layerCount = Object.keys(yoloModel.modelTopology.node_def).length;
        } else if (yoloModel.layers) {
          layerCount = yoloModel.layers.length;
        }
      } catch (e) {
        console.log(`⚠️ Не удалось получить количество слоёв: ${e.message}`);
      }
      
      console.log(`⚙️ Количество слоёв в модели: ${layerCount}`);
      console.log(`🎯 Выходные тензоры: ${yoloModel.outputs.length}`);

      // Попытка получить размер модели
      try {
        const modelSize = yoloModel.getWeights().reduce((total, weight) => total + weight.size, 0);
        console.log(`📦 Приблизительное количество параметров: ${(modelSize / 1000000).toFixed(1)}M`);
        setModelDetails({
          params: (modelSize / 1000000).toFixed(1),
          layers: layerCount
        });
      } catch (e) {
        console.log(`📦 Не удалось посчитать параметры модели: ${e.message}`);
        setModelDetails({ params: 'н/д', layers: layerCount });
      }

      // Test model execution with error handling
      try {
        const dummyInput = tf.ones(yoloModel.inputs[0].shape);
        const warmupResults = yoloModel.execute(dummyInput);
        tf.dispose([warmupResults, dummyInput]);
        
        setLoading({ loading: false, progress: 1 });
        setModel({
          net: yoloModel,
          inputShape: yoloModel.inputs[0].shape,
        });

        console.log(`🎉 Модель ${modelName} успешно загружена и готова к работе с ${tf.getBackend()} backend`);
        setBackendInfo(`${tf.getBackend().toUpperCase()} (модель: ${modelName})`);
      } catch (executionError) {
        console.error('Model execution failed with current backend:', executionError);
        
        // If WebGL execution fails, try switching to CPU
        if (tf.getBackend() === 'webgl') {
          console.log('Switching to CPU backend due to execution error...');
          await tf.setBackend('cpu');
          await tf.ready();
          setBackendInfo(`CPU (${tf.getBackend()}) - WebGL execution failed (модель: ${modelName})`);
          
          // Retry model execution with CPU
          const dummyInput = tf.ones(yoloModel.inputs[0].shape);
          const warmupResults = yoloModel.execute(dummyInput);
          tf.dispose([warmupResults, dummyInput]);
          
          setLoading({ loading: false, progress: 1 });
          setModel({
            net: yoloModel,
            inputShape: yoloModel.inputs[0].shape,
          });
          
          console.log(`Model ${modelName} loaded successfully with CPU backend after WebGL failure`);
        } else {
          throw executionError;
        }
      }
    } catch (error) {
      console.error(`❌ Ошибка загрузки модели ${modelName}:`, error);
      setLoading({ loading: false, progress: 0 });
      
      // User-friendly error message
      let errorMessage = `Ошибка загрузки модели ${modelName}`;
      if (error.message.includes('Failed to link vertex and fragment shaders')) {
        errorMessage += '\n\nПроблема с WebGL на вашей системе. Перезагрузите страницу - будет использован CPU режим.';
      } else if (error.message.includes('404')) {
        errorMessage += '\n\nФайл модели не найден. Проверьте, что модель загружена в папку public.';
      } else {
        errorMessage += `\n\nДетали: ${error.message}`;
      }
      
      alert(errorMessage);
    }
  };

  // Handle model change
  const handleModelChange = (modelName) => {
    if (modelName !== selectedModel && !loading.loading) {
      console.log(`🔄 Переключение модели с ${selectedModel} на ${modelName}`);
      
      // Очищаем canvas перед сменой модели
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      
      setSelectedModel(modelName);
      // Clear statistics when changing model
      clearStatistics();
      // Clear model details
      setModelDetails({ params: 0, layers: 0 });
    }
  };

  // Load initial model
  useEffect(() => {
    initializeTensorFlow().then(() => {
      loadModel(selectedModel);
    }).catch((error) => {
      console.error('TensorFlow initialization failed:', error);
      setLoading({ loading: false, progress: 0 });
      alert('Ошибка инициализации TensorFlow.js. Попробуйте обновить страницу.');
    });
  }, [selectedModel]);

  return (
    <div className="App">
      {loading.loading && <Loader>Загрузка модели {selectedModel}... {(loading.progress * 100).toFixed(2)}%</Loader>}
      
      <div className="main-content">
        <div className="detection-area">
          <div className="content">
            <img
              src="#"
              ref={imageRef}
              onLoad={() => detect(imageRef.current, model, canvasRef.current, () => {}, handleDetection)}
            />
            <video
              autoPlay
              muted
              playsInline
              ref={cameraRef}
              onPlay={() => detectVideo(cameraRef.current, model, canvasRef.current, handleDetection)}
            />
            <video
              autoPlay
              muted
              playsInline
              ref={videoRef}
              onPlay={() => detectVideo(videoRef.current, model, canvasRef.current, handleDetection)}
            />
              <canvas width={model.inputShape[1]} height={model.inputShape[2]} ref={canvasRef} />
          </div>
          
          <VideoControls 
            videoRef={videoRef} 
            isVideoPlaying={streaming === "video"} 
          />
        </div>

        <div className="sidebar">
          <ModelSelector 
            selectedModel={selectedModel}
            onModelChange={handleModelChange}
            isLoading={loading.loading}
          />
          
          <Statistics 
            statistics={statistics} 
            onClearStats={clearStatistics} 
          />
          
          {backendInfo && (
            <div className="backend-info">
              <small>Backend: {backendInfo}</small>
            </div>
          )}
          
          <div className="model-info">
            <h4>Активная модель: {selectedModel}</h4>
            <small>Размер входа: {model.inputShape ? `${model.inputShape[1]}×${model.inputShape[2]}` : 'загрузка...'} пикселей (фиксированный)</small>
            {modelDetails.params && (
              <div>
                <small>Параметры: {modelDetails.params}M</small>
                <br />
                <small>Слои: {modelDetails.layers}</small>
              </div>
            )}
            {performanceInfo.detectionCount > 0 && (
              <div>
                <small>Среднее время детекции: {performanceInfo.avgTime.toFixed(1)}мс</small>
              </div>
            )}
          </div>
        </div>
      </div>

      <ButtonHandler 
        imageRef={imageRef} 
        cameraRef={cameraRef} 
        videoRef={videoRef}
        streaming={streaming}
        setStreaming={setStreaming}
      />
    </div>
  );
};

export default App;