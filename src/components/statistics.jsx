import React from "react";
import labels from "../utils/labels.json";
import "../style/statistics.css";

const Statistics = ({ statistics, onClearStats, trackingStats = null }) => {
  const totalObjects = Object.values(statistics).reduce((sum, count) => sum + count, 0);
  const sortedStats = Object.entries(statistics)
    .filter(([label, count]) => count > 0)
    .sort(([, a], [, b]) => b - a);

  return (
    <div className="statistics-panel">
      <div className="stats-header">
        <div className="stats-total">
          {trackingStats ? (
            <div className="tracking-summary">
              <div className="stat-row">
                <span>Всего уникальных:</span>
                <span className="total-count">{trackingStats.totalUnique || 0}</span>
              </div>
              <div className="stat-row">
                <span>Активных треков:</span>
                <span className="active-count">{trackingStats.activeTracks || 0}</span>
              </div>
            </div>
          ) : (
            <div>
              Всего: <span className="total-count">{totalObjects}</span>
            </div>
          )}
        </div>
        <button className="clear-stats-btn" onClick={onClearStats}>
          Очистить
        </button>
      </div>
      
      <div className="stats-content">
        {sortedStats.length === 0 ? (
          <div className="no-stats">
            {trackingStats ? "Уникальные объекты не обнаружены" : "Объекты не обнаружены"}
          </div>
        ) : (
          <div className="stats-list">
            {trackingStats && (
              <div className="tracking-mode-indicator">
                🎯 Режим трекинга активен
              </div>
            )}
            {sortedStats.map(([label, count]) => (
              <div key={label} className="stat-item">
                <span className="stat-label">{labels[label] || label}</span>
                <span className="stat-count">
                  {trackingStats ? `${count} уникальных` : count}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Statistics; 