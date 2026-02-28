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
    <div className="fixed-bottom w-100 bg-black bg-opacity-10 shadow px-4 py-2" style={{ zIndex: 9999, pointerEvents: 'auto', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
      <div className="d-flex align-items-center justify-content-center gap-4">
        {timer.running ? (
          <button className="btn btn-link p-0 fs-6" onClick={pauseTimer} title="Pausar">
            <FontAwesomeIcon icon={faPause} className="text-primary" />
          </button>
        ) : (
          <button className="btn btn-link p-0 fs-6"  onClick={resumeTimer} title="Retomar">
            <FontAwesomeIcon icon={faPlay} className="text-primary" />
          </button>
        )}
        <button className="btn btn-link p-0 fs-6" onClick={stopTimer} title="Salvar/Parar">
          <FontAwesomeIcon icon={faStop} className="text-primary" />
        </button>
        <span className="fw-bold text-primary fs-4" style={{ cursor: 'pointer' }} onClick={openTimer}>{formatTime(timer.seconds)}</span>
        <button className="btn btn-link p-0 fs-5" onClick={openTimer} title="Maximizar cronômetro">
          <FontAwesomeIcon icon={faExpand} className="text-primary" />
        </button>
        <button className="btn btn-link p-0 fs-5"  onClick={closeTimer} title="Fechar cronômetro">
          <FontAwesomeIcon icon={faTimes} className="text-primary" />
        </button>
      </div>
    </div>
  );
};

export default StudyTimerMini;
