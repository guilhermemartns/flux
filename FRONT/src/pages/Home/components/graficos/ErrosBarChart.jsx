import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Recebe page (número da página, 0 = mais quente) e totalPages
const ErrosBarChart = ({ erros, materia, editalItens, page = 0, totalPages = 1 }) => {
  // Usa apenas os itens filtrados se fornecido
  const editalItems = Array.isArray(editalItens) && editalItens.length > 0
    ? editalItens
    : (Array.isArray(materia?.edital) && materia.edital.length > 0 ? materia.edital : []);
  // Inicializa todos os itens do edital com zero
  const itemCounts = {};
  editalItems.forEach(item => {
    itemCounts[item] = 0;
  });
  // Conta erros por item do edital
  erros.forEach(e => {
    const normalize = s => (s || '').toLowerCase().replace(/\s+/g, ' ').trim();
    let found = editalItems.find(editalItem => normalize(editalItem) === normalize(e.editalItem));
    if (!found && e.editalItem) {
      found = editalItems.find(editalItem => normalize(editalItem).includes(normalize(e.editalItem)) || normalize(e.editalItem).includes(normalize(editalItem)));
    }
    if (found) {
      itemCounts[found] = (itemCounts[found] || 0) + 1;
    }
  });
  let labels = editalItems.length > 0 ? editalItems : ['Sem item'];
  // Ordena labels do maior para o menor valor
  labels = [...labels].sort((a, b) => (itemCounts[b] || 0) - (itemCounts[a] || 0));
  const labelMap = {};
  labels.forEach(item => {
    let short = item.length > 30 ? item.slice(0, 30) + '...' : item;
    labelMap[short] = item;
  });
  // Heatmap: do vermelho (quente) ao verde (frio) conforme a página
  function getHeatColor(page, totalPages, corPadrao = '#b899eb') {
    // Se só tem uma página, sempre vermelho (quente)
    if (totalPages <= 1) return 'rgb(255,77,77)';
    const percent = page / (totalPages - 1);
    if (percent <= 0.5) {
      // vermelho (#ff4d4d) -> amarelo (#ffe066)
      const r = 255;
      const g = Math.round(77 + (224 - 77) * (percent / 0.5));
      const b = Math.round(77 + (102 - 77) * (percent / 0.5));
      return `rgb(${r},${g},${b})`;
    } else {
      // amarelo (#ffe066) -> verde (#4dff88)
      const r = Math.round(255 + (77 - 255) * ((percent - 0.5) / 0.5));
      const g = Math.round(224 + (255 - 224) * ((percent - 0.5) / 0.5));
      const b = Math.round(102 + (136 - 102) * ((percent - 0.5) / 0.5));
      return `rgb(${r},${g},${b})`;
    }
  }
  const corMateria = materia?.cor || '#b899eb';
  const heatColor = getHeatColor(page, totalPages, corMateria);
  const data = {
    labels: labels.map(l => l.length > 30 ? l.slice(0, 30) + '...' : l),
    datasets: [
      {
        label: 'Erros:',
        data: labels.map(l => itemCounts[l] || 0),
        backgroundColor: heatColor,
        barThickness: 18,
        categoryPercentage: 0.7,
        barPercentage: 0.8,
      },
    ],
  };
  const options = {
    indexAxis: 'y',
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: false },
      tooltip: {
        callbacks: {
          title: (tooltipItems) => {
            const label = tooltipItems[0].label;
            const fullLabel = labelMap[label] || label;
            return fullLabel.length > 15 ? fullLabel.slice(0, 15) + '...' : fullLabel;
          }
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: { color: '#2d2d2d' },
        ticks: {
          stepSize: 1,
          color: '#bbb',
          font: { size: 10 },
          callback: function(value) { if (Number.isInteger(value)) return value; return ''; }
        }
      },
      y: {
        grid: { display: false },
        ticks: {
          font: { size: 8 },
          align: 'start',
          color: '#bbb',
        }
      }
    }
  };
  if (!erros || erros.length === 0) return null;
  const hasData = data.datasets[0].data.some(v => v > 0);
  if (!hasData) return null;
  return (
    <div className="grafico-erro p-0 border-0 rounded-0 shadow-none bg-transparent w-100">
      <div className="w-100">
        <Bar data={data} options={options} />
      </div>
    </div>
  );
};

export default ErrosBarChart;