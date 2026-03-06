import React, { createContext, useState, useEffect, useRef } from 'react';

export const StudyTimerContext = createContext();

export const StudyTimerProvider = ({ children }) => {
  const [isTimerOpen, setIsTimerOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [onAfterSave, setOnAfterSave] = useState(null);
  const [minimized, setMinimized] = useState(false);
  const [timer, setTimer] = useState(() => {
    const saved = localStorage.getItem('study-timer');
    return saved ? JSON.parse(saved) : {
      running: false,
      seconds: 0,
      preset: null,
      mode: 'cronometro',
      inputSeconds: 0
    };
  });
  const intervalRef = useRef(null);
  const startedAtRef = useRef(null); // Date.now() quando começou a rodar
  const baseSecondsRef = useRef(0);  // segundos acumulados antes de pausar

  useEffect(() => {
    localStorage.setItem('study-timer', JSON.stringify(timer));
  }, [timer]);

  useEffect(() => {
    if (timer.running) {
      if (timer.mode === 'cronometro') {
        // Inicializa refs ao começar a rodar
        if (!startedAtRef.current) {
          startedAtRef.current = Date.now();
          baseSecondsRef.current = timer.seconds;
        }
        intervalRef.current = setInterval(() => {
          setTimer(prev => ({
            ...prev,
            seconds: baseSecondsRef.current + Math.floor((Date.now() - startedAtRef.current) / 1000)
          }));
        }, 500);
      } else if (timer.mode === 'timer') {
        // Timer countdown: ainda usa ticks (contagem regressiva)
        intervalRef.current = setInterval(() => {
          setTimer(prev => {
            if (prev.seconds > 0) {
              return { ...prev, seconds: prev.seconds - 1 };
            }
            return { ...prev, running: false };
          });
        }, 1000);
      }
    } else {
      // Parou: limpa refs para o próximo start
      startedAtRef.current = null;
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [timer.running, timer.mode]);

  const openTimer = () => { setIsTimerOpen(true); setMinimized(false); };
  const closeTimer = () => setIsTimerOpen(false);
  const minimizeTimer = () => setMinimized(true);
  const restoreTimer = () => setMinimized(false);
  const openForm = () => { setEditData(null); setOnAfterSave(null); setIsFormOpen(true); };
  const closeForm = () => { setIsFormOpen(false); setEditData(null); setOnAfterSave(null); };
  const openFormWithEdit = (data, afterSave) => { setEditData(data); setOnAfterSave(() => afterSave || null); setIsFormOpen(true); };

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
      isFormOpen, openForm, closeForm, openFormWithEdit, editData, onAfterSave,
      timer, setTimer,
      startTimer, pauseTimer, resumeTimer, stopTimer, resetTimer,
      setMode, setInputSeconds
    }}>
      {children}
    </StudyTimerContext.Provider>
  );
};
