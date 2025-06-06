import React from 'react';
import { ActionExport } from './src/client/ActionExport';
import { Card, Table, Space, Tag } from 'antd';
import { BarChartOutlined } from '@ant-design/icons';

/**
 * Exemplo de como usar o plugin @sigmacore/action-export
 * Este arquivo demonstra a integração do componente de exportação
 * em um bloco personalizado no NocoBase
 */

const ExampleBlock = () => {
  // Dados de exemplo
  const data = [
    {
      id: 1,
      name: 'João Silva',
      email: 'joao@exemplo.com',
      department: 'Vendas',
      status: 'ativo',
    },
    {
      id: 2,
      name: 'Maria Santos',
      email: 'maria@exemplo.com',
      department: 'Marketing',
      status: 'ativo',
    },
    {
      id: 3,
      name: 'Pedro Oliveira',
      email: 'pedro@exemplo.com',
      department: 'TI',
      status: 'inativo',
    },
  ];

  // Definir as colunas da tabela
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Nome',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Departamento',
      dataIndex: 'department',
      key: 'department',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'ativo' ? 'green' : 'red'}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
  ];

  return (
    <Card title="Exemplo de Exportação de Dados" style={{ maxWidth: 800, margin: '20px auto' }}>
      <Space style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
        {/* Exemplo básico */}
        <ActionExport
          collection="users"
          title="Exportar Excel"
        />
        
        {/* Exemplo com ícone personalizado e filtro */}
        <ActionExport
          collection="users"
          title="Exportar Ativos"
          icon={<BarChartOutlined />}
          filter={{ status: 'ativo' }}
        />
      </Space>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        pagination={false}
      />

      <div style={{ marginTop: 20, padding: 16, background: '#f5f5f5', borderRadius: 4 }}>
        <h3>Como usar o componente:</h3>
        <pre>{`
import { ActionExport } from '@sigmacore/action-export';

// Uso básico
<ActionExport collection="users" />

// Uso avançado
<ActionExport
  collection="users"
  title="Exportar Relatório"
  icon={<BarChartOutlined />}
  filter={{ status: 'ativo' }}
  onFinish={() => console.log('Exportação concluída!')}
  onError={(error) => console.error('Erro na exportação:', error)}
/>
        `}</pre>
      </div>
    </Card>
  );
};

export default ExampleBlock; 