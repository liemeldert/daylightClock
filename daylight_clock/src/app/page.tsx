'use client';
import React, { useState, useEffect } from 'react';
import TimelineVisualization from './components/TimelineVisualization';

const StretchedClock = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stretchedTime, setStretchedTime] = useState('');
  const [period, setPeriod] = useState('');
  
  interface SunriseSunset {
    sunrise: Date;
    sunset: Date;
    sunriseHours: number;
    sunsetHours: number;
  }
  
  const [sunriseSunset, setSunriseSunset] = useState<SunriseSunset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const createDefaultTimes = (): SunriseSunset => {
      const defaultSunrise = new Date();
      defaultSunrise.setHours(7, 0, 0);
      
      const defaultSunset = new Date();
      defaultSunset.setHours(19, 0, 0);
      
      return {
        sunrise: defaultSunrise,
        sunset: defaultSunset,
        sunriseHours: 7,
        sunsetHours: 19
      };
    };
    const getSunriseSunset = async (latitude: number, longitude: number) => {
      try {
        const response = await fetch(
          `https://api.sunrise-sunset.org/json?lat=${latitude}&lng=${longitude}&formatted=0`
        );
        const data = await response.json();
        if (data.status === 'OK') {
          // Convert UTC times to local times
          const sunrise = new Date(data.results.sunrise);
          const sunset = new Date(data.results.sunset);
          setSunriseSunset({
            sunrise,
            sunset,
            sunriseHours: sunrise.getHours() + sunrise.getMinutes() / 60,
            sunsetHours: sunset.getHours() + sunset.getMinutes() / 60
          });
        } else {
          throw new Error('Failed to fetch sunrise/sunset data');
        }
      } catch {
        setError('Failed to load sunrise/sunset times. Using default 7AM/7PM.');
        setSunriseSunset(createDefaultTimes());
      } finally {
        setLoading(false);
      }
    };

    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          getSunriseSunset(position.coords.latitude, position.coords.longitude);
        },
        () => {
          setError('Location access denied. Using default 7AM/7PM.');
          setSunriseSunset(createDefaultTimes());
          setLoading(false);  
        }
      );
    } else {
      setError('Geolocation not supported. Using default 7AM/7PM.');
      setSunriseSunset(createDefaultTimes());
      setLoading(false);
    }
  }, []);

  const calculateStretchedTime = React.useCallback((date: Date) => {
      if (!sunriseSunset) return { time: '--:--:--', period: '--', type: 'Loading' };
  
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const seconds = date.getSeconds();
      const decimalTime = hours + minutes / 60 + seconds / 3600;
  
      const { sunriseHours, sunsetHours } = sunriseSunset;
      const DAYLIGHT_HOURS = sunsetHours - sunriseHours;
  
      let stretchedHours;
      let timeLabel;
  
      if (decimalTime >= sunriseHours && decimalTime < sunsetHours) {
        // During daylight hours - stretch time
        const progressThroughDay = (decimalTime - sunriseHours) / DAYLIGHT_HOURS;
        stretchedHours = sunriseHours + (progressThroughDay * 12);
        timeLabel = 'Daylight';
      } else {
        // During night hours - compress time
        if (decimalTime >= sunsetHours) {
          const progressThroughNight = (decimalTime - sunsetHours) / (24 - sunsetHours + sunriseHours);
          stretchedHours = sunsetHours + (progressThroughNight * 12);
        } else {
          const progressThroughNight = decimalTime / sunriseHours;
          stretchedHours = sunsetHours + (progressThroughNight * 12);
        }
        timeLabel = 'Night';
      }
  
      const stretchedHoursFloor = Math.floor(stretchedHours);
      const stretchedMinutes = Math.floor((stretchedHours - stretchedHoursFloor) * 60);
      const stretchedSeconds = Math.floor(((stretchedHours - stretchedHoursFloor) * 60 - stretchedMinutes) * 60);
  
      return {
        time: `${String(stretchedHoursFloor % 12 || 12).padStart(2, '0')}:${String(stretchedMinutes).padStart(2, '0')}:${String(stretchedSeconds).padStart(2, '0')}`,
        period: stretchedHours >= 12 ? 'PM' : 'AM',
        type: timeLabel
      };
    }, [sunriseSunset]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      const stretched = calculateStretchedTime(now);
      setStretchedTime(stretched.time);
      setPeriod(stretched.period);
    }, 1000);

    return () => clearInterval(timer);
  }, [calculateStretchedTime, sunriseSunset]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading sunrise and sunset times...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center p-8 bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4">
        <h1 className="text-4xl font-bold text-white mb-8">Daylight Clock</h1>
        
        {error && (
          <div className="bg-red-900/50 text-red-200 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="bg-gray-700 p-6 rounded-lg">
            <h2 className="text-xl text-gray-300 mb-2">Actual Time</h2>
            <p className="text-5xl font-mono text-white">
              {currentTime.toLocaleTimeString()}
            </p>
          </div>
          
          <div className="bg-gray-700 p-6 rounded-lg">
            <h2 className="text-xl text-gray-300 mb-2">Stretched Time</h2>
            <p className="text-5xl font-mono text-white">
              {stretchedTime} {period}
            </p>
          </div>

        <div className="bg-gray-700 p-6 rounded-lg">
            <h2 className="text-xl text-gray-300 mb-2">Time Distortion</h2>
            <div className="mt-4">
              <TimelineVisualization 
                currentTime={currentTime}
                sunriseSunset={sunriseSunset}
              />
            </div>
            <div className="mt-4 text-sm text-gray-400 space-y-1">
              <p>Green marker: Actual time</p>
              <p>Purple marker: Stretched time</p>
              <p>Yellow dots: Sunrise/Sunset boundaries</p>
            </div>
          </div>
        </div>
        
        <div className="mt-8 text-gray-400">
          <p>Sunrise: {sunriseSunset?.sunrise.toLocaleTimeString()}</p>
          <p>Sunset: {sunriseSunset?.sunset.toLocaleTimeString()}</p>
          <p className="mt-2 text-sm">
            Time is stretched during daylight hours and compressed during night hours
          </p>
        </div>
      </div>
    </div>
  );
};

export default StretchedClock;