import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'production_orders',
  createdBy: true,
  updatedBy: true,
  createdAt: true,
  updatedAt: true,
  fields: [
    {
      type: 'string',
      name: 'ref',
      allowNull: true,
    },
    {
      type: 'string', 
      name: 'opInterna',
      allowNull: true,
    },
    {
      type: 'string',
      name: 'opCliente', 
      allowNull: true,
    },
    {
      type: 'bigInt',
      name: 'qtd',
      allowNull: true,
    },
    {
      type: 'json',
      name: 'status',
      allowNull: true,
    },
    {
      type: 'date',
      name: 'weekDay',
      allowNull: true,
    },
    {
      type: 'string',
      name: 'produto',
      allowNull: true,
    },
    {
      type: 'string',
      name: 'priority',
      allowNull: true,
    },
    {
      type: 'text',
      name: 'imageUrl',
      allowNull: true,
    },
  ],
}); 