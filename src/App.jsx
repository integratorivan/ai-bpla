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

  // references
  const imageRef = useRef(null);
  const cameraRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Handle detection statistics
  const handleDetection = (detectedObjects) => {
    setStatistics(prevStats => {
      const newStats = { ...prevStats };
      Object.entries(detectedObjects).forEach(([className, count]) => {
        newStats[className] = (newStats[className] || 0) + count;
      });
      return newStats;
    });
  };

  // Clear statistics
  const clearStatistics = () => {
    setStatistics({});
  };

  // Initialize TensorFlow.js with fallback
  const initializeTensorFlow = async () => {
        tf.setBackend("webgpu"); // set backend to webgpu
        await tf.ready();
  };

  // Load model function with error handling
  const loadModel = async (modelName) => {
    try {
      setLoading({ loading: true, progress: 0 });
      
      const yoloModel = await tf.loadGraphModel(
        `${window.location.href}/${modelName}_web_model/model.json`,
        {
          onProgress: (fractions) => {
            setLoading({ loading: true, progress: fractions });
          },
        }
      );

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

        console.log(`Model ${modelName} loaded successfully with ${tf.getBackend()} backend`);
      } catch (executionError) {
        console.error('Model execution failed with current backend:', executionError);
        
        // If WebGL execution fails, try switching to CPU
        if (tf.getBackend() === 'webgl') {
          console.log('Switching to CPU backend due to execution error...');
          await tf.setBackend('cpu');
          await tf.ready();
          setBackendInfo(`CPU (${tf.getBackend()}) - WebGL execution failed`);
          
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
      console.error("Ошибка загрузки модели:", error);
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
      setSelectedModel(modelName);
      // Clear statistics when changing model
      clearStatistics();
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
