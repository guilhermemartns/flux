import React, { useState, useEffect } from 'react';
import Lottie from 'lottie-react';

// Coloque o arquivo JSON baixado do lottiefiles em:
// src/assets/cat-loader.json

const DIAS_SEMANA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function pad(n) { return String(n).padStart(2, '0'); }

export default function CatMascot() {
  const [now, setNow] = useState(new Date());
  const [catAnimation, setCatAnimation] = useState(null);

  useEffect(() => {
    import('../assets/cat-loader.json')
      .then(mod => setCatAnimation(mod.default))
      .catch(() => {}); // arquivo ainda não adicionado
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const horas   = pad(now.getHours());
  const minutos = pad(now.getMinutes());
  const segundos = pad(now.getSeconds());
  const diaSemana = DIAS_SEMANA[now.getDay()];
  const dia = pad(now.getDate());
  const mes = MESES[now.getMonth()];
  const ano = now.getFullYear();

  return (
    <div
      className="d-flex flex-row align-items-center"
      style={{ gap: '0.5rem', userSelect: 'none' }}
    >
      {catAnimation ? (
        <Lottie
          animationData={catAnimation}
          loop
          style={{ width: 90, height: 90, flexShrink: 0 }}
        />
      ) : (
        <div style={{ fontSize: 56, lineHeight: 1, flexShrink: 0 }}>🐱</div>
      )}
      <div className="d-flex flex-column" style={{ gap: '0.15rem' }}>
        <div
          style={{
            fontFamily: 'monospace',
            fontSize: '1.5rem',
            fontWeight: 700,
            color: 'var(--text-middle)',
            letterSpacing: 2,
            lineHeight: 1,
          }}
        >
          {horas}:{minutos}
          <span style={{ fontSize: '1rem', color: 'var(--text-light)', marginLeft: 2 }}>
            :{segundos}
          </span>
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-light)', fontWeight: 500 }}>
          {diaSemana}, {dia} {mes} {ano}
        </div>
      </div>
    </div>
  );
}
