import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'programacoes',
  createdBy: true,
  updatedBy: true,
  createdAt: true,
  updatedAt: true,
  fields: [
    {
      type: 'bigInt',
      name: 'id_programacao',
      primaryKey: true,
      allowNull: false,
    },
    {
      type: 'date',
      name: 'data_termino',
      allowNull: true,
      comment: 'Data de término da programação (agregador para o kanban)',
    },
    {
      type: 'string', 
      name: 'op_interna',
      allowNull: true,
      comment: 'Ordem de produção interna',
    },
    {
      type: 'string',
      name: 'op_cliente', 
      allowNull: true,
      comment: 'Ordem de produção do cliente',
    },
    {
      type: 'integer',
      name: 'qtd_op',
      allowNull: true,
      comment: 'Quantidade da ordem de produção',
    },
    {
      type: 'json',
      name: 'setores_atuais',
      allowNull: true,
      comment: 'Lista de status/setores atuais',
    },
    {
      type: 'string',
      name: 'referencia',
      allowNull: true,
      comment: 'Referência do produto',
    },
    {
      type: 'string',
      name: 'tipo_op',
      allowNull: true,
      comment: 'Tipo da ordem de produção',
    },
    {
      type: 'boolean',
      name: 'status_impresso',
      allowNull: true,
      comment: 'Status para impressão do card',
    },
    {
      type: 'text',
      name: 'foto_piloto_url',
      allowNull: true,
      comment: 'URL da foto piloto do produto',
    },
  ],
}); 