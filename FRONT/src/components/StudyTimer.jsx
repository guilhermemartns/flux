import React, { useState, useEffect, useRef, useContext } from 'react';
import { createPortal } from 'react-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faPause, faStop, faClock, faBookOpen, faCalendarCheck, faCircle, faCheckCircle, faPlayCircle, faRotateRight, faExpand, faCompress } from '@fortawesome/free-solid-svg-icons';
import { motion, AnimatePresence } from 'framer-motion';
import { StudyTimerContext } from './StudyTimerContext';

const StudyTimer = () => {
  const [time, setTime] = useState(0); // tempo em segundos
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [pausedTime, setPausedTime] = useState(0); // tempo pausado em segundos
  const [pauseStartTime, setPauseStartTime] = useState(null); // quando iniciou a pausa
  const [todayStudyTime, setTodayStudyTime] = useState(0);
  const [isMaximized, setIsMaximized] = useState(false);
  const [showMaximized, setShowMaximized] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const intervalRef = useRef(null);
  const pauseIntervalRef = useRef(null);
  
  // Contexto para abrir o modal de registro
  const { openForm, setTimer } = useContext(StudyTimerContext);

  // Carrega tempo estudado hoje e estado do timer
  useEffect(() => {
    const today = new Date().toDateString();
    const studyData = JSON.parse(localStorage.getItem('studyTime') || '{}');
    setTodayStudyTime(studyData[today] || 0);
    
    // Restaurar estado do timer
    const timerState = JSON.parse(localStorage.getItem('timerState') || '{}');
    if (timerState.isRunning) {
      const elapsed = Math.floor((Date.now() - timerState.startTime) / 1000);
      setTime(elapsed);
      setIsRunning(true);
      setIsPaused(false);
    } else if (timerState.isPaused) {
      setTime(timerState.time || 0);
      setIsRunning(true);
      setIsPaused(true);
      setPausedTime(timerState.pausedTime || 0);
      setPauseStartTime(timerState.pauseStartTime || null);
    }
  }, []);

  // Formato do tempo para exibição
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    // Sempre mostra formato de horas completo (00:00:00)
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Formato compacto para estatísticas
  const formatTimeCompact = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Efeito para salvar estado do timer no localStorage
  useEffect(() => {
    if (isRunning && !isPaused) {
      // Timer rodando - salvar apenas estado básico
      const timerState = {
        isRunning: true,
        isPaused: false,
        startTime: Date.now() - (time * 1000), // Recalcula startTime baseado no tempo atual
        totalTime: time
      };
      localStorage.setItem('timerState', JSON.stringify(timerState));
    } else if (isRunning && isPaused) {
      // Timer pausado - salvar estado
      const timerState = {
        isRunning: false,
        isPaused: true,
        time: time,
        pausedTime: pausedTime,
        pauseStartTime: pauseStartTime
      };
      localStorage.setItem('timerState', JSON.stringify(timerState));
    } else {
      // Timer parado - limpar estado
      localStorage.removeItem('timerState');
    }
  }, [isRunning, isPaused]); // Remove 'time' das dependências para não salvar constantemente

  // Efeito para controlar o cronômetro
  useEffect(() => {
    // Limpar interval anterior sempre
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        setTime(prevTime => prevTime + 1);
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, isPaused]);

  // Efeito para controlar o contador de tempo pausado
  useEffect(() => {
    // Limpar interval anterior sempre
    if (pauseIntervalRef.current) {
      clearInterval(pauseIntervalRef.current);
      pauseIntervalRef.current = null;
    }

    if (isPaused && isRunning) {
      pauseIntervalRef.current = setInterval(() => {
        setPausedTime(prevPausedTime => prevPausedTime + 1);
      }, 1000);
    }

    return () => {
      if (pauseIntervalRef.current) {
        clearInterval(pauseIntervalRef.current);
        pauseIntervalRef.current = null;
      }
    };
  }, [isPaused, isRunning]);

  // Função para iniciar/retomar
  const handleStart = () => {
    setIsRunning(true);
    setIsPaused(false);
    setPauseStartTime(null);
  };

  // Função para pausar
  const handlePause = () => {
    setIsPaused(true);
    setPauseStartTime(Date.now());
  };

  // Função para parar e resetar
  const handleStop = () => {
    if (time > 0) {
      // Salvar tempo estudado
      const today = new Date().toDateString();
      const studyData = JSON.parse(localStorage.getItem('studyTime') || '{}');
      studyData[today] = (studyData[today] || 0) + time;
      localStorage.setItem('studyTime', JSON.stringify(studyData));
      setTodayStudyTime(studyData[today]);
      
      // Atualizar o contexto com o tempo estudado e abrir modal
      setTimer(prev => ({ ...prev, seconds: time }));
      openForm();
    }
    
    // Limpar estado do timer
    localStorage.removeItem('timerState');
    
    setIsRunning(false);
    setIsPaused(false);
    setTime(0);
    setPausedTime(0);
    setPauseStartTime(null);
  };

  // Função para reiniciar o cronômetro
  const handleRestart = () => {
    // Limpar estado do timer
    localStorage.removeItem('timerState');
    
    setIsRunning(false);
    setIsPaused(false);
    setTime(0);
    setPausedTime(0);
    setPauseStartTime(null);
  };

  // Função para alternar maximização
  const toggleMaximize = () => {
    if (!isMaximized) {
      setShowSidebar(false);
      setTimeout(() => {
        setShowMaximized(true);
        setIsMaximized(true);
      }, 200); // duração igual ao fade
    } else {
      setIsMaximized(false);
      setTimeout(() => {
        setShowMaximized(false);
        setShowSidebar(true);
      }, 200); // duração igual ao fade
    }
  };

  const timerContent = (
    <div
      className="study-timer mt-3"
      style={{
        background: isMaximized 
          ? 'transparent'
          : 'linear-gradient(135deg, var(--primary-primary) 20%, var(--primary-primary-dark) 100%)',
        borderRadius: isMaximized ? '2em' : '1em',
        padding: isMaximized ? '3em' : '0.8em',
        marginTop: isMaximized ? '1em' : '0',
        color: 'var(--text-dark)',
        position: 'relative',
        overflow: 'hidden',
        display: 'block',
        maxWidth: isMaximized ? '600px' : 'auto'
      }}
    >
      {/* Header do cronômetro */}
      <div className="d-flex align-items-center justify-content-between mb-2 ">
        <div className="d-flex align-items-center gap-2">
          <motion.div
            animate={isRunning && !isPaused ? {
              color: ['#ffffff', '#ef4444', '#ffffff']
            } : {
              color: '#ffffff'
            }}
            transition={isRunning && !isPaused ? {
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            } : {
              duration: 0.3
            }}
          >
            <FontAwesomeIcon 
              icon={faClock} 
              style={{ opacity: 0.8 }} 
            />
          </motion.div>
          <span style={{ fontWeight: 600, fontSize: isMaximized ? '1.2em' : '0.8em' }}>REGISTRE SEU ESTUDO</span>
        </div>
        <div className="d-flex align-items-center gap-2">
          {todayStudyTime > 0 && (
            <div style={{ fontSize: '0.65em', opacity: 0.8 }}>
              Hoje: {formatTimeCompact(todayStudyTime)}
            </div>
          )}
          <motion.div
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleMaximize}
            style={{
              color: '#ffffff',
              fontSize: '1em',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              opacity: 0.8
            }}
            title={isMaximized ? 'Minimizar' : 'Maximizar'}
          >
            <FontAwesomeIcon icon={isMaximized ? faCompress : faExpand} />
          </motion.div>
        </div>
      </div>

      {/* Display do tempo */}
      <div className="text-center mb-2">
        <motion.div 
          animate={{ scale: isRunning && !isPaused ? [1, 1.02, 1] : 1 }}
          transition={{ duration: 1, repeat: isRunning && !isPaused ? Infinity : 0 }}
          style={{ 
            fontSize: isMaximized ? '6em' : '2.2em', 
            fontWeight: 'bold', 
            fontFamily: 'Inter',
            letterSpacing: '2px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '0.5em',
            marginBottom: '0.3em',
            padding: isMaximized ? '0.1em 0.3em' : '0.15em 0.3em'
          }}
        >
          {formatTime(time)}
        </motion.div>
        
        {/* Contador de tempo pausado */}
        {isPaused && pausedTime > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              fontSize: '1em',
              fontWeight: '500',
              fontFamily: 'monospace',
              color: 'rgba(255,255,255,0.9)',
              marginBottom: '0.3em'
            }}
            className="d-flex align-items-center justify-content-center gap-2"
          >
            <FontAwesomeIcon icon={faPause} style={{ color: 'rgba(255,255,255,0.9)' }} />
            Pausado: {formatTime(pausedTime)}
          </motion.div>
        )}
        
        <div style={{ fontSize: '0.7em', opacity: 0.8 }}>
          {isRunning && !isPaused ? (
            <motion.span
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="d-flex align-items-center justify-content-center gap-1"
            >
              <FontAwesomeIcon icon={faPlayCircle} style={{ color: 'var(--text-dark)' }} />
              Estudando...
            </motion.span>
            ) : isPaused && pausedTime === 0 ? (
              <span className="d-flex align-items-center justify-content-center gap-1">
                <FontAwesomeIcon icon={faPause} style={{ color: 'var(--text-dark)' }} />
                Pausado
              </span>
            ) : time > 0 && !isPaused ? (
              <span className="d-flex align-items-center justify-content-center gap-1">
                <FontAwesomeIcon icon={faCheckCircle} style={{ color: 'var(--text-dark)' }} />
                Sessão finalizada
              </span>
            ) : !isRunning && time === 0 ? (
              <span className="d-flex align-items-center justify-content-center gap-1">
                <FontAwesomeIcon icon={faClock} style={{ color: 'var(--text-dark)' }} />
                Pronto para iniciar
              </span>
            ) : null}
        </div>
      </div>

      {/* Botões de controle */}
      <div className={`d-flex justify-content-center ${isMaximized ? 'gap-5' : 'gap-2'}`}>
        {/* Ícone de finalizar (só aparece se há tempo) */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: time > 0 ? 1 : 0, opacity: time > 0 ? 1 : 0 }}
          exit={{ scale: 0, opacity: 0 }}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleStop}
          style={{
            color: '#dc3545',
            fontSize: isMaximized ? '3em' : '1.3em',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <FontAwesomeIcon icon={faStop} />
        </motion.div>

        {/* Ícone play/pause - AGORA NO CENTRO */}
        <motion.div
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          onClick={isRunning && !isPaused ? handlePause : handleStart}
          style={{
            color: '#fff',
            fontSize: isMaximized ? '3em' : '1.3em',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <FontAwesomeIcon 
            icon={isRunning && !isPaused ? faPause : faPlay} 
          />
        </motion.div>

        {/* Ícone de reiniciar (só aparece se há tempo ou se está pausado) */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: (time > 0 || isPaused) ? 1 : 0, opacity: (time > 0 || isPaused) ? 1 : 0 }}
          exit={{ scale: 0, opacity: 0 }}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleRestart}
          style={{
            color: '#ffffff',
            fontSize: isMaximized ? '3em' : '1.5em',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <FontAwesomeIcon icon={faRotateRight} />
        </motion.div>
      </div>

      {/* Remover a meta de estudo (opcional) */}
      {/* 
      {todayStudyTime > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-3 text-center"
          style={{
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '0.5em',
            padding: '0.5em',
            fontSize: '0.75em'
          }}
        >
          <FontAwesomeIcon icon={faCalendarCheck} className="me-1" />
          Meta diária: {formatTimeCompact(todayStudyTime + time)}
        </motion.div>
      )}
      */}
    </div>
  );

  // Se maximizado, renderiza em portal para aparecer sobre toda a tela
  if (showMaximized) {
    return createPortal(
      <AnimatePresence>
        {isMaximized && (
          <>
            {/* Backdrop blur */}
            <motion.div 
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                background: 'rgba(0,0,0,0.3)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                zIndex: 9998
              }}
            />
            {/* Timer maximizado */}
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'none',
              pointerEvents: 'none'
            }}>
              <motion.div
                key="maximized-timer"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                style={{
                  pointerEvents: 'auto'
                }}
              >
                {timerContent}
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>,
      document.body
    );
  }

  // Versão normal na sidebar (com fade de opacidade controlado por showSidebar)
  return (
    <AnimatePresence>
      {showSidebar && (
        <motion.div
          key="normal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }} // duração igual para in/out
        >
          {timerContent}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StudyTimer;