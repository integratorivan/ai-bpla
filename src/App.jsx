import React, { useState, useEffect, useRef } from "react";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl"; // set backend to webgl
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
  const [sidebarVisible, setSidebarVisible] = useState(false); // sidebar visibility for mobile

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
  const handleModelChange = (newModel) => {
    if (newModel !== selectedModel && !loading.loading) {
      setSelectedModel(newModel);
      setLoading({ loading: true, progress: 0 });
      clearStatistics(); // Clear stats when changing model
      loadModel(newModel);
    }
  };

  // Determine current streaming mode
  const getCurrentStreamingMode = () => {
    if (imageRef.current?.style.display === "block") return "image";
    if (videoRef.current?.style.display === "block") return "video";
    if (cameraRef.current?.style.display === "block") return "camera";
    return null;
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

  // Update streaming state when components mount/unmount
  useEffect(() => {
    const interval = setInterval(() => {
      setStreaming(getCurrentStreamingMode());
    }, 100);

    return () => clearInterval(interval);
  }, []);


  return (
    <div className="App">
      {loading.loading && <Loader>Загрузка модели {selectedModel}... {(loading.progress * 100).toFixed(2)}%</Loader>}
      
      <div className="main-layout">
        {/* Левая область - видео */}
        <div className="video-area">
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

        {/* Правая область - контролы */}
        <div className="control-area">
          {/* Выбор модели вверху */}
          <ModelSelector 
            selectedModel={selectedModel}
            onModelChange={handleModelChange}
            isLoading={loading.loading}
          />
          
          {/* Контролы */}
          <ButtonHandler
            imageRef={imageRef}
            cameraRef={cameraRef}
            videoRef={videoRef}
            streaming={streaming}
            setStreaming={setStreaming}
          />
          
          {/* Компактная статистика */}
          <Statistics 
            statistics={statistics} 
            onClearStats={clearStatistics} 
          />
        </div>
      </div>
    </div>
  );
};

export default App;