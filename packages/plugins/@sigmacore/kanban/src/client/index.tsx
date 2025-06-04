import { Plugin } from '@nocobase/client';
import { Kanban } from './Kanban';
import { KanbanBlockInitializer } from './KanbanBlockInitializer';
import { KanbanBlockProvider } from './KanbanBlockProvider';
import { Board } from './board/Board';
import { Column } from './board/Column';
import { Card } from './board/Card';
import './kanban.css';

export class KanbanClient extends Plugin {
  async afterAdd() {
    // await this.app.pm.add()
  }

  async beforeLoad() {}

  // You can get and modify the app instance here
  async load() {
    // Registrar componentes
    this.app.addComponents({ 
      Kanban,
      KanbanBlockInitializer,
      KanbanBlockProvider,
      Board,
      Column,
      Card
    });

    // Adicionar rota para testar o Kanban
    try {
      this.app.router.add('admin.kanban-producao', {
        path: '/admin/kanban-producao',
        Component: KanbanBlockInitializer,
      });
    } catch (error) {
      console.error('❌ Erro ao adicionar rota:', error);
    }
  }
}

export { Kanban, KanbanBlockInitializer, KanbanBlockProvider, Board, Column, Card };
export default KanbanClient;
