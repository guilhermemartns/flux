import React, { createContext, useState, useEffect, useRef } from 'react';

export const StudyTimerContext = createContext();

export const StudyTimerProvider = ({ children }) => {
  const [isTimerOpen, setIsTimerOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [timer, setTimer] = useState(() => {
    const saved = localStorage.getItem('study-timer');
    return saved ? JSON.parse(saved) : {
      running: false,
      seconds: 0,
      preset: null,
      mode: 'cronometro', // 'cronometro' ou 'timer'
      inputSeconds: 0 // usado para timer
    };
  });
  const intervalRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('study-timer', JSON.stringify(timer));
  }, [timer]);

  useEffect(() => {
    if (timer.running) {
      intervalRef.current = setInterval(() => {
        setTimer(prev => {
          if (prev.mode === 'cronometro') {
            return { ...prev, seconds: prev.seconds + 1 };
          } else if (prev.mode === 'timer') {
            if (prev.seconds > 0) {
              return { ...prev, seconds: prev.seconds - 1 };
            } else {
              // Timer chegou a zero
              return { ...prev, running: false };
            }
          }
          return prev;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [timer.running, timer.mode]);

  const openTimer = () => { setIsTimerOpen(true); setMinimized(false); };
  const closeTimer = () => setIsTimerOpen(false);
  const minimizeTimer = () => setMinimized(true);
  const restoreTimer = () => setMinimized(false);
  const openForm = () => setIsFormOpen(true);
  const closeForm = () => setIsFormOpen(false);

  const startTimer = (mode = 'cronometro', inputSeconds = 0) => {
    if (mode === 'timer') {
      setTimer({ running: true, seconds: inputSeconds, preset: null, mode, inputSeconds });
    } else {
      setTimer({ running: true, seconds: 0, preset: null, mode, inputSeconds: 0 });
    }
  };
  const pauseTimer = () => setTimer(prev => ({ ...prev, running: false }));
  const resumeTimer = () => setTimer(prev => ({ ...prev, running: true }));
  const stopTimer = () => setTimer(prev => ({ ...prev, running: false }));
  const resetTimer = () => setTimer({ running: false, seconds: 0, preset: null, mode: 'cronometro', inputSeconds: 0 });

  const setMode = (mode) => setTimer(prev => ({ ...prev, mode }));
  const setInputSeconds = (inputSeconds) => setTimer(prev => ({ ...prev, inputSeconds }));

  return (
    <StudyTimerContext.Provider value={{
      isTimerOpen, openTimer, closeTimer, minimized, minimizeTimer, restoreTimer,
      isFormOpen, openForm, closeForm,
      timer, setTimer,
      startTimer, pauseTimer, resumeTimer, stopTimer, resetTimer,
      setMode, setInputSeconds
    }}>
      {children}
    </StudyTimerContext.Provider>
  );
};
