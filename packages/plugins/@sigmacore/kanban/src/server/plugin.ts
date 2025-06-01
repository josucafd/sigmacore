import { Plugin } from '@nocobase/server';
import path from 'path';

export class KanbanServer extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {
    // Carregar as coleções do diretório collections
    await this.importCollections(path.resolve(__dirname, 'collections'));
    
    // Registrar ação customizada para buscar dados das programações
    this.app.resource({
      name: 'kanban_programacoes',
      actions: {
        list: async (ctx, next) => {
          try {
            const { db } = this.app;
            
            // Query SQL personalizada para buscar dados das programações
            const query = `
              SELECT 
                p.id_programacao as id,
                p.data_prazo_entrega as "weekDay",
                p.op_interna as "opInterna",
                p.op_cliente as "opCliente", 
                p.qtd_op as qtd,
                p.setores_atuais as status,
                p.tipo_op as "tipoOp",
                r.referencia as ref,
                COALESCE(
                  MAX(CASE WHEN fp.suffix = 'F' THEN fp.url END),
                  MAX(CASE WHEN fp.suffix = 'P' THEN fp.url END),
                  MAX(CASE WHEN fp.suffix = 'T' THEN fp.url END),
                  MAX(fp.url)
                ) AS "imageUrl"
              FROM 
                public.tb_programacoes p
              LEFT JOIN 
                public.tb_referencias r ON p.id_referencia = r.id_referencia
              LEFT JOIN 
                public.tb_fotos_pilotos fp ON r.id_referencia = fp.id_referencia
              WHERE 
                p.status_impresso = false
              GROUP BY 
                p.id_programacao, r.id_referencia, r.referencia
              ORDER BY 
                p.data_prazo_entrega ASC
            `;

            // Executar a query SQL
            const results = await db.sequelize.query(query, {
              type: db.sequelize.QueryTypes.SELECT,
            });

            // Transformar os dados para o formato esperado pelo kanban
            const transformedData = results.map((row: any) => ({
              id: row.id,
              ref: row.ref || `#${row.id}`,
              opInterna: row.opInterna,
              opCliente: row.opCliente,
              qtd: row.qtd,
              status: row.status,
              weekDay: row.weekDay,
              produto: row.ref, // Usando referência como produto
              tipoOp: row.tipoOp,
              priority: 'normal', // Valor padrão, pode ser calculado baseado em outros campos
              imageUrl: row.imageUrl,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }));

            ctx.body = {
              data: transformedData,
              meta: {
                count: transformedData.length,
                page: 1,
                pageSize: transformedData.length,
                totalPage: 1,
              },
            };

            await next();
          } catch (error) {
            console.error('Erro ao buscar dados das programações:', error);
            ctx.throw(500, 'Erro interno do servidor ao buscar programações');
          }
        },

        // Ação para atualizar apenas o campo weekDay de uma programação
        updateWeekDay: async (ctx, next) => {
          try {
            const { db } = this.app;
            const { filterByTk } = ctx.action.params;
            const { weekDay } = ctx.request.body;

            if (!filterByTk || !weekDay) {
              ctx.throw(400, 'ID da programação e nova data são obrigatórios');
            }

            // Atualizar apenas o campo data_prazo_entrega na tabela tb_programacoes
            const updateQuery = `
              UPDATE public.tb_programacoes 
              SET data_prazo_entrega = :weekDay,
                  updated_at = NOW()
              WHERE id_programacao = :id
            `;

            await db.sequelize.query(updateQuery, {
              type: db.sequelize.QueryTypes.UPDATE,
              replacements: {
                weekDay,
                id: filterByTk,
              },
            });

            ctx.body = {
              success: true,
              message: `Programação ${filterByTk} atualizada com sucesso`,
            };

            await next();
          } catch (error) {
            console.error('Erro ao atualizar weekDay da programação:', error);
            ctx.throw(500, 'Erro interno do servidor ao atualizar programação');
          }
        },
      },
    });

    // Manter compatibilidade com a collection production_orders para outros usos
    this.app.resource({
      name: 'production_orders',
      actions: {
        // Pode adicionar actions customizadas aqui se necessário
      },
    });
  }

  async install() {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default KanbanServer;
