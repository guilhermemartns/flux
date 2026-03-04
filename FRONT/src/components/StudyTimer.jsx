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
    // Minimiza tela cheia antes de qualquer outra ação
    if (isMaximized) {
      setIsMaximized(false);
      setTimeout(() => {
        setShowMaximized(false);
        setShowSidebar(true);
      }, 200);
    }

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

  // Função para adicionar estudo manual (sem cronometragem)
  const handleAddManualStudy = () => {
    // Zerar o timer e abrir o formulário para edição manual
    setTimer(prev => ({ ...prev, seconds: 0 }));
    openForm();
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
          ? '#111'
          : 'var(--background-light)',
        borderRadius: isMaximized ? '1.5rem' : '1rem',
        padding: isMaximized ? '3em 2.5em' : '1.2em 1em',
        marginTop: isMaximized ? '1em' : '0',
        color: isMaximized ? '#f5f5f5' : 'var(--text-dark)',
        position: 'relative',
        overflow: 'hidden',
        display: 'block',
        maxWidth: isMaximized ? '520px' : 'auto',
        border: isMaximized ? '1px solid #2a2a2a' : '1px solid var(--border)',
      }}
    >
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between" style={{ marginBottom: isMaximized ? '1.5em' : '0.6em' }}>
        <div className="d-flex align-items-center gap-2">
          <motion.div
            animate={isRunning && !isPaused ? {
              opacity: [1, 0.4, 1]
            } : {
              opacity: 0.6
            }}
            transition={isRunning && !isPaused ? {
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            } : {
              duration: 0.3
            }}
          >
            <FontAwesomeIcon 
              icon={faClock} 
              style={{ fontSize: isMaximized ? '1em' : '0.75em', color: 'var(--primary-primary3)' }} 
            />
          </motion.div>
          <span style={{ fontWeight: 600, fontSize: isMaximized ? '1em' : '0.7em', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-light)' }}>Cronômetro</span>
        </div>
        <div className="d-flex align-items-center gap-2">
          {todayStudyTime > 0 && (
            <span style={{
              fontSize: isMaximized ? '0.75em' : '0.6em',
              color: 'var(--text-light)',
              background: 'var(--transparente)',
              padding: '0.15em 0.5em',
              borderRadius: '0.4em',
              fontWeight: 500
            }}>
              Hoje: {formatTimeCompact(todayStudyTime)}
            </span>
          )}
          <motion.div
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleMaximize}
            style={{
              color: 'var(--text-light)',
              fontSize: isMaximized ? '0.9em' : '0.75em',
              cursor: 'pointer',
            }}
            title={isMaximized ? 'Minimizar' : 'Maximizar'}
          >
            <FontAwesomeIcon icon={isMaximized ? faCompress : faExpand} />
          </motion.div>
        </div>
      </div>

      {/* Display do tempo */}
      <div className="text-center" style={{ marginBottom: isMaximized ? '1.5em' : '0.6em' }}>
        <motion.div 
          animate={{ scale: isRunning && !isPaused ? [1, 1.01, 1] : 1 }}
          transition={{ duration: 1.5, repeat: isRunning && !isPaused ? Infinity : 0 }}
          style={{ 
            fontSize: isMaximized ? '5.5em' : '2.4em', 
            fontWeight: 700, 
            fontFamily: "'Inter', 'SF Mono', 'Roboto Mono', monospace",
            letterSpacing: isMaximized ? '4px' : '1px',
            color: isMaximized ? '#ffffff' : 'var(--text-dark)',
            lineHeight: 1.1,
            padding: isMaximized ? '0.15em 0' : '0.1em 0',
          }}
        >
          {formatTime(time)}
        </motion.div>
        
        {/* Contador de tempo pausado */}
        {isPaused && pausedTime > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            style={{
              fontSize: isMaximized ? '1em' : '0.72em',
              fontWeight: 500,
              fontFamily: "'Inter', monospace",
              color: 'var(--text-light)',
              marginTop: '0.3em',
            }}
            className="d-flex align-items-center justify-content-center gap-1"
          >
            <FontAwesomeIcon icon={faPause} style={{ fontSize: '0.8em' }} />
            Pausado: {formatTime(pausedTime)}
          </motion.div>
        )}
        
        {/* Status indicator */}
        <div style={{ fontSize: isMaximized ? '0.8em' : '0.65em', marginTop: '0.3em' }}>
          {isRunning && !isPaused ? (
            <motion.span
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="d-flex align-items-center justify-content-center gap-1"
              style={{ color: '#22c55e', fontWeight: 500 }}
            >
              <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
              Estudando
            </motion.span>
            ) : isPaused && pausedTime === 0 ? (
              <span className="d-flex align-items-center justify-content-center gap-1" style={{ color: '#f59e0b', fontWeight: 500 }}>
                <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#f59e0b' }} />
                Pausado
              </span>
            ) : time > 0 && !isPaused ? (
              <span className="d-flex align-items-center justify-content-center gap-1" style={{ color: 'var(--text-light)', fontWeight: 500 }}>
                <FontAwesomeIcon icon={faCheckCircle} style={{ fontSize: '0.85em' }} />
                Sessão finalizada
              </span>
            ) : !isRunning && time === 0 ? (
              <span className="d-flex align-items-center justify-content-center gap-1" style={{ color: 'var(--text-light)', fontWeight: 500 }}>
                Pronto para iniciar
              </span>
            ) : null}
        </div>
      </div>

      {/* Botões de controle */}
      <div className={`d-flex justify-content-center align-items-center ${isMaximized ? 'gap-4' : 'gap-3'}`}>
        {/* Botão de finalizar (salvar) */}
        <AnimatePresence>
          {time > 0 && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={handleStop}
              title="Salvar e parar"
              style={{
                width: isMaximized ? 52 : 34,
                height: isMaximized ? 52 : 34,
                borderRadius: '50%',
                border: '1.5px solid #ef4444',
                background: 'transparent',
                color: '#ef4444',
                fontSize: isMaximized ? '1.2em' : '0.85em',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.2s, color 0.2s',
              }}
              onMouseOver={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = '#fff'; }}
              onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#ef4444'; }}
            >
              <FontAwesomeIcon icon={faStop} />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Botão play/pause — principal */}
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={isRunning && !isPaused ? handlePause : handleStart}
          title={isRunning && !isPaused ? 'Pausar' : 'Iniciar'}
          style={{
            width: isMaximized ? 68 : 44,
            height: isMaximized ? 68 : 44,
            borderRadius: '50%',
            border: 'none',
            background: 'var(--primary-primary3)',
            color: '#fff',
            fontSize: isMaximized ? '1.5em' : '1em',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 10px rgba(125,187,255,0.25)',
            transition: 'box-shadow 0.2s',
          }}
        >
          <FontAwesomeIcon 
            icon={isRunning && !isPaused ? faPause : faPlay} 
            style={{ marginLeft: isRunning && !isPaused ? 0 : '2px' }}
          />
        </motion.button>

        {/* Botão de reiniciar */}
        <AnimatePresence>
          {(time > 0 || isPaused) && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={handleRestart}
              title="Reiniciar"
              style={{
                width: isMaximized ? 52 : 34,
                height: isMaximized ? 52 : 34,
                borderRadius: '50%',
                border: '1.5px solid var(--text-light)',
                background: 'transparent',
                color: 'var(--text-light)',
                fontSize: isMaximized ? '1.1em' : '0.8em',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.2s, color 0.2s, border-color 0.2s',
              }}
              onMouseOver={e => { e.currentTarget.style.background = 'var(--text-light)'; e.currentTarget.style.color = 'var(--background-light)'; }}
              onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-light)'; }}
            >
              <FontAwesomeIcon icon={faRotateRight} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Link registrar estudo manual */}
      <div className="text-center" style={{ marginTop: isMaximized ? '1.5em' : '0.75em' }}>
        <button
          onClick={handleAddManualStudy}
          title="Adicionar estudo manual (não cronometrado)"
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            color: 'var(--text-light)',
            fontSize: isMaximized ? '0.78em' : '0.63em',
            fontWeight: 400,
            cursor: 'pointer',
            textDecoration: 'none',
            letterSpacing: '0.01em',
            transition: 'color 0.15s',
          }}
          onMouseOver={e => { e.currentTarget.style.color = 'var(--primary-primary3)'; e.currentTarget.style.textDecoration = 'underline'; }}
          onMouseOut={e => { e.currentTarget.style.color = 'var(--text-light)'; e.currentTarget.style.textDecoration = 'none'; }}
        >
          Registrar sessão manual
        </button>
      </div>
    </div>
  );

  // Se maximizado, renderiza em portal para aparecer sobre toda a tela
  if (showMaximized) {
    return createPortal(
      <AnimatePresence>
        {isMaximized && (
          <>
            {/* Backdrop escuro */}
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
                background: 'rgba(8,8,8,0.92)',
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