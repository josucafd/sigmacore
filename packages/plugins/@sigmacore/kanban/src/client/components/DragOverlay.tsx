import React from 'react';
import { DragOverlay as DndDragOverlay } from '@dnd-kit/core';
import { Card } from '../board/Card';
import { ProductionOrder } from '../KanbanBlockProvider';

export interface DragOverlayProps {
  activeId: string | null;
  data: ProductionOrder[];
}

export const DragOverlay: React.FC<DragOverlayProps> = ({ activeId, data }) => {
  // Encontrar a ordem que está sendo arrastada
  const activeOrder = data.find(order => String(order.id) === activeId);

  if (!activeOrder) {
    return null;
  }

  return (
    <DndDragOverlay>
      <div className="kanban-card-drag-overlay">
        <Card data={activeOrder} />
      </div>
    </DndDragOverlay>
  );
}; 