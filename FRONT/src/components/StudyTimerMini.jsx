import React, { useContext } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPause, faPlay, faStop, faTimes, faExpand } from '@fortawesome/free-solid-svg-icons';
import { StudyTimerContext } from './StudyTimerContext';

const formatTime = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const StudyTimerMini = () => {
  const { timer, openTimer, minimized, pauseTimer, resumeTimer, stopTimer, restoreTimer, closeTimer } = useContext(StudyTimerContext);
  if ((timer.seconds === 0) || !minimized) return null;
  return (
    <div className="fixed-bottom w-100 shadow-sm px-4 py-2" style={{ zIndex: 9999, pointerEvents: 'auto', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', background: 'var(--background-light)', borderTop: '1px solid var(--border)' }}>
      <div className="d-flex align-items-center justify-content-center gap-3">
        {timer.running ? (
          <button className="btn btn-link p-0" onClick={pauseTimer} title="Pausar" style={{ fontSize: '0.9em', color: 'var(--text-dark)', lineHeight: 1 }}>
            <FontAwesomeIcon icon={faPause} />
          </button>
        ) : (
          <button className="btn btn-link p-0" onClick={resumeTimer} title="Retomar" style={{ fontSize: '0.9em', color: 'var(--text-dark)', lineHeight: 1 }}>
            <FontAwesomeIcon icon={faPlay} />
          </button>
        )}
        <button className="btn btn-link p-0" onClick={stopTimer} title="Salvar/Parar" style={{ fontSize: '0.9em', color: '#ef4444', lineHeight: 1 }}>
          <FontAwesomeIcon icon={faStop} />
        </button>
        <span className="fw-bold fs-5" style={{ cursor: 'pointer', fontFamily: "'Inter', 'SF Mono', monospace", letterSpacing: '1px', color: 'var(--text-dark)' }} onClick={openTimer}>{formatTime(timer.seconds)}</span>
        <button className="btn btn-link p-0" onClick={openTimer} title="Maximizar cronômetro" style={{ fontSize: '0.85em', color: 'var(--text-light)', lineHeight: 1 }}>
          <FontAwesomeIcon icon={faExpand} />
        </button>
        <button className="btn btn-link p-0" onClick={closeTimer} title="Fechar cronômetro" style={{ fontSize: '0.85em', color: 'var(--text-light)', lineHeight: 1 }}>
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>
    </div>
  );
};

export default StudyTimerMini;
