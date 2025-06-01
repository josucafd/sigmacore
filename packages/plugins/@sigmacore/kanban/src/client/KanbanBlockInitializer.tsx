import React from 'react';
import { KanbanBlockProvider } from './KanbanBlockProvider';
import { Board } from './board/Board';

export const KanbanBlockInitializer: React.FC = () => {
  return (
    <div style={{ padding: '20px' }}>
      <KanbanBlockProvider>
        <Board />
      </KanbanBlockProvider>
    </div>
  );
};

export default KanbanBlockInitializer; 