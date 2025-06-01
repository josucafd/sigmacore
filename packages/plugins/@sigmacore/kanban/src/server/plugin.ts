import { Plugin } from '@nocobase/server';
import path from 'path';

export class KanbanServer extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {
    // Carregar as coleções do diretório collections
    await this.importCollections(path.resolve(__dirname, 'collections'));
    
    // Registrar actions customizadas para o kanban se necessário
    this.app.resource({
      name: 'production_orders',
      actions: {
        // Pode adicionar actions customizadas aqui se necessário
        // Por exemplo: kanbanData, updateStatus, etc.
      },
    });
  }

  async install() {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default KanbanServer;
