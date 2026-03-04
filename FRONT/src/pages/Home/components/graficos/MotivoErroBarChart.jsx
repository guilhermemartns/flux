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

const MotivoErroBarChart = ({ erros, materia }) => {
  // Agrupa erros por motivo
  const motivoCounts = {};
  erros.forEach(e => {
    let motivo = e.motivoErro || 'Sem motivo';
    if (motivo.length > 30) motivo = motivo.slice(0, 30) + '...';
    motivoCounts[motivo] = (motivoCounts[motivo] || 0) + 1;
  });
  let labels = Object.keys(motivoCounts);
  labels = [...labels].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  // Mapeia os labels encurtados para o texto completo
  const labelMap = {};
  erros.forEach(e => {
    let short = e.motivoErro || 'Sem motivo';
    if (short.length > 30) short = short.slice(0, 30) + '...';
    labelMap[short] = e.motivoErro || 'Sem motivo';
  });
  // Usa a cor da matéria se existir, senão cor padrão
  const corMateria = materia?.cor || '#b899eb';
  const data = {
    labels: labels.map(l => l.length > 30 ? l.slice(0, 30) + '...' : l),
    datasets: [
      {
        label: 'Erros:',
        data: labels.map(l => motivoCounts[l]),
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
      legend: {
        display: false
      },
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
            const fullLabel = labelMap[label] || label;
            return fullLabel.length > 15 ? fullLabel.slice(0, 15) + '...' : fullLabel;
          }
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: {
          color: '#2d2d2d',
        },
        ticks: {
          stepSize: 1,
          precision: 0,
          color: 'var(--text-light)',
          callback: function(value) {
            if (Number.isInteger(value)) return value;
            return '';
          }
        }
      },
      y: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 10,
          },
          align: 'start',
          color: 'var(--text-light)',
        }
      }
    }
  };
  return (
    <div className="grafico-motivo p-0 border-0 rounded-0 shadow-none bg-transparent">
      <div className="mx-auto w-100">
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}

export default MotivoErroBarChart;