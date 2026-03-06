import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../auth.jsx';
import { Folder, ChevronDown, ChevronRight, Check, X, File, Hash } from 'react-feather';
import { usePageTitle } from '../../components/PageTitleContext';
import { SkeletonSimulados } from '../../components/Skeleton';

function DashboardQuestoes() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { setTitle } = usePageTitle();

  const [loading, setLoading] = useState(true);
  const [baterias, setBaterias] = useState([]);
  const [resumos, setResumos] = useState({});
  const [expandedBat, setExpandedBat] = useState(null);
  const [expandedMateria, setExpandedMateria] = useState({});

  useEffect(() => {
    setTitle('Dashboard — Questões');
    document.title = 'FLUX | Dashboard Questões';
  }, [setTitle]);

  useEffect(() => {
    const projetoId = localStorage.getItem('projetoSelecionado');
    if (!projetoId || !user?.id) {
      setLoading(false);
      return;
    }
    async function load() {
      try {
        const [batRes, resumoRes] = await Promise.all([
          api.get('/baterias', { params: { userId: user.id, projetoId } }),
          api.get('/baterias/resumos', { params: { userId: user.id, projetoId } }),
        ]);
        setBaterias(batRes.data.filter(b => b.projetoId === projetoId));
        setResumos(resumoRes.data || {});
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  const projetoSelecionado = localStorage.getItem('projetoSelecionado');

  if (loading) return <SkeletonSimulados />;

  if (!projetoSelecionado) {
    return (
      <div className="app-container d-flex flex-column justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
        <Folder size={56} className="mb-3 text-secondary" />
        <h4 className="mb-3 fs-6 text-secondary">Nenhum projeto selecionado.</h4>
        <button className="btn btn-primary-primary px-4 py-2" onClick={() => navigate('/projeto')}>Ir para Projetos</button>
      </div>
    );
  }

  if (baterias.length === 0) {
    return (
      <div className="app-container d-flex flex-column justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
        <Folder size={56} className="mb-3 text-secondary" />
        <h4 className="mb-3 fs-6 text-secondary">Nenhuma bateria encontrada.<br />Cadastre baterias para ver o dashboard.</h4>
        <button className="btn btn-primary-primary px-4 py-2" onClick={() => navigate('/questoes')}>Ir para Questões</button>
      </div>
    );
  }

  // Resumo consolidado por matéria (todas as baterias)
  const consolidado = {};
  Object.values(resumos).forEach(r => {
    (r.materias || []).forEach(m => {
      if (!consolidado[m.nome]) consolidado[m.nome] = { acertos: 0, erros: 0, brancos: 0, topicos: {} };
      consolidado[m.nome].acertos += m.acertos;
      consolidado[m.nome].erros += m.erros;
      consolidado[m.nome].brancos += m.brancos;
      Object.entries(m.topicos || {}).forEach(([topico, stats]) => {
        if (!consolidado[m.nome].topicos[topico]) consolidado[m.nome].topicos[topico] = { acertos: 0, erros: 0, brancos: 0 };
        consolidado[m.nome].topicos[topico].acertos += stats.acertos;
        consolidado[m.nome].topicos[topico].erros += stats.erros;
        consolidado[m.nome].topicos[topico].brancos += stats.brancos;
      });
    });
  });

  function StatBadges({ acertos, erros, brancos }) {
    const liquido = acertos - erros;
    const total = acertos + erros + brancos;
    const perc = total > 0 ? ((liquido / total) * 100).toFixed(1) : '0.0';
    return (
      <div className="d-flex align-items-center gap-2 fw-bold" style={{ fontSize: '0.85em' }}>
        <span title="Acertos" className="text-success d-flex align-items-center gap-1"><Check size={12} /> {acertos}</span>
        <span title="Erros" className="text-danger d-flex align-items-center gap-1"><X size={12} /> {erros}</span>
        <span title="Brancos" className="text-warning d-flex align-items-center gap-1"><File size={12} /> {brancos}</span>
        <span title="Líquido" className="badge bg-primary-primary4 text-primary-primary5 rounded d-flex align-items-center gap-1"><Hash size={12} /> {liquido}</span>
        <span title="% Líquido" className="badge bg-info text-dark rounded">{perc}%</span>
      </div>
    );
  }

  return (
    <div className="app-container">
      <main className="container-fluid">
        {/* Resumo geral por matéria */}
        <div className="mb-4">
          <h6 className="fw-bold text-secondary mb-2" style={{ fontSize: '0.78em', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Desempenho por Matéria (todas as baterias)</h6>
          {Object.entries(consolidado).length === 0 ? (
            <p className="text-secondary small">Nenhuma resposta registrada ainda.</p>
          ) : (
            Object.entries(consolidado).map(([materia, dados]) => (
              <div key={materia} className="card-padrao2 mb-2 fadein">
                <div
                  className="d-flex align-items-center justify-content-between pointer py-1 px-2"
                  onClick={() => setExpandedMateria(prev => ({ ...prev, [materia]: !prev[materia] }))}
                >
                  <div className="d-flex align-items-center gap-2">
                    {expandedMateria[materia] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    <span className="fw-bold">{materia}</span>
                  </div>
                  <StatBadges acertos={dados.acertos} erros={dados.erros} brancos={dados.brancos} />
                </div>
                {expandedMateria[materia] && Object.entries(dados.topicos).length > 0 && (
                  <div className="mt-1 ps-4">
                    {Object.entries(dados.topicos).map(([topico, ts]) => (
                      <div key={topico} className="d-flex align-items-center justify-content-between py-1 px-2" style={{ borderTop: '1px solid var(--border-color)', fontSize: '0.9em' }}>
                        <span className="text-secondary">{topico}</span>
                        <StatBadges acertos={ts.acertos} erros={ts.erros} brancos={ts.brancos} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Por bateria */}
        <h6 className="fw-bold text-secondary mb-2" style={{ fontSize: '0.78em', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Por Bateria</h6>
        {[...baterias].reverse().map(bat => {
          const r = resumos[bat.id] || { acertos: 0, erros: 0, brancos: 0, materias: [] };
          const isExpanded = expandedBat === bat.id;
          return (
            <div key={bat.id} className="card-padrao2 mb-2 fadein">
              <div
                className="d-flex align-items-center justify-content-between pointer py-1 px-2"
                onClick={() => setExpandedBat(isExpanded ? null : bat.id)}
              >
                <div className="d-flex align-items-center gap-2">
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  <span className="fw-bold">{bat.titulo}</span>
                  <span className="small text-secondary">
                    {(() => {
                      const d = new Date(bat.dataBat);
                      d.setHours(d.getHours() + d.getTimezoneOffset() / 60);
                      return d.toLocaleDateString('pt-BR');
                    })()}
                  </span>
                  <span className="badge bg-secondary rounded" style={{ fontSize: '0.75em' }}>{bat.quanQuest}q</span>
                </div>
                <StatBadges acertos={r.acertos} erros={r.erros} brancos={r.brancos} />
              </div>
              {isExpanded && r.materias.length > 0 && (
                <div className="mt-1 ps-4">
                  {r.materias.map(m => (
                    <div key={m.nome}>
                      <div className="d-flex align-items-center justify-content-between py-1 px-2" style={{ borderTop: '1px solid var(--border-color)', fontSize: '0.9em' }}>
                        <span className="fw-semibold">{m.nome}</span>
                        <StatBadges acertos={m.acertos} erros={m.erros} brancos={m.brancos} />
                      </div>
                      {Object.entries(m.topicos || {}).map(([topico, ts]) => (
                        <div key={topico} className="d-flex align-items-center justify-content-between py-1 px-2 ps-4" style={{ fontSize: '0.85em' }}>
                          <span className="text-secondary">{topico}</span>
                          <StatBadges acertos={ts.acertos} erros={ts.erros} brancos={ts.brancos} />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </main>
    </div>
  );
}

export default DashboardQuestoes;
