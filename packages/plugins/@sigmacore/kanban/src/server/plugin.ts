import { Plugin } from '@nocobase/server';
import path from 'path';

export class KanbanServer extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {
    // Carregar as coleções do diretório collections
    await this.importCollections(path.resolve(__dirname, 'collections'));
    
    // Registrar actions customizadas para o kanban
    this.app.resource({
      name: 'programacoes',
      actions: {
        // Action customizada para buscar dados do kanban com a query SQL específica
        kanbanData: async (ctx, next) => {
          try {
            const { db } = this.app;
            
            // Query SQL customizada para buscar dados do kanban
            const query = `
              WITH RankedPhotos AS (
                  SELECT 
                      fp.id_referencia,
                      fp.url,
                      ROW_NUMBER() OVER (
                          PARTITION BY fp.id_referencia 
                          ORDER BY 
                              CASE fp.suffix 
                                  WHEN 'F' THEN 1 
                                  WHEN 'P' THEN 2 
                                  WHEN 'T' THEN 3 
                                  ELSE 4 
                              END
                      ) AS rn
                  FROM public.tb_fotos_pilotos fp
              )
              SELECT 
                  p.id_programacao,
                  p.data_termino,
                  p.op_interna,
                  p.op_cliente,
                  p.qtd_op,
                  p.setores_atuais,
                  r.referencia,
                  p.tipo_op,
                  p.status_impresso,
                  rp.url AS foto_piloto_url
              FROM 
                  public.tb_programacoes p
              LEFT JOIN 
                  public.tb_referencias r 
                  ON p.id_referencia = r.id_referencia
              LEFT JOIN 
                  RankedPhotos rp 
                  ON r.id_referencia = rp.id_referencia AND rp.rn = 1
              WHERE 
                  p.status_op = 'EM PRODUÇÃO'
              ORDER BY 
                  p.id_programacao DESC
            `;
            
            const [results] = await db.sequelize.query(query);
            
            // Estrutura de resposta compatível com NocoBase
            ctx.body = {
              data: results || [], // Garantir que sempre seja um array
              meta: {
                count: Array.isArray(results) ? results.length : 0,
                totalCount: Array.isArray(results) ? results.length : 0
              }
            };
            
            console.log('🔄 Dados retornados da API:', {
              count: Array.isArray(results) ? results.length : 0,
              sample: Array.isArray(results) && results.length > 0 ? results[0] : null
            });
            
          } catch (error) {
            console.error('Erro ao buscar dados do kanban:', error);
            
            // Retornar estrutura vazia em caso de erro
            ctx.body = {
              data: [],
              meta: {
                count: 0,
                totalCount: 0
              }
            };
          }
          
          await next();
        },
        
        // Action para atualizar a data_termino de uma programação
        updateDataTermino: async (ctx, next) => {
          try {
            const { filterByTk } = ctx.action.params;
            const { data_termino } = ctx.request.body;
            
            const { db } = this.app;
            
            // Usar query SQL direta para atualizar na tabela real
            const updateQuery = `
              UPDATE public.tb_programacoes 
              SET data_termino = $1 
              WHERE id_programacao = $2
            `;
            
            await db.sequelize.query(updateQuery, {
              replacements: [data_termino, filterByTk]
            });
            
            ctx.body = { success: true };
            
            console.log(`✅ Programação ${filterByTk} atualizada com data_termino: ${data_termino}`);
            
          } catch (error) {
            console.error('Erro ao atualizar data_termino:', error);
            ctx.throw(500, 'Erro ao atualizar programação');
          }
          
          await next();
        }
      },
    });
  }

  async install() {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default KanbanServer;
