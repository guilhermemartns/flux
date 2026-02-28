import React, { useContext, useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPause, faPlay, faStop, faUndo, faTimes, faWindowMinimize } from '@fortawesome/free-solid-svg-icons';
import { faPiedPiperHat } from '@fortawesome/free-brands-svg-icons';
import { StudyTimerContext } from './StudyTimerContext';

const formatTime = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const StudyTimerPopup = () => {
  const {
    isTimerOpen, closeTimer, timer, startTimer, pauseTimer, resumeTimer, stopTimer, openForm, resetTimer, setMode, setInputSeconds
  } = useContext(StudyTimerContext);
  const [inputMinutes, setInputMinutes] = useState(0);
  // started: true se timer já foi iniciado (running ou pausado)
  const [started, setStarted] = useState(timer.running || timer.seconds > 0);
  const { minimized, minimizeTimer, restoreTimer } = useContext(StudyTimerContext);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const cronometroDivRef = React.useRef(null);

  // Removido efeito que restaurava o timer ao abrir o popup, pois causava conflito com minimização

  useEffect(() => {
    if (timer.running || timer.seconds > 0) {
      setStarted(true);
    } else {
      setStarted(false);
    }
  }, [timer.running, timer.seconds, isTimerOpen]);

  useEffect(() => {
    if (timer.mode === 'timer' && !started && cronometroDivRef.current) {
      cronometroDivRef.current.focus();
    }
  }, [timer.mode, started]);

  if (!isTimerOpen || minimized) return null;

  const handleStart = () => {
    if (timer.mode === 'timer') {
      // Converte inputMinutes (hhmmss) para segundos
      let val = (inputMinutes || '').padStart(6, '0');
      let h = parseInt(val.slice(0,2), 10);
      let m = parseInt(val.slice(2,4), 10);
      let s = parseInt(val.slice(4,6), 10);
          let secs = h * 3600 + m * 60 + s;
          if (!secs || isNaN(secs) || secs <= 0) secs = 1; // valor mínimo 1 segundo
      setInputSeconds(secs);
      startTimer('timer', secs);
    } else {
      startTimer('cronometro');
    }
    setStarted(true);
  };

  return (
    <>
  <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.18)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', zIndex: 10000, pointerEvents: 'none' }}></div>
  <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ zIndex: 10001, pointerEvents: 'auto' }}>
      <div className="popup-cronometro min-vw-25 rounded-3  p-4 d-flex flex-column align-items-center" style={{ minWidth: '320px', pointerEvents: 'auto' }}>
        <div className="d-flex flex-column align-items-center justify-content-center mb-2" style={{ minHeight: '2.5em' }}>
          <FontAwesomeIcon icon={faPiedPiperHat} className="fs-1 text-secondary mb-2" title="FLUX" />
          <div className="d-flex align-items-center gap-2">
            <h2 className="m-0 fs-5 mx-2 text-secondary">Cronômetro de Estudo</h2>
            <button className="btn btn-link p-0 fs-5 text-secondary" style={{ fontSize: '1em' }} title="Minimizar" onClick={minimizeTimer}>
              <FontAwesomeIcon icon={faWindowMinimize} />
            </button>
            <button className="btn btn-link p-0 fs-5 text-secondary" style={{ fontSize: '1em' }} title="Fechar" onClick={() => setShowCloseConfirm(true)}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
        </div>
        {timer.mode === 'timer' && !started ? (
          <input
            type="text"
            value={inputMinutes}
            onChange={e => {
              // Permite apenas números, máximo 6 dígitos
              let raw = e.target.value.replace(/\D/g, '').slice(0, 6);
              setInputMinutes(raw);
            }}
            placeholder="hhmmss"
            className="form-control text-center fs-2 mx-auto bg-transparent text-primary border border-primary border-dashed rounded-2"
            maxLength={6}
            autoFocus
          />
        ) : (
          <div className="div-cronometro mx-auto text-center fw-bold text-primary" style={{ fontSize: '9em', minWidth: '180px' }}>
            {formatTime(timer.seconds)}
          </div>
        )}
        {(!started && !timer.running) ? (
          <div className="manipulação-cronometro text-center">
            {/* Só timer, sem opção de cronômetro */}
            <button 
              className="btn mt-2 mx-auto d-flex align-items-center justify-content-center border-0 bg-transparent shadow-none p-0"
              onClick={handleStart}
            >
              <FontAwesomeIcon icon={faPlay} className="fs-2 text-primary" />
            </button>
          </div>
        ) : (
          <div className="botoes-controle-cronometro d-flex justify-content-center gap-3">
            {timer.running ? (
              <button className="btn btn-link p-0 fs-3" onClick={pauseTimer} title="Pausar">
                <FontAwesomeIcon icon={faPause} className="text-primary" />
              </button>
            ) : (
              <button className="btn btn-link p-0 fs-3" onClick={resumeTimer} title="Retomar">
                <FontAwesomeIcon icon={faPlay} className="text-primary" />
              </button>
            )}
            <button className="btn btn-link p-0 fs-3" onClick={() => setShowStopConfirm(true)} title="Parar e Salvar">
              <FontAwesomeIcon icon={faStop} className="text-primary" />
            </button>
            <button className="btn btn-link p-0 fs-3" onClick={() => setShowResetConfirm(true)} title="Resetar">
              <FontAwesomeIcon icon={faUndo} className="text-primary" />
            </button>
          </div>
        )}
        {showStopConfirm && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.18)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#fff', padding: '2em', borderRadius: '12px', minWidth: '320px', boxShadow: '0 2px 12px rgba(0,0,0,0.2)', textAlign: 'center' }}>
              <p>Deseja realmente parar e salvar? O tempo atual será salvo e o cronômetro encerrado.</p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1em', marginTop: '1em' }}>
                <button onClick={() => {
                  setShowStopConfirm(false);
                  setShowCloseConfirm(false);
                  setShowResetConfirm(false);
                  stopTimer(); openForm(); closeTimer(); setStarted(false);
                }} style={{ fontSize: '1.2em', background: 'none', border: '1px solid #007bff', borderRadius: '6px', color: '#007bff', padding: '0.5em 1em', cursor: 'pointer' }}>Parar e Salvar</button>
                <button onClick={() => setShowStopConfirm(false)} style={{ fontSize: '1.2em', background: 'none', border: '1px solid #aaa', borderRadius: '6px', color: '#333', padding: '0.5em 1em', cursor: 'pointer' }}>Cancelar</button>
              </div>
            </div>
          </div>
        )}
        {showCloseConfirm && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.18)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#fff', padding: '2em', borderRadius: '12px', minWidth: '320px', boxShadow: '0 2px 12px rgba(0,0,0,0.2)', textAlign: 'center' }}>
              <p>Tem certeza que deseja encerrar o cronômetro? O tempo atual será perdido.</p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1em', marginTop: '1em' }}>
                <button onClick={() => {
                  setShowStopConfirm(false);
                  setShowCloseConfirm(false);
                  setShowResetConfirm(false);
                  resetTimer(); closeTimer(); setStarted(false);
                }} style={{ fontSize: '1.2em', background: 'none', border: '1px solid #007bff', borderRadius: '6px', color: '#007bff', padding: '0.5em 1em', cursor: 'pointer' }}>Encerrar</button>
                <button onClick={() => setShowCloseConfirm(false)} style={{ fontSize: '1.2em', background: 'none', border: '1px solid #aaa', borderRadius: '6px', color: '#333', padding: '0.5em 1em', cursor: 'pointer' }}>Cancelar</button>
              </div>
            </div>
          </div>
        )}
        {showResetConfirm && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.18)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#fff', padding: '2em', borderRadius: '12px', minWidth: '320px', boxShadow: '0 2px 12px rgba(0,0,0,0.2)', textAlign: 'center' }}>
              <p>Tem certeza que deseja recomeçar o cronômetro? O tempo atual será perdido.</p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1em', marginTop: '1em' }}>
                <button onClick={() => {
                  setShowStopConfirm(false);
                  setShowCloseConfirm(false);
                  setShowResetConfirm(false);
                  resetTimer(); setStarted(false);
                }} style={{ fontSize: '1.2em', background: 'none', border: '1px solid #007bff', borderRadius: '6px', color: '#007bff', padding: '0.5em 1em', cursor: 'pointer' }}>Recomeçar</button>
                <button onClick={() => setShowResetConfirm(false)} style={{ fontSize: '1.2em', background: 'none', border: '1px solid #aaa', borderRadius: '6px', color: '#333', padding: '0.5em 1em', cursor: 'pointer' }}>Cancelar</button>
              </div>
            </div>
          </div>
        )}
        </div>
        
      </div>
    </>
  );
};

export default StudyTimerPopup;
