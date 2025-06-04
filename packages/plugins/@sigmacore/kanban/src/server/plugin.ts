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
            // Fallback para capturar filterByTk de diferentes fontes
            const filterByTk = ctx.action?.params?.filterByTk || ctx.request.query?.filterByTk || ctx.params?.filterByTk;
            const { data_termino } = ctx.request.body;

            // Log detalhado para depuração
            console.log('Parâmetros recebidos para updateDataTermino:', {
              actionParams: ctx.action?.params,
              query: ctx.request.query,
              params: ctx.params,
              body: ctx.request.body,
              filterByTk,
              data_termino
            });

            const { db } = this.app;
            
            // Usar query SQL direta para atualizar na tabela real
            const updateQuery = `
              UPDATE public.tb_programacoes 
              SET data_termino = $1 
              WHERE id_programacao = $2
            `;
            
            await db.sequelize.query(updateQuery, {
              bind: [data_termino, filterByTk]
            });
            
            ctx.body = { success: true };
            
            console.log(`✅ Programação ${filterByTk} atualizada com data_termino: ${data_termino}`);
            
          } catch (error) {
            console.error('Erro ao atualizar data_termino:', error);
            ctx.throw(500, 'Erro ao atualizar programação');
          }
          
          await next();
        },
        
        // DEBUG: Action para verificar dados brutos de impressão
        debugImpressao: async (ctx, next) => {
          try {
            const { db } = this.app;
            
            // Query para verificar dados brutos, incluindo tipo de dados
            const debugQuery = `
              SELECT 
                  id_programacao,
                  op_interna,
                  status_impresso,
                  pg_typeof(status_impresso) as tipo_status_impresso,
                  status_op,
                  pg_typeof(status_op) as tipo_status_op
              FROM public.tb_programacoes 
              WHERE status_op = 'EM PRODUÇÃO'
              ORDER BY id_programacao DESC
              LIMIT 100
            `;
            
            const [results] = await db.sequelize.query(debugQuery);
            
            console.log('🔍 DEBUG: Dados brutos de programações (EM PRODUÇÃO):', {
              total: Array.isArray(results) ? results.length : 0,
              data: results
            });
            
            // Contar valores distintos de status_impresso e status_op
            const statusImpressoCounts = {};
            const statusOpCounts = {};
            
            if (Array.isArray(results)) {
              results.forEach((item: any) => {
                const si = String(item.status_impresso);
                statusImpressoCounts[si] = (statusImpressoCounts[si] || 0) + 1;
                
                const so = String(item.status_op);
                statusOpCounts[so] = (statusOpCounts[so] || 0) + 1;
              });
            }
            
            // Contagem geral
            const countQuery = `
              SELECT 
                COUNT(*) as total_registros,
                COUNT(CASE WHEN status_op = 'EM PRODUÇÃO' THEN 1 END) as total_em_producao,
                COUNT(CASE WHEN status_op = 'EM PRODUÇÃO' AND (status_impresso IS NULL OR status_impresso = FALSE) THEN 1 END) as total_para_impressao_ideal,
                COUNT(CASE WHEN status_op = 'EM PRODUÇÃO' AND status_impresso = TRUE THEN 1 END) as total_ja_impressos
              FROM public.tb_programacoes 
            `;
            
            const [countResults] = await db.sequelize.query(countQuery);
            
            ctx.body = {
              debug: true,
              amostra_100_em_producao: results || [],
              distribuicao_status_impresso_na_amostra: statusImpressoCounts,
              distribuicao_status_op_na_amostra: statusOpCounts,
              contagem_geral_tabela: countResults ? countResults[0] : null,
            };
            
          } catch (error) {
            console.error('Erro no debug de impressão:', error);
            ctx.body = { error: error.message, stack: error.stack };
          }
          
          await next();
        },
        
        // Action para buscar cards a serem impressos
        paraImpressao: async (ctx, next) => {
          try {
            const { db } = this.app;
            
            // Primeiro verificar se existem registros com status_impresso = false
            // Esta query de debug nos ajudará a entender o problema
            const debugQuery = `
              SELECT 
                COUNT(*) as total_em_producao,
                COUNT(CASE WHEN status_impresso IS NULL THEN 1 END) as null_count,
                COUNT(CASE WHEN status_impresso = false THEN 1 END) as false_count,
                COUNT(CASE WHEN status_impresso = true THEN 1 END) as true_count
              FROM public.tb_programacoes 
              WHERE status_op = 'EM PRODUÇÃO'
            `;
            
            const [debugResults] = await db.sequelize.query(debugQuery);
            console.log('🔍 DEBUG STATUS_IMPRESSO:', debugResults[0]);
            
            // Query principal com diagnóstico de tipo
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
                  p.status_op,
                  pg_typeof(p.status_impresso) as status_impresso_type,
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
                  p.status_impresso = FALSE OR p.status_impresso IS NULL
              ORDER BY 
                  p.id_programacao DESC
            `;
            
            console.log('🔍 Executando query para impressão (Cenário B: apenas status_impresso=false/null)...');
            const [results] = await db.sequelize.query(query);
            
            console.log('📊 Resultado da query paraImpressao:', {
              count: Array.isArray(results) ? results.length : 0,
              sample: Array.isArray(results) && results.length > 0 ? results[0] : null
            });
            
            // Resultado normal
            ctx.body = {
              data: results || [],
              meta: {
                count: Array.isArray(results) ? results.length : 0,
                totalCount: Array.isArray(results) ? results.length : 0
              }
            };
          } catch (error) {
            console.error('Erro ao buscar cards para impressão:', error);
            ctx.body = { data: [], meta: { count: 0, totalCount: 0 }, error: error.message };
          }
          await next();
        },
        // Action para marcar cards como impressos em lote
        marcarImpresso: async (ctx, next) => {
          try {
            const { ids } = ctx.request.body;
            if (!Array.isArray(ids) || ids.length === 0) {
              ctx.throw(400, 'Nenhum ID fornecido para marcar como impresso');
            }
            const { db } = this.app;
            
            console.log('🔄 Marcando cards como impressos, IDs:', ids);
            
            // Primeiro verificar o tipo de status_impresso nos registros
            const checkQuery = `
              SELECT pg_typeof(status_impresso) as status_type
              FROM public.tb_programacoes
              WHERE id_programacao = $1
              LIMIT 1
            `;
            
            const [checkResult] = await db.sequelize.query(checkQuery, {
              bind: [ids[0]]
            });
            
            console.log('📊 Tipo da coluna status_impresso:', checkResult);
            
            // Tentar usar CAST para garantir o tipo correto
            const updateQuery = `
              UPDATE public.tb_programacoes
              SET status_impresso = CAST('true' AS BOOLEAN)
              WHERE id_programacao = ANY($1)
            `;
            
            const updateResult = await db.sequelize.query(updateQuery, {
              bind: [ids]
            });
            
            console.log('✅ Resultado da atualização:', updateResult);
            
            // Verificar se a atualização funcionou
            const verifyQuery = `
              SELECT id_programacao, status_impresso
              FROM public.tb_programacoes
              WHERE id_programacao = ANY($1)
            `;
            
            const [verifyResult] = await db.sequelize.query(verifyQuery, {
              bind: [ids]
            });
            
            console.log('🔍 Verificação após atualização:', verifyResult);
            
            ctx.body = { 
              success: true, 
              updated: ids.length,
              verification: verifyResult
            };
          } catch (error) {
            console.error('Erro ao marcar cards como impressos:', error);
            ctx.throw(500, 'Erro ao marcar cards como impressos');
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
