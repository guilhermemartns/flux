import React from 'react';

// Primitivos de skeleton com efeito shimmer
// Uso: <Sk.Line />, <Sk.Block h={120} />, <Sk.Circle size={40} />, <Sk.Card>...</Sk.Card>

const base = {
  background: 'linear-gradient(90deg, var(--skeleton-base) 25%, var(--skeleton-shine) 50%, var(--skeleton-base) 75%)',
  backgroundSize: '200% 100%',
  animation: 'skeleton-shimmer 1.4s infinite linear',
  borderRadius: 6,
};

export const SkLine = ({ w = '100%', h = 14, style = {}, mb = 8 }) => (
  <div style={{ width: w, height: h, marginBottom: mb, ...base, ...style }} />
);

export const SkBlock = ({ w = '100%', h = 80, style = {}, mb = 0 }) => (
  <div style={{ width: w, height: h, marginBottom: mb, borderRadius: 10, ...base, ...style }} />
);

export const SkCircle = ({ size = 40, style = {} }) => (
  <div style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, ...base, ...style }} />
);

export const SkCard = ({ children, style = {} }) => (
  <div className="card-padrao2" style={{ padding: '1rem', ...style }}>
    {children}
  </div>
);

// ─── Layouts prontos ─────────────────────────────────────────────────────────

/** Skeleton para páginas com lista de linhas (Erros, FilaRevisao, etc.) */
export const SkeletonList = ({ rows = 6 }) => (
  <div className="app-container">
    <main className="container-fluid pt-3 pb-4 px-4" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <SkLine w="30%" h={22} mb={0} />
      <SkCard style={{ marginTop: 8 }}>
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="d-flex align-items-center gap-3" style={{ marginBottom: 14 }}>
            <SkCircle size={32} />
            <div style={{ flex: 1 }}>
              <SkLine w="60%" h={13} mb={6} />
              <SkLine w="40%" h={11} mb={0} />
            </div>
            <SkLine w={60} h={28} mb={0} style={{ borderRadius: 8 }} />
          </div>
        ))}
      </SkCard>
    </main>
  </div>
);

/** Skeleton para páginas com tabela (Edital, Erros) */
export const SkeletonTable = ({ rows = 8, cols = 3 }) => (
  <div className="app-container">
    <main className="container-fluid pt-3 pb-4 px-4" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="d-flex justify-content-between align-items-center" style={{ marginBottom: 8 }}>
        <SkLine w="25%" h={22} mb={0} />
        <SkLine w={100} h={34} mb={0} style={{ borderRadius: 8 }} />
      </div>
      <SkCard>
        <div className="d-flex gap-3 mb-3">
          {[...Array(cols)].map((_, i) => <SkLine key={i} w={`${100 / cols}%`} h={13} mb={0} />)}
        </div>
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="d-flex gap-3" style={{ marginBottom: 12 }}>
            {[...Array(cols)].map((_, j) => <SkLine key={j} w={`${100 / cols}%`} h={13} mb={0} />)}
          </div>
        ))}
      </SkCard>
    </main>
  </div>
);

/** Skeleton para a Home (index.jsx) */
export const SkeletonHome = () => (
  <div className="app-container">
    <main className="container-fluid gap-4 pt-3">
      {/* TEMPO */}
      <div className="m-0 w-100 p-3 border" style={{ borderRadius: 25, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <SkLine w="15%" h={14} />
        <div className="d-flex w-100 gap-3">
          <SkBlock w="60%" h={80} />
          <SkBlock w="40%" h={80} />
        </div>
        <div className="d-flex w-100 gap-2">
          {[...Array(30)].map((_, i) => <SkBlock key={i} h={34} style={{ flex: 1, borderRadius: i === 0 ? '6px 0 0 6px' : i === 29 ? '0 6px 6px 0' : 0 }} />)}
        </div>
        <div className="d-flex gap-3">
          <SkBlock style={{ flex: 1 }} h={160} />
          <SkBlock w={220} h={160} />
        </div>
      </div>
      {/* DESEMPENHO */}
      <div className="m-0 w-100 p-3 border mt-3" style={{ borderRadius: 25, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <SkLine w="20%" h={14} />
        <div className="d-flex w-100 gap-3">
          <SkBlock style={{ flex: 2 }} h={200} />
          <SkBlock style={{ flex: 1 }} h={200} />
        </div>
        <SkBlock w="100%" h={180} />
      </div>
    </main>
  </div>
);

/** Skeleton para Dashboard */
export const SkeletonDashboard = () => (
  <div className="app-container">
    <main className="container-fluid pt-3 pb-4 px-4" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <SkLine w="30%" h={22} />
      <div className="d-flex gap-3">
        {[...Array(3)].map((_, i) => (
          <SkCard key={i} style={{ flex: 1 }}>
            <SkLine w="50%" h={13} mb={10} />
            <SkLine w="35%" h={28} mb={0} />
          </SkCard>
        ))}
      </div>
      <div className="d-flex gap-3">
        <SkCard style={{ flex: 2 }}><SkBlock w="100%" h={220} /></SkCard>
        <SkCard style={{ flex: 1 }}><SkBlock w="100%" h={220} /></SkCard>
      </div>
      <SkCard><SkBlock w="100%" h={200} /></SkCard>
    </main>
  </div>
);

/** Skeleton para Ciclo */
export const SkeletonCiclo = () => (
  <div className="app-container">
    <main className="container-fluid pt-3 pb-4 px-4" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <SkLine w="20%" h={22} />
      <div className="d-flex gap-3">
        <SkCard style={{ flex: 1 }}>
          {[...Array(7)].map((_, i) => (
            <div key={i} style={{ marginBottom: 16 }}>
              <div className="d-flex justify-content-between mb-1">
                <SkLine w="40%" h={13} mb={0} />
                <SkLine w={50} h={13} mb={0} />
              </div>
              <SkBlock w="100%" h={10} style={{ borderRadius: 999 }} />
            </div>
          ))}
        </SkCard>
        <SkCard style={{ width: 280 }}>
          <SkBlock w="100%" h={200} />
        </SkCard>
      </div>
    </main>
  </div>
);

/** Skeleton para Simulados */
export const SkeletonSimulados = () => (
  <div className="app-container">
    <main className="container-fluid pt-3 pb-4 px-4" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <SkLine w="25%" h={22} mb={0} />
        <SkLine w={120} h={34} mb={0} style={{ borderRadius: 8 }} />
      </div>
      <div className="d-flex flex-wrap gap-3">
        {[...Array(6)].map((_, i) => (
          <SkCard key={i} style={{ width: 'calc(33% - 1rem)', minWidth: 240 }}>
            <SkLine w="60%" h={16} mb={8} />
            <SkLine w="80%" h={13} mb={8} />
            <SkLine w="45%" h={13} mb={16} />
            <div className="d-flex gap-2">
              <SkLine w={70} h={28} mb={0} style={{ borderRadius: 8 }} />
              <SkLine w={70} h={28} mb={0} style={{ borderRadius: 8 }} />
            </div>
          </SkCard>
        ))}
      </div>
    </main>
  </div>
);

/** Skeleton para MateriaDetalhe */
export const SkeletonMateriaDetalhe = () => (
  <div className="app-container">
    <main className="container-fluid pt-3 pb-4 px-4" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="d-flex align-items-center gap-3 mb-2">
        <SkCircle size={48} />
        <div style={{ flex: 1 }}>
          <SkLine w="35%" h={20} mb={6} />
          <SkLine w="55%" h={13} mb={0} />
        </div>
      </div>
      <div className="d-flex gap-3">
        {[...Array(4)].map((_, i) => (
          <SkCard key={i} style={{ flex: 1 }}>
            <SkLine w="50%" h={13} mb={8} />
            <SkLine w="40%" h={24} mb={0} />
          </SkCard>
        ))}
      </div>
      <div className="d-flex gap-3">
        <SkCard style={{ flex: 1 }}><SkBlock w="100%" h={200} /></SkCard>
        <SkCard style={{ flex: 1 }}><SkBlock w="100%" h={200} /></SkCard>
      </div>
      <SkCard><SkBlock w="100%" h={160} /></SkCard>
    </main>
  </div>
);

/** Skeleton para Inserir (form) */
export const SkeletonInserir = () => (
  <div className="app-container">
    <main className="container-fluid pt-3 pb-4 px-4" style={{ maxWidth: 700, margin: '0 auto' }}>
      <SkLine w="30%" h={22} mb={24} />
      {[...Array(5)].map((_, i) => (
        <div key={i} style={{ marginBottom: 18 }}>
          <SkLine w="25%" h={13} mb={8} />
          <SkBlock w="100%" h={38} style={{ borderRadius: 8 }} />
        </div>
      ))}
      <SkLine w={120} h={38} mb={0} style={{ borderRadius: 8 }} />
    </main>
  </div>
);
