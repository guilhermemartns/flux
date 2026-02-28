import React, { useContext } from 'react';
import { FaRegClock } from 'react-icons/fa';
import { StudyTimerContext } from './StudyTimerContext';

const StudyTimerButton = () => {
  const { openTimer } = useContext(StudyTimerContext);

  return (
    <span
      onClick={openTimer}
      className="position-fixed top-0 end-0 z-3 bg-transparent border-0 rounded-circle shadow-none d-flex align-items-center justify-content-center"
      style={{ width: 50, height: 50, cursor: 'pointer', zIndex: 9999, pointerEvents: 'auto' }}
      aria-label="Abrir cronômetro de estudo"
    >
      <FaRegClock size={32} className="text-primary" />
    </span>
  );
};

export default StudyTimerButton;
