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
  const [streaming, setStreaming] = useState(null); // current streaming mode - централизованное состояние
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

  return (
    <div className="App">
      {loading.loading && <Loader>Загрузка модели... {(loading.progress * 100).toFixed(2)}%</Loader>}
      
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
          <Statistics 
            statistics={statistics} 
            onClearStats={clearStatistics} 
          />
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
