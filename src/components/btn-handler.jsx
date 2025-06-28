import { useRef } from "react";
import { Webcam } from "../utils/webcam";

const ButtonHandler = ({ imageRef, cameraRef, videoRef, streaming, setStreaming }) => {
  const inputImageRef = useRef(null); // image input reference
  const inputVideoRef = useRef(null); // video input reference
  const webcam = new Webcam(); // webcam handler

  // closing image
  const closeImage = () => {
    const url = imageRef.current.src;
    imageRef.current.src = "#"; // restore image source
    URL.revokeObjectURL(url); // revoke url

    setStreaming(null); // set streaming to null
    inputImageRef.current.value = ""; // reset input image
    imageRef.current.style.display = "none"; // hide image
  };

  // closing video streaming
  const closeVideo = () => {
    const url = videoRef.current.src;
    videoRef.current.src = ""; // restore video source
    URL.revokeObjectURL(url); // revoke url

    setStreaming(null); // set streaming to null
    inputVideoRef.current.value = ""; // reset input video
    videoRef.current.style.display = "none"; // hide video
  };

  // closing camera streaming
  const closeCamera = () => {
    webcam.close(cameraRef.current);
    cameraRef.current.style.display = "none";
    setStreaming(null);
  };

  const handleImageUpload = (e) => {
    if (streaming === "video") closeVideo();
    if (streaming === "camera") closeCamera();
    
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      imageRef.current.src = url;
      imageRef.current.style.display = "block";
      setStreaming("image");
    }
  };

  const handleVideoUpload = (e) => {
    if (streaming === "image") closeImage();
    if (streaming === "camera") closeCamera();
    
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      videoRef.current.src = url;
      videoRef.current.addEventListener("ended", () => closeVideo());
      videoRef.current.style.display = "block";
      setStreaming("video");
    }
  };

  const handleCameraToggle = () => {
    if (streaming === "camera") {
      closeCamera();
    } else {
      if (streaming === "image") closeImage();
      if (streaming === "video") closeVideo();
      
      webcam.open(cameraRef.current);
      cameraRef.current.style.display = "block";
      setStreaming("camera");
    }
  };

  return (
    <div className="control-panel">
      <div className="btn-container">
        <div className="input-group">
          <input
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleImageUpload}
            ref={inputImageRef}
          />
          <button
            className={`control-btn ${streaming === "image" ? "active" : ""}`}
            onClick={() => {
              if (streaming === "image") {
                closeImage();
              } else {
                inputImageRef.current.click();
              }
            }}
          >
            <span className="btn-icon">🖼️</span>
            <span className="btn-text">
              {streaming === "image" ? "Закрыть" : "Загрузить"} изображение
            </span>
          </button>
        </div>

        <div className="input-group">
          <input
            type="file"
            accept="video/*"
            style={{ display: "none" }}
            onChange={handleVideoUpload}
            ref={inputVideoRef}
          />
          <button
            className={`control-btn ${streaming === "video" ? "active" : ""}`}
            onClick={() => {
              if (streaming === "video") {
                closeVideo();
              } else {
                inputVideoRef.current.click();
              }
            }}
          >
            <span className="btn-icon">🎥</span>
            <span className="btn-text">
              {streaming === "video" ? "Закрыть" : "Загрузить"} видео
            </span>
          </button>
        </div>

        <div className="input-group">
          <button
            className={`control-btn ${streaming === "camera" ? "active" : ""}`}
            onClick={handleCameraToggle}
          >
            <span className="btn-icon">📷</span>
            <span className="btn-text">
              {streaming === "camera" ? "Выключить" : "Включить"} камеру
            </span>
          </button>
        </div>
      </div>

      {streaming && (
        <div className="status-indicator">
          <div className="status-dot"></div>
          <span className="status-text">
            Активно: {streaming === "image" ? "изображение" : 
                     streaming === "video" ? "видео" : "камера"}
          </span>
        </div>
      )}
    </div>
  );
};

export default ButtonHandler;
