import React from 'react';
import { Tooltip, Progress } from 'antd';
import { Programacao } from '../KanbanBlockProvider';

export interface WorkloadIndicatorProps {
  data: Programacao[];
  maxWorkload?: number;
}

export const WorkloadIndicator: React.FC<WorkloadIndicatorProps> = ({ 
  data, 
  maxWorkload = 100 
}) => {
  // Calcular métricas de carga de trabalho
  const calculateWorkloadMetrics = () => {
    const totalProgramacoes = data.length;
    const totalQuantity = data.reduce((sum, programacao) => sum + (programacao.qtd_op || 0), 0);
    
    // Distribuição por status/setor
    const statusDistribution = data.reduce((acc, programacao) => {
      const getAllStatusValues = (setoresAtuais: any): string[] => {
        if (Array.isArray(setoresAtuais)) {
          return setoresAtuais.map(item => String(item).toLowerCase());
        }
        if (typeof setoresAtuais === 'string') {
          try {
            const parsed = JSON.parse(setoresAtuais);
            if (Array.isArray(parsed)) {
              return parsed.map(item => String(item).toLowerCase());
            }
            return [(parsed.value || parsed.setor || setoresAtuais).toLowerCase()];
          } catch {
            return [setoresAtuais.replace(/['"]/g, '').toLowerCase()];
          }
        } else if (typeof setoresAtuais === 'object' && setoresAtuais !== null) {
          return [(setoresAtuais.value || setoresAtuais.setor || 'indefinido').toLowerCase()];
        }
        return ['indefinido'];
      };

      const statusValues = getAllStatusValues(programacao.setores_atuais);
      statusValues.forEach(status => {
        acc[status] = (acc[status] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    // Calcular porcentagem de carga baseada no número de programações
    const workloadPercentage = Math.min((totalProgramacoes / maxWorkload) * 100, 100);
    
    // Determinar nível de carga
    let workloadLevel: 'low' | 'medium' | 'high' = 'low';
    if (workloadPercentage > 70) workloadLevel = 'high';
    else if (workloadPercentage > 40) workloadLevel = 'medium';

    return {
      totalProgramacoes,
      totalQuantity,
      statusDistribution,
      workloadPercentage,
      workloadLevel
    };
  };

  const metrics = calculateWorkloadMetrics();

  // Cores para diferentes níveis de carga
  const getProgressColor = (level: string) => {
    switch (level) {
      case 'high': return '#ff4d4f';
      case 'medium': return '#faad14';
      case 'low': return '#52c41a';
      default: return '#d9d9d9';
    }
  };

  // Tooltip com detalhes da carga
  const tooltipContent = (
    <div className="workload-tooltip">
      <div><strong>Carga de Trabalho</strong></div>
      <div>Total de Programações: {metrics.totalProgramacoes}</div>
      <div>Quantidade Total: {metrics.totalQuantity.toLocaleString()}</div>
      <div style={{ marginTop: 8 }}>
        <strong>Setores:</strong>
      </div>
      {Object.entries(metrics.statusDistribution).map(([status, count]) => (
        <div key={status}>
          {status.replace('_', ' ').toUpperCase()}: {count}
        </div>
      ))}
    </div>
  );

  return (
    <div className="workload-indicator">
      <Tooltip title={tooltipContent} placement="top">
        <div className="workload-content">
          <div className="workload-count">
            <span className="workload-number">{metrics.totalProgramacoes}</span>
            <span className="workload-label">programações</span>
          </div>
          <Progress
            percent={metrics.workloadPercentage}
            size="small"
            strokeColor={getProgressColor(metrics.workloadLevel)}
            showInfo={false}
            className="workload-progress"
          />
          <div className="workload-qty">
            {metrics.totalQuantity > 0 && (
              <span className="workload-qty-text">
                {metrics.totalQuantity.toLocaleString()} pçs
              </span>
            )}
          </div>
        </div>
      </Tooltip>
    </div>
  );
}; 