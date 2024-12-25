'use client';
import React from 'react';

interface SunriseSunset {
  sunrise: Date;
  sunset: Date;
  sunriseHours: number;
  sunsetHours: number;
}

const TimelineVisualization = React.memo(function TimelineVisualization({ 
    currentTime, 
    sunriseSunset 
  }: { 
    currentTime: Date;
    sunriseSunset: SunriseSunset | null;
  }) {
    if (!sunriseSunset) return null;

    const SVG_WIDTH = 800;
    const SVG_HEIGHT = 100;
    const TIMELINE_Y = SVG_HEIGHT / 2;
    
    const { sunriseHours, sunsetHours } = sunriseSunset;
    const currentHours = currentTime.getHours() + currentTime.getMinutes() / 60;

    // Convert hour positions to SVG coordinates
    const getTimelineX = (hour: number) => (hour / 24) * SVG_WIDTH;
    
    // Calculate stretched position for visualization
    const getStretchedX = (hour: number) => {
      if (hour >= sunriseHours && hour < sunsetHours) {
        // Daylight hours are stretched
        const dayProgress = (hour - sunriseHours) / (sunsetHours - sunriseHours);
        return getTimelineX(sunriseHours) + dayProgress * (getTimelineX(sunsetHours) - getTimelineX(sunriseHours));
      } else if (hour >= sunsetHours) {
        // Night hours after sunset
        const nightProgress = (hour - sunsetHours) / (24 - sunsetHours + sunriseHours);
        return getTimelineX(sunsetHours) + nightProgress * (SVG_WIDTH - getTimelineX(sunsetHours));
      } else {
        // Night hours before sunrise
        const nightProgress = hour / sunriseHours;
        return nightProgress * getTimelineX(sunriseHours);
      }
    };

    return (
      <svg 
        width={SVG_WIDTH} 
        height={SVG_HEIGHT} 
        className="w-full"
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Background layers */}
        <rect x="0" y="0" width={SVG_WIDTH} height={SVG_HEIGHT} fill="#1a1a1a" />
        
        {/* Day/Night sections */}
        <rect 
          x={getTimelineX(sunriseHours)} 
          y="0"
          width={getTimelineX(sunsetHours - sunriseHours)} 
          height={SVG_HEIGHT}
          fill="#2c5282"
          opacity="0.3"
        />

        {/* Main timeline */}
        <line
          x1="0"
          y1={TIMELINE_Y}
          x2={SVG_WIDTH}
          y2={TIMELINE_Y}
          stroke="#4a5568"
          strokeWidth="2"
        />

        {/* Hour markers */}
        {Array.from({ length: 25 }, (_, i) => (
          <g key={i}>
            <line
              x1={getTimelineX(i)}
              y1={TIMELINE_Y - 10}
              x2={getTimelineX(i)}
              y2={TIMELINE_Y + 10}
              stroke="#4a5568"
              strokeWidth="1"
            />
            <text
              x={getTimelineX(i)}
              y={TIMELINE_Y + 25}
              textAnchor="middle"
              fill="#718096"
              fontSize="12"
            >
              {i % 24}
            </text>
          </g>
        ))}

        {/* Sunrise marker */}
        <g transform={`translate(${getTimelineX(sunriseHours)}, ${TIMELINE_Y})`}>
          <circle r="4" fill="#f6e05e" />
          <text y="-15" textAnchor="middle" fill="#f6e05e" fontSize="12">
            Sunrise
          </text>
        </g>

        {/* Sunset marker */}
        <g transform={`translate(${getTimelineX(sunsetHours)}, ${TIMELINE_Y})`}>
          <circle r="4" fill="#ed8936" />
          <text y="-15" textAnchor="middle" fill="#ed8936" fontSize="12">
            Sunset
          </text>
        </g>

        {/* Current time marker - actual */}
        <g transform={`translate(${getTimelineX(currentHours)}, ${TIMELINE_Y - 20})`}>
          <path 
            d="M 0,-8 L 4,0 L -4,0 Z" 
            fill="#68d391"
          />
          <text y="-12" textAnchor="middle" fill="#68d391" fontSize="12">
            Actual
          </text>
        </g>

        {/* Current time marker - stretched */}
        <g transform={`translate(${getStretchedX(currentHours)}, ${TIMELINE_Y + 20})`}>
          <path 
            d="M 0,8 L 4,0 L -4,0 Z" 
            fill="#9f7aea"
          />
          <text y="24" textAnchor="middle" fill="#9f7aea" fontSize="12">
            Stretched
          </text>
        </g>

        {/* Connection line between actual and stretched time */}
        <line
          x1={getTimelineX(currentHours)}
          y1={TIMELINE_Y - 15}
          x2={getStretchedX(currentHours)}
          y2={TIMELINE_Y + 15}
          stroke="#9f7aea"
          strokeWidth="1"
          strokeDasharray="4 2"
        />
      </svg>
    );
});

export default TimelineVisualization;