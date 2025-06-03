import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Card } from './Card';
import { Programacao } from '../KanbanBlockProvider';
import { WorkloadIndicator } from '../components/WorkloadIndicator';

export interface ColumnProps {
  title: string;
  data: Programacao[];
  columnKey: string;
  backgroundColor?: string;
  isToday?: boolean;
}

export const Column: React.FC<ColumnProps> = ({ 
  title, 
  data, 
  columnKey, 
  backgroundColor = '#ffffff',
  isToday = false
}) => {
  console.log(`📊 Column ${title} - data:`, data);

  // Configurar como área de drop
  const { isOver, setNodeRef } = useDroppable({
    id: columnKey,
  });

  return (
    <div 
      ref={setNodeRef}
      className={`kanban-column ${isOver ? 'kanban-column-drop-over' : ''} ${isToday ? 'kanban-column-today' : ''}`}
      style={{ backgroundColor, width: '100%' }}
      data-weekday={columnKey}
    >
      <div className="kanban-column-header">
        <div className="kanban-column-title-section">
          <h3 className="kanban-column-title">
            {title}
            {isToday && <span className="kanban-today-indicator"> (Hoje)</span>}
          </h3>
          <span className="kanban-column-count">{data.length}</span>
        </div>
        <WorkloadIndicator data={data} maxWorkload={10} />
      </div>
      
      <div 
        className="kanban-column-cards"
        style={{ 
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'nowrap',
          overflowX: 'auto',
          width: '100%'
        }}
      >
        {data.map((programacao) => (
          <Card
            key={programacao.id_programacao}
            data={programacao}
          />
        ))}
        
        {data.length === 0 && (
          <div className="kanban-column-empty">
            <div className="kanban-column-empty-content">
              <span className="kanban-column-empty-text">
                Nenhuma programação para {title.toLowerCase()}
              </span>
              {isOver && (
                <span className="kanban-column-drop-hint">
                  Solte aqui para reprogramar
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Column; 