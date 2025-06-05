import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'programacoes_kanban',
  dumpable: false, // Não incluir em dumps (coleção apenas para visualização)
  template: 'view',
  primaryKey: 'id_programacao',
  filterTargetKey: 'id_programacao',
  targetKey: 'id_programacao',
  modelOptions: {
    // timestamps: false,
    underscored: true,
    idAttribute: 'id_programacao',
  },
  order: [],
  sql: `
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
        rp.url AS foto_piloto_url,
        p.created_at AS "createdAt",
        p.updated_at AS "updatedAt",
        p.created_by_id AS "createdById",
        p.updated_by_id AS "updatedById"
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
  `,
  fields: [
    {
      type: 'bigInt',
      name: 'id_programacao',
      primaryKey: true,
      allowNull: false,
      interface: 'id',
      uiSchema: {
        type: 'number',
        title: 'ID',
        'x-component': 'InputNumber',
        'x-read-pretty': true,
      }
    },
    {
      type: 'date',
      name: 'data_termino',
      allowNull: true,
    },
    {
      type: 'string', 
      name: 'op_interna',
      allowNull: true,
    },
    {
      type: 'string',
      name: 'op_cliente', 
      allowNull: true,
    },
    {
      type: 'integer',
      name: 'qtd_op',
      allowNull: true,
    },
    {
      type: 'json',
      name: 'setores_atuais',
      allowNull: true,
    },
    {
      type: 'string',
      name: 'referencia',
      allowNull: true,
    },
    {
      type: 'string',
      name: 'tipo_op',
      allowNull: true,
    },
    {
      type: 'boolean',
      name: 'status_impresso',
      allowNull: true,
    },
    {
      type: 'string',
      name: 'status_op',
      allowNull: true,
    },
    {
      type: 'text',
      name: 'foto_piloto_url',
      allowNull: true,
    },
  ],
}); 