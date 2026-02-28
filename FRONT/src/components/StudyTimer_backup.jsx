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
      setTime(timerState.initialTime + elapsed);
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
      // Timer rodando - salvar estado
      const timerState = {
        isRunning: true,
        isPaused: false,
        startTime: Date.now() - (time * 1000),
        initialTime: time
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
  }, [isRunning, isPaused, time, pausedTime, pauseStartTime]);

  // Efeito para controlar o cronômetro
  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        setTime(prevTime => prevTime + 1);
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isRunning, isPaused]);

  // Efeito para controlar o contador de tempo pausado
  useEffect(() => {
    if (isPaused && isRunning) {
      pauseIntervalRef.current = setInterval(() => {
        setPausedTime(prevPausedTime => prevPausedTime + 1);
      }, 1000);
    } else {
      clearInterval(pauseIntervalRef.current);
    }

    return () => clearInterval(pauseIntervalRef.current);
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
    setIsMaximized(!isMaximized);
  };

  // Componente do timer (para reutilizar entre versão normal e maximizada)
  const TimerComponent = ({ isMaximized }) => (
    <motion.div
      initial={{ x: isMaximized ? 0 : -100, opacity: 0 }}
      animate={{ 
        x: 0, 
        opacity: 1,
        scale: isMaximized ? 1 : 1
      }}
      transition={{ type: 'spring', stiffness: 60, damping: 15, delay: isMaximized ? 0 : 0.1 }}
      className="study-timer"
      style={{
        background: isMaximized 
          ? 'linear-gradient(135deg, var(--background-light) 20%, var(--background) 100%)'
          : 'linear-gradient(135deg, var(--primary-primary) 20%, var(--primary-primary-dark) 100%)',
        borderRadius: isMaximized ? '2em' : '1em',
        padding: isMaximized ? '3em' : '1.2em',
        marginTop: isMaximized ? '0' : '1.5em',
        color: 'var(--text-dark)',
        position: 'relative',
        overflow: 'hidden',
        width: isMaximized ? 'auto' : 'auto',
        height: isMaximized ? 'auto' : 'auto',
        display: 'block',
        maxWidth: isMaximized ? '600px' : 'auto'
      }}
    >
      {/* Header do cronômetro */}
      <div className="d-flex align-items-center justify-content-between mb-3">
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
          <span style={{ fontWeight: 600, fontSize: isMaximized ? '1.2em' : '0.9em' }}>REGISTRE SEU ESTUDO</span>
        </div>
        <div className="d-flex align-items-center gap-2">
          {todayStudyTime > 0 && (
            <div style={{ fontSize: '0.7em', opacity: 0.8 }}>
              Hoje: {formatTimeCompact(todayStudyTime)}
            </div>
          )}
          <motion.div
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleMaximize}
            style={{
              color: '#ffffff',
              fontSize: '1.2em',
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
      <div className="text-center mb-3">
        <motion.div 
          animate={{ scale: isRunning && !isPaused ? [1, 1.02, 1] : 1 }}
          transition={{ duration: 1, repeat: isRunning && !isPaused ? Infinity : 0 }}
          style={{ 
            fontSize: isMaximized ? '6em' : '3em', 
            fontWeight: 'bold', 
            fontFamily: 'Inter',
            letterSpacing: '3px',
            
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '0.5em',
            marginBottom: '0.5em',
            padding: isMaximized ? '0.5em' : '0.2em'
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
              fontSize: '1.2em',
              fontWeight: '500',
              fontFamily: 'monospace',
              color: 'rgba(255,255,255,0.9)',
              marginBottom: '0.5em'
            }}
            className="d-flex align-items-center justify-content-center gap-2"
          >
            <FontAwesomeIcon icon={faPause} style={{ color: 'rgba(255,255,255,0.9)' }} />
            Pausado: {formatTime(pausedTime)}
          </motion.div>
        )}
        
        <div style={{ fontSize: '0.75em', opacity: 0.8 }}>
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
      <div className={`d-flex justify-content-center ${isMaximized ? 'gap-5' : 'gap-3'}`}>
        {/* Ícone play/pause */}
        <motion.div
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          onClick={isRunning && !isPaused ? handlePause : handleStart}
          style={{
            color: '#fff',
            fontSize: isMaximized ? '3em' : '1.5em',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <FontAwesomeIcon 
            icon={isRunning && !isPaused ? faPause : faPlay} 
          />
        </motion.div>

        {/* Ícone de finalizar (só aparece se há tempo) */}
        <AnimatePresence>
          {time > 0 && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleStop}
              style={{
                color: '#dc3545',
                fontSize: isMaximized ? '3em' : '1.5em',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <FontAwesomeIcon icon={faStop} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ícone de reiniciar (só aparece se há tempo ou se está pausado) */}
        <AnimatePresence>
          {(time > 0 || isPaused) && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
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
          )}
        </AnimatePresence>
      </div>

      {/* Meta de estudo (opcional) */}
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
    </motion.div>
  );

  // Se maximizado, renderiza em portal para aparecer sobre toda a tela
  if (isMaximized) {
    return createPortal(
      <>
        {/* Backdrop blur */}
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          width: '100vw', 
          height: '100vh', 
          background: 'rgba(0,0,0,0.3)', 
          backdropFilter: 'blur(8px)', 
          WebkitBackdropFilter: 'blur(8px)', 
          zIndex: 9998 
        }}></div>
        
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
          background: 'none' 
        }}>
          <TimerComponent isMaximized={true} />
        </div>
      </>,
      document.body
    );
  }

  // Versão normal na sidebar
  return <TimerComponent isMaximized={false} />;
      {/* Header do cronômetro */}
      <div className="d-flex align-items-center justify-content-between mb-3">
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
          <span style={{ fontWeight: 600, fontSize: isMaximized ? '1.2em' : '0.9em' }}>REGISTRE SEU ESTUDO</span>
        </div>
        <div className="d-flex align-items-center gap-2">
          {todayStudyTime > 0 && (
            <div style={{ fontSize: '0.7em', opacity: 0.8 }}>
              Hoje: {formatTimeCompact(todayStudyTime)}
            </div>
          )}
          <motion.div
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleMaximize}
            style={{
              color: '#ffffff',
              fontSize: '1.2em',
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
      <div className="text-center mb-3">
        <motion.div 
          animate={{ scale: isRunning && !isPaused ? [1, 1.02, 1] : 1 }}
          transition={{ duration: 1, repeat: isRunning && !isPaused ? Infinity : 0 }}
          style={{ 
            fontSize: isMaximized ? '6em' : '3em', 
            fontWeight: 'bold', 
            fontFamily: 'Inter',
            letterSpacing: '3px',
            
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '0.5em',
            marginBottom: '0.5em',
            padding: isMaximized ? '0.5em' : '0.2em'
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
              fontSize: '1.2em',
              fontWeight: '500',
              fontFamily: 'monospace',
              color: 'rgba(255,255,255,0.9)',
              marginBottom: '0.5em'
            }}
            className="d-flex align-items-center justify-content-center gap-2"
          >
            <FontAwesomeIcon icon={faPause} style={{ color: 'rgba(255,255,255,0.9)' }} />
            Pausado: {formatTime(pausedTime)}
          </motion.div>
        )}
        
        <div style={{ fontSize: '0.75em', opacity: 0.8 }}>
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
      <div className={`d-flex justify-content-center ${isMaximized ? 'gap-5' : 'gap-3'}`}>
        {/* Ícone play/pause */}
        <motion.div
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          onClick={isRunning && !isPaused ? handlePause : handleStart}
          style={{
            color: '#fff',
            fontSize: isMaximized ? '3em' : '1.5em',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <FontAwesomeIcon 
            icon={isRunning && !isPaused ? faPause : faPlay} 
          />
        </motion.div>

        {/* Ícone de finalizar (só aparece se há tempo) */}
        <AnimatePresence>
          {time > 0 && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleStop}
              style={{
                color: '#dc3545',
                fontSize: isMaximized ? '3em' : '1.5em',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <FontAwesomeIcon icon={faStop} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ícone de reiniciar (só aparece se há tempo ou se está pausado) */}
        <AnimatePresence>
          {(time > 0 || isPaused) && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
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
          )}
        </AnimatePresence>
      </div>

      {/* Meta de estudo (opcional) */}
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
    </motion.div>
  );
};

export default StudyTimer;