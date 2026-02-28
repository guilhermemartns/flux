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

const MotivoErroBarChart = ({ erros, materia, height = 200 }) => {
  // Agrupa erros por motivo
  const motivoCounts = {};
  erros.forEach(e => {
    let motivo = e.motivoErro || 'Sem motivo';
    if (motivo.length > 30) motivo = motivo.slice(0, 30) + '...';
    motivoCounts[motivo] = (motivoCounts[motivo] || 0) + 1;
  });
  const labels = Object.keys(motivoCounts);
  // Mapeia os labels encurtados para o texto completo
  const labelMap = {};
  erros.forEach(e => {
    let short = e.motivoErro || 'Sem motivo';
    if (short.length > 30) short = short.slice(0, 30) + '...';
    labelMap[short] = e.motivoErro || 'Sem motivo';
  });
  const data = {
    labels: labels.map(l => l.length > 30 ? l.slice(0, 30) + '...' : l),
    datasets: [
      {
        label: `Erros por motivo (${materia})`,
        data: labels.map(l => motivoCounts[l]),
        backgroundColor: 'rgba(53,110,220,0.7)',
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
        grid: {
          color: '#bbb',
        },
        ticks: {
          stepSize: 1,
          precision: 0,
          color: '#bbb',
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
          color: '#bbb',
        }
      }
    }
  };
  // Calcula altura dinâmica: 40px por motivo, mínimo 220px, máximo 700px
  const dynamicHeight = Math.min(Math.max((data.labels.length * 40), 220), 700);
  return (
    <div className="grafico-motivo" style={{ background: 'transparent', border: 'none', borderRadius: 0, boxShadow: 'none', padding: 0, maxHeight: '700px', overflowY: 'auto' }}>
      <div style={{ margin: '0 auto', width: 'fit-content' }}>
        <Bar data={data} options={options} height={dynamicHeight} />
      </div>
    </div>
  );
}

export default MotivoErroBarChart;
