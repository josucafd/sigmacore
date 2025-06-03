import React from 'react';
import { DragOverlay as DndDragOverlay } from '@dnd-kit/core';
import { Card } from '../board/Card';
import { Programacao } from '../KanbanBlockProvider';

export interface DragOverlayProps {
  activeId: string | null;
  data: Programacao[];
}

export const DragOverlay: React.FC<DragOverlayProps> = ({ activeId, data }) => {
  // Encontrar a programação que está sendo arrastada
  const activeProgramacao = data.find(prog => String(prog.id_programacao) === activeId);

  if (!activeProgramacao) {
    return null;
  }

  return (
    <DndDragOverlay>
      <div className="kanban-card-drag-overlay">
        <Card data={activeProgramacao} />
      </div>
    </DndDragOverlay>
  );
}; 