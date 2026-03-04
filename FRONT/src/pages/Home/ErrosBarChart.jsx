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

const ErrosBarChart = ({ erros, materia, height = 200 }) => {
  // DEBUG: logar itens do edital e erros recebidos
  console.log('ErrosBarChart - editalItems:', Array.isArray(materia?.edital) ? materia.edital : []);
  console.log('ErrosBarChart - erros:', erros);
  // Gera lista de itens do edital
  const editalItems = Array.isArray(materia?.edital) && materia.edital.length > 0 ? materia.edital : [];
  // Inicializa todos os itens do edital com zero
  const itemCounts = {};
  editalItems.forEach(item => {
    itemCounts[item] = 0;
  });
  // Conta erros por item do edital
  erros.forEach(e => {
    // Normaliza textos para comparação
    const normalize = s => (s || '').toLowerCase().replace(/\s+/g, ' ').trim();
    let found = editalItems.find(editalItem => normalize(editalItem) === normalize(e.editalItem));
    if (!found && e.editalItem) {
      found = editalItems.find(editalItem => normalize(editalItem).includes(normalize(e.editalItem)) || normalize(e.editalItem).includes(normalize(editalItem)));
    }
    if (found) {
      itemCounts[found] = (itemCounts[found] || 0) + 1;
    }
  });
  const labels = editalItems.length > 0 ? editalItems : ['Sem item'];
  const labelMap = {};
  labels.forEach(item => {
    let short = item.length > 30 ? item.slice(0, 30) + '...' : item;
    labelMap[short] = item;
  });
  const data = {
    labels: labels.map(l => l.length > 30 ? l.slice(0, 30) + '...' : l),
    datasets: [
      {
        label: `Erros por item do edital (${materia?.nome || ''})`,
        data: labels.map(l => itemCounts[l] || 0),
        backgroundColor: 'rgba(220,53,69,0.7)',
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
        backgroundColor: 'rgba(30,30,30,0.95)',
        titleColor: '#fff',
        bodyColor: '#ccc',
        borderColor: 'rgba(255,255,255,0.12)',
        borderWidth: 1,
        padding: 8,
        callbacks: {
          title: (tooltipItems) => {
            const label = tooltipItems[0].label;
            return labelMap[label] || label;
          }
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: { color: '#bbb' },
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
  // Altura dinâmica
  const dynamicHeight = Math.min(Math.max((data.labels.length * 28), 220), 1200);
  return (
  <div className="grafico-erro" style={{ background: 'transparent', border: 'none', borderRadius: 0, boxShadow: 'none', padding: 0, maxHeight: '1200px', overflowY: 'auto', width: '100%' }}>
      <div>
        <Bar data={data} options={options} height={dynamicHeight} />
      </div>
    </div>
  );
};

export default ErrosBarChart;
