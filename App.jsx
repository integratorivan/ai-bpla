import React, { useState, useEffect, useRef } from "react";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl"; // set backend to webgl
import Loader from "./components/loader";
import ButtonHandler from "./components/btn-handler";
import Statistics from "./components/statistics";
import VideoControls from "./components/video-controls";
import { detect, detectVideo } from "./utils/detect";
import "./style/App.css";

const App = () => {
  const [loading, setLoading] = useState({ loading: true, progress: 0 }); // loading state
  const [model, setModel] = useState({
    net: null,
    inputShape: [1, 0, 0, 3],
  }); // init model & input shape
  const [streaming, setStreaming] = useState(null); // current streaming mode
  const [statistics, setStatistics] = useState({}); // detection statistics

  // references
  const imageRef = useRef(null);
  const cameraRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // model configs
  const modelName = "yolov8n";

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

  // Determine current streaming mode
  const getCurrentStreamingMode = () => {
    if (imageRef.current?.style.display === "block") return "image";
    if (videoRef.current?.style.display === "block") return "video";
    if (cameraRef.current?.style.display === "block") return "camera";
    return null;
  };

  useEffect(() => {
    tf.ready().then(async () => {
      const yolov8 = await tf.loadGraphModel(
        `${window.location.href}/${modelName}_web_model/model.json`,
        {
          onProgress: (fractions) => {
            setLoading({ loading: true, progress: fractions }); // set loading fractions
          },
        }
      ); // load model

      // warming up model
      const dummyInput = tf.ones(yolov8.inputs[0].shape);
      const warmupResults = yolov8.execute(dummyInput);

      setLoading({ loading: false, progress: 1 });
      setModel({
        net: yolov8,
        inputShape: yolov8.inputs[0].shape,
      }); // set model & input shape

      tf.dispose([warmupResults, dummyInput]); // cleanup memory
    });
  }, []);

  // Update streaming state when components mount/unmount
  useEffect(() => {
    const interval = setInterval(() => {
      setStreaming(getCurrentStreamingMode());
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="App">
      {loading.loading && (
        <div className="loading-overlay">
          <Loader>ЗАГРУЗКА НЕЙРОСЕТИ... {(loading.progress * 100).toFixed(2)}%</Loader>
        </div>
      )}
      
      <div className="header">
        <div className="scanner-line"></div>
        <h1>YOLO СИСТЕМА ДЕТЕКЦИИ ОБЪЕКТОВ</h1>
        <p>
          НЕЙРОСЕТЬ РЕАЛЬНОГО ВРЕМЕНИ НА БАЗЕ <code className="code">TENSORFLOW.JS</code>
        </p>
        <p>
          АКТИВНАЯ МОДЕЛЬ: <code className="code">{modelName.toUpperCase()}</code>
        </p>
      </div>

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
          
          {streaming === "video" && (
            <VideoControls 
              videoRef={videoRef}
              onTimeUpdate={() => {}}
            />
          )}
        </div>

        <div className="sidebar">
          <div className="control-panel">
            <ButtonHandler
              imageRef={imageRef}
              cameraRef={cameraRef}
              videoRef={videoRef}
              streaming={streaming}
            />
            
            <div className="status-indicator">
              <div className="status-dot"></div>
              <span className="status-text">
                {streaming ? `MODE: ${streaming.toUpperCase()}` : 'STANDBY'}
              </span>
            </div>
          </div>

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