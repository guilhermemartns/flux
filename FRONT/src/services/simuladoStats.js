import api from './api';

export async function getSimuladoStats(simuladoId, userId, projetoId) {
  try {
    const resp = await api.get('/dashboard/resumos', {
      params: { userId, projetoId }
    });
    const resumo = resp.data[simuladoId];
    if (!resumo) return { acertos: 0, erros: 0, branco: 0, liquido: 0 };
    const liquido = resumo.acertos - (resumo.erros / 2);
    return { acertos: resumo.acertos, erros: resumo.erros, branco: resumo.brancos, liquido };
  } catch (err) {
    return { acertos: 0, erros: 0, branco: 0, liquido: 0 };
  }
}
