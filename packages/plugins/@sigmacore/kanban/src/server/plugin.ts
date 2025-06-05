import { Plugin } from '@nocobase/server';
import path from 'path';

export class KanbanServer extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {
    // Carregar as coleções do diretório collections
    await this.importCollections(path.resolve(__dirname, 'collections'));
    
    // Não é mais necessário registrar actions customizadas, vamos usar as collections diretamente
  }

  async install() {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default KanbanServer;
