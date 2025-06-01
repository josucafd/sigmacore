import React from 'react';
import { KanbanBlockProvider } from './KanbanBlockProvider';
import { Board } from './board/Board';

export interface KanbanProps {
  collection?: string;
  resource?: string;
  params?: any;
  [key: string]: any;
}

export const Kanban: React.FC<KanbanProps> = (props) => {
  return (
    <KanbanBlockProvider {...props}>
      <Board />
    </KanbanBlockProvider>
  );
};

export default Kanban; 