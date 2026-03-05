import React, { useEffect, useState } from 'react';
import { SkLine, SkBlock, SkCard } from '../../components/Skeleton';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
const EyeIcon = ({ open }) => (
  <span style={{ marginLeft: '0.5em', color: 'rgb(25, 118, 210)', cursor: 'pointer' }}>
    {open ? <FaEye style={{ fontSize: '20px' }} /> : <FaEyeSlash style={{ fontSize: '20px' }} />}
  </span>
);
import api from '../../services/api';
import ErrosBarChart from './ErrosBarChart';
import MotivoErroBarChart from './MotivoErroBarChart';

function Erros() {
  const [expandedMateria, setExpandedMateria] = useState(null);
  const [errosPorMateria, setErrosPorMateria] = useState({});
  const [loading, setLoading] = useState(true);
  const [simulados, setSimulados] = useState([]);
  const [simuladosSelecionados, setSimuladosSelecionados] = useState([]);
  const [errosRaw, setErrosRaw] = useState({});

  useEffect(() => {
    async function fetchErros() {
      setLoading(true);
      const projetoSelecionado = localStorage.getItem('projetoSelecionado') || '';
      const user = JSON.parse(localStorage.getItem('user'));
      const userId = user?.id || '';
      if (!userId || !projetoSelecionado) {
        setErrosRaw({});
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('/dashboard/erros-detalhados', { params: { userId, projetoId: projetoSelecionado } });
        let allSimulados = [];
        Object.values(res.data).forEach(arr => {
          arr.forEach(e => {
            if (!allSimulados.some(s => s.simulado === e.simulado && s.dataSim === e.dataSim)) {
              allSimulados.push({ simulado: e.simulado, dataSim: e.dataSim });
            }
          });
        });
        allSimulados.sort((a, b) => new Date(b.dataSim) - new Date(a.dataSim));
        setSimulados(allSimulados);
        setSimuladosSelecionados(allSimulados.slice(0, 5).map(s => s.simulado));
        setErrosRaw(res.data);
      } catch (error) {
        setErrosRaw({});
        setLoading(false);
        window.alert('Erro ao buscar dados do mapa de erros. Verifique se há respostas cadastradas para este projeto e usuário.');
        return;
      }
      setLoading(false);
    }
    fetchErros();
  }, []);

  useEffect(() => {
    if (!loading && simuladosSelecionados.length > 0 && errosRaw) {
      const filtrado = {};
      Object.keys(errosRaw).forEach(materia => {
        filtrado[materia] = errosRaw[materia].filter(e => simuladosSelecionados.includes(e.simulado));
      });
      setErrosPorMateria(filtrado);
    }
  }, [simuladosSelecionados, errosRaw, loading]);

  return (
    <div className="app-container">
      <main className="container gap-2">
        <div className="titulo-pagina"><h2>Erros por Matéria</h2></div>
        <div style={{ marginBottom: '1em' }}>
          <label>Selecionar últimos simulados:&nbsp;</label>
          <select
            className="form-select input-dark"
            value={simuladosSelecionados.length}
            onChange={e => {
              const qtd = Number(e.target.value);
              setSimuladosSelecionados(simulados.slice(0, qtd).map(s => s.simulado));
            }}
            style={{ maxWidth: '220px', display: 'inline-block' }}
          >
            {[1, 2, 3, 4, 5].map(qtd => (
              <option key={qtd} value={qtd}>Últimos {qtd} simulados</option>
            ))}
          </select>
        </div>
        {loading ? (
          <SkCard>
            {[...Array(5)].map((_, i) => (
              <div key={i} style={{ marginBottom: 16 }}>
                <SkLine w="45%" h={16} mb={10} />
                <SkBlock w="100%" h={80} style={{ borderRadius: 8 }} />
              </div>
            ))}
          </SkCard>
        ) : (
          Object.keys(errosPorMateria).length === 0 ? (
            <div style={{ textAlign: 'center', color: '#888', padding: '2em' }}>Nenhum erro encontrado.</div>
          ) : (
            Object.entries(errosPorMateria).map(([materia, erros]) => (
              <div key={materia} className="card-padrao" >
                <strong style={{ cursor: 'pointer', userSelect: 'none', marginBottom: 0 }} onClick={() => setExpandedMateria(expandedMateria === materia ? null : materia)}>
                  {materia} <EyeIcon open={expandedMateria === materia} />
                </strong>
                {expandedMateria === materia && (
                  <>
                    <div>
                      <div style={{ width: '100%', maxWidth: '100%' }}>
                        <ErrosBarChart erros={erros} materia={materia} height={200} />
                      </div>
                      <div style={{ width: '100%', maxWidth: '100%', marginTop: '2em' }}>
                        <MotivoErroBarChart erros={erros} materia={materia} height={200} />
                      </div>
                    </div>
                    {erros.length === 0 ? (
                      <div style={{ color: '#888' }}>Nenhum erro nesta matéria.</div>
                    ) : (
                      <table className="table table-bordered" style={{ background: '#fff', marginTop: '1em' }}>
                        <thead>
                          <tr>
                            <th>Simulado</th>
                            <th>Data</th>
                            <th>Nº Questão</th>
                            <th>Motivo do Erro</th>
                            <th>Item do Edital</th>
                          </tr>
                        </thead>
                        <tbody>
                          {erros.map((erro, idx) => (
                            <tr key={idx}>
                              <td>{erro.simulado}</td>
                              <td>{erro.dataSim ? new Date(erro.dataSim).toLocaleDateString('pt-BR') : ''}</td>
                              <td>{erro.numeroQuestao}</td>
                              <td>{erro.motivoErro}</td>
                              <td>{erro.editalItem ? erro.editalItem.slice(0, 30) + (erro.editalItem.length > 30 ? '...' : '') : ''}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </>
                )}
              </div>
            ))
          )
        )}
      </main>
    </div>
  );
}

export default Erros;
