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
    console.log('🚀 Carregando plugin Kanban Sigmacore');
    
    // Registrar componentes
    this.app.addComponents({ 
      Kanban,
      KanbanBlockInitializer,
      KanbanBlockProvider,
      Board,
      Column,
      Card
    });

    console.log('✅ Componentes registrados:', { 
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
      console.log('🛣️ Rota adicionada: /admin/kanban-producao');
    } catch (error) {
      console.error('❌ Erro ao adicionar rota:', error);
    }

    // Adicionar log do schemaInitializerManager para debug
    console.log('📋 Schema Initializer Manager:', this.app.schemaInitializerManager);
  }
}

export { Kanban, KanbanBlockInitializer, KanbanBlockProvider, Board, Column, Card };
export default KanbanClient;
