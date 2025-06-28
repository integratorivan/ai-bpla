import React from "react";
import labels from "../utils/labels.json";
import "../style/statistics.css";

const Statistics = ({ statistics, onClearStats }) => {
  const totalObjects = Object.values(statistics).reduce((sum, count) => sum + count, 0);
  const sortedStats = Object.entries(statistics)
    .filter(([label, count]) => count > 0)
    .sort(([, a], [, b]) => b - a);

  return (
    <div className="statistics-panel">
      <div className="stats-header">
        <h3>📊 Статистика сессии</h3>
        <div className="stats-total">
          Всего объектов: <span className="total-count">{totalObjects}</span>
        </div>
        <button className="clear-stats-btn" onClick={onClearStats}>
          Очистить статистику
        </button>
      </div>
      
      <div className="stats-content">
        {sortedStats.length === 0 ? (
          <div className="no-stats">Объекты еще не обнаружены</div>
        ) : (
          <div className="stats-list">
            {sortedStats.map(([label, count]) => (
              <div key={label} className="stat-item">
                <span className="stat-label">{labels[label] || label}</span>
                <span className="stat-count">{count}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Statistics; 