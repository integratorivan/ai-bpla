import React from "react";
import "../style/loader.css";

const Loader = ({ children }) => {
  return (
    <div className="loader-container">
      <div className="loader-content">
        <div className="loader-grid">
          <div className="loader-box active"></div>
          <div className="loader-box"></div>
          <div className="loader-box"></div>
          <div className="loader-box active"></div>
          <div className="loader-box"></div>
          <div className="loader-box active"></div>
          <div className="loader-box"></div>
          <div className="loader-box active"></div>
          <div className="loader-box"></div>
        </div>
        
        <div className="loader-text">
          <div className="loader-cursor">█</div>
          {children}
        </div>
        
        <div className="loader-progress">
          <div className="progress-bar-loader">
            <div className="progress-fill-loader"></div>
          </div>
          <div className="loader-status">
            [NEURAL_NETWORK_INITIALIZATION]
          </div>
        </div>
      </div>
      
      <div className="scanner-overlay">
        <div className="scan-line"></div>
      </div>
    </div>
  );
};

export default Loader;
