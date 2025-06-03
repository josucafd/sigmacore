import React from 'react';
import { Card } from './Card';
import { useKanbanBlockContext } from '../KanbanBlockProvider';
import { Empty } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';
import { WorkloadIndicator } from '../components/WorkloadIndicator';

export const OverdueLane: React.FC = () => {
  const { overdueCards, showOverdueSection } = useKanbanBlockContext();

  if (!showOverdueSection || overdueCards.length === 0) {
    return null;
  }

  return (
    <div className="kanban-columns-container overdue-section">
      <div 
        className="kanban-column"
        style={{ 
          backgroundColor: '#fff1f0', 
          borderLeftColor: '#ff4d4f',
          borderColor: '#ffccc7'
        }}
        data-weekday="atrasados"
      >
        <div className="kanban-column-header">
          <div className="kanban-column-title-section">
            <h3 className="kanban-column-title" style={{ color: '#cf1322' }}>
              <CalendarOutlined style={{ marginRight: '6px' }} />
              Atrasados
            </h3>
            <span className="kanban-column-count" style={{ backgroundColor: '#fff2f0', color: '#cf1322', borderColor: '#ffccc7' }}>
              {overdueCards.length}
            </span>
          </div>
          <WorkloadIndicator data={overdueCards} maxWorkload={15} />
        </div>
        
        <div className="kanban-column-cards">
          {overdueCards.map((programacao) => (
            <Card
              key={`overdue-${programacao.id_programacao}`}
              data={programacao}
            />
          ))}
          
          {overdueCards.length === 0 && (
            <div className="kanban-column-empty">
              <div className="kanban-column-empty-content">
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Nenhuma programação em atraso"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 