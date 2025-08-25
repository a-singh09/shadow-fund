import React from "react";

const ConstellationEffect = () => {
  return (
    <div className="constellation-container absolute inset-0 pointer-events-none">
      {/* Constellation Lines SVG */}
      <svg className="constellation-svg absolute inset-0 w-full h-full">
        {/* Line from top-left to top-right */}
        <line
          x1="2.5rem"
          y1="5rem"
          x2="calc(100% - 5rem)"
          y2="10rem"
          stroke="rgba(239, 68, 68, 0.4)"
          strokeWidth="1"
          className="constellation-line"
          style={{ animationDelay: "0.1s" }}
        />
        {/* Line from top-right to bottom-right */}
        <line
          x1="calc(100% - 5rem)"
          y1="10rem"
          x2="calc(100% - 2.5rem)"
          y2="calc(100% - 5rem)"
          stroke="rgba(239, 68, 68, 0.4)"
          strokeWidth="1"
          className="constellation-line"
          style={{ animationDelay: "0.2s" }}
        />
        {/* Line from bottom-right to bottom-left */}
        <line
          x1="calc(100% - 2.5rem)"
          y1="calc(100% - 5rem)"
          x2="5rem"
          y2="calc(100% - 10rem)"
          stroke="rgba(239, 68, 68, 0.4)"
          strokeWidth="1"
          className="constellation-line"
          style={{ animationDelay: "0.3s" }}
        />
        {/* Line from bottom-left to top-left */}
        <line
          x1="5rem"
          y1="calc(100% - 10rem)"
          x2="2.5rem"
          y2="5rem"
          stroke="rgba(239, 68, 68, 0.4)"
          strokeWidth="1"
          className="constellation-line"
          style={{ animationDelay: "0.4s" }}
        />
        {/* Diagonal cross lines */}
        <line
          x1="2.5rem"
          y1="5rem"
          x2="calc(100% - 2.5rem)"
          y2="calc(100% - 5rem)"
          stroke="rgba(239, 68, 68, 0.2)"
          strokeWidth="1"
          className="constellation-line"
          style={{ animationDelay: "0.5s" }}
        />
        <line
          x1="calc(100% - 5rem)"
          y1="10rem"
          x2="5rem"
          y2="calc(100% - 10rem)"
          stroke="rgba(239, 68, 68, 0.2)"
          strokeWidth="1"
          className="constellation-line"
          style={{ animationDelay: "0.6s" }}
        />
      </svg>

      {/* Constellation Points */}
      <div
        className="constellation-point absolute top-20 left-10 w-4 h-4 bg-red-400/30 rounded-full"
        style={{ animationDelay: "0s" }}
      />
      <div
        className="constellation-point absolute top-40 right-20 w-6 h-6 bg-red-500/20 rounded-full"
        style={{ animationDelay: "1s" }}
      />
      <div
        className="constellation-point absolute bottom-40 left-20 w-3 h-3 bg-red-300/40 rounded-full"
        style={{ animationDelay: "2s" }}
      />
      <div
        className="constellation-point absolute bottom-20 right-10 w-5 h-5 bg-red-400/25 rounded-full"
        style={{ animationDelay: "1.5s" }}
      />
    </div>
  );
};

export default ConstellationEffect;
