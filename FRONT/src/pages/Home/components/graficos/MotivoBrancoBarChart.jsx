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

const MotivoBrancoBarChart = ({ brancos, materia }) => {
  // Agrupa brancos por motivo
  const motivoCounts = {};
  brancos.forEach(b => {
    let motivo = b.motivoBranco || 'Sem motivo';
    if (motivo.length > 30) motivo = motivo.slice(0, 30) + '...';
    motivoCounts[motivo] = (motivoCounts[motivo] || 0) + 1;
  });
  let labels = Object.keys(motivoCounts);
  labels = [...labels].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const labelMap = {};
  labels.forEach(item => {
    let short = item.length > 30 ? item.slice(0, 30) + '...' : item;
    labelMap[short] = item;
  });
  // Usa a cor da matéria se existir, senão cor padrão
  const corMateria = materia?.cor || '#7dbbff';
  const data = {
    labels: labels.map(l => l.length > 30 ? l.slice(0, 30) + '...' : l),
    datasets: [
      {
        label: 'Brancos:',
        data: labels.map(l => motivoCounts[l] || 0),
        backgroundColor: corMateria,
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
          callback: function(value) { if (Number.isInteger(value)) return value; return ''; }
        }
      },
      y: {
        grid: { display: false },
        ticks: {
          font: { size: 9 },
          align: 'start',
          color: '#bbb',
        }
      }
    }
  };
  return (
  <div className="grafico-motivo-branco p-0 border-0 rounded-0 shadow-none bg-transparent">
    <div className="mx-auto w-100">
      <Bar data={data} options={options} />
    </div>
  </div>
  );
};

export default MotivoBrancoBarChart;
