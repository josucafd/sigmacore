import React from 'react';
import { Tooltip, Progress } from 'antd';
import { ProductionOrder } from '../KanbanBlockProvider';

export interface WorkloadIndicatorProps {
  data: ProductionOrder[];
  maxWorkload?: number;
}

export const WorkloadIndicator: React.FC<WorkloadIndicatorProps> = ({ 
  data, 
  maxWorkload = 100 
}) => {
  // Calcular métricas de carga de trabalho
  const calculateWorkloadMetrics = () => {
    const totalOrders = data.length;
    const totalQuantity = data.reduce((sum, order) => sum + (order.qtd || 0), 0);
    
    // Distribuição por status
    const statusDistribution = data.reduce((acc, order) => {
      const getAllStatusValues = (status: any): string[] => {
        if (Array.isArray(status)) {
          return status.map(item => String(item).toLowerCase());
        }
        if (typeof status === 'string') {
          try {
            const parsed = JSON.parse(status);
            if (Array.isArray(parsed)) {
              return parsed.map(item => String(item).toLowerCase());
            }
            return [(parsed.value || parsed.status || status).toLowerCase()];
          } catch {
            return [status.replace(/['"]/g, '').toLowerCase()];
          }
        } else if (typeof status === 'object' && status !== null) {
          return [(status.value || status.status || 'indefinido').toLowerCase()];
        }
        return ['indefinido'];
      };

      const statusValues = getAllStatusValues(order.status);
      statusValues.forEach(status => {
        acc[status] = (acc[status] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    // Calcular porcentagem de carga baseada no número de ordens
    const workloadPercentage = Math.min((totalOrders / maxWorkload) * 100, 100);
    
    // Determinar nível de carga
    let workloadLevel: 'low' | 'medium' | 'high' = 'low';
    if (workloadPercentage > 70) workloadLevel = 'high';
    else if (workloadPercentage > 40) workloadLevel = 'medium';

    return {
      totalOrders,
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
      <div>Total de Ordens: {metrics.totalOrders}</div>
      <div>Quantidade Total: {metrics.totalQuantity.toLocaleString()}</div>
      <div style={{ marginTop: 8 }}>
        <strong>Status:</strong>
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
            <span className="workload-number">{metrics.totalOrders}</span>
            <span className="workload-label">ordens</span>
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