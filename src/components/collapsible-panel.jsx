import React, { useState, useEffect } from "react";

const CollapsiblePanel = ({ title, children, defaultExpanded = false, icon = "⌄" }) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!isMobile) {
    // На десктопе просто возвращаем детей без обертки
    return <>{children}</>;
  }

  return (
    <div className="collapsible-panel">
      <div 
        className={`panel-header ${isExpanded ? 'active' : ''}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="panel-title">{title}</span>
        <span className={`panel-toggle ${isExpanded ? 'expanded' : ''}`}>
          {icon}
        </span>
      </div>
      <div className={`panel-content ${isExpanded ? 'expanded' : ''}`}>
        {children}
      </div>
    </div>
  );
};

export default CollapsiblePanel; 