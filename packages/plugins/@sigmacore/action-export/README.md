# @sigmacore/action-export

Plugin para exportação de dados do NocoBase com seleção dinâmica de colunas pelo usuário.

## Funcionalidades

- **Seleção de Colunas**: O usuário pode escolher quais colunas deseja exportar via modal intuitivo
- **Exportação para Excel**: Gera arquivos .xlsx
- **Memória de Seleção**: Salva a seleção de colunas para uso futuro
- **Filtros**: Aplica os filtros ativos da tabela na exportação
- **Botão Personalizado**: Exibe "Export SIGMA" como título do botão
- **Sem Restrições de Permissão**: Funciona para todos os usuários

## Instalação

1. O plugin já está instalado na pasta `packages/plugins/@sigmacore/action-export`
2. Adicione o plugin nas configurações do NocoBase
3. Ative o plugin no painel de administração

## Como Usar

### 1. Importar o Componente

```tsx
import { ActionExport } from '@sigmacore/action-export/client';
```

### 2. Usar o Componente

```tsx
const ExamplePage = () => {
  const filters = {
    // Filtros que estão sendo aplicados na tabela
    status: 'ativo'
  };

  return (
    <div>
      <ActionExport
        collection="users"
        filter={filters}
      />
    </div>
  );
};
```

### 3. Propriedades do Componente

| Propriedade | Tipo | Descrição |
|-------------|------|-----------|
| `collection` | `string` | Nome da collection para exportar (obrigatório) |
| `title` | `string` | Texto do botão (opcional, default: "Export SIGMA") |
| `icon` | `ReactNode` | Ícone do botão (opcional, default: DownloadOutlined) |
| `filter` | `object` | Filtros a serem aplicados na exportação (opcional) |
| `onFinish` | `() => void` | Função chamada após exportação bem-sucedida (opcional) |
| `onError` | `(error: Error) => void` | Função chamada em caso de erro (opcional) |

## Fluxo de Funcionamento

1. **Usuário clica no botão "Export SIGMA"**
2. **Modal de seleção de colunas é aberto**
   - Todas as colunas visíveis aparecem selecionadas por padrão
   - Usuário pode marcar/desmarcar as colunas desejadas
   - Checkbox "Selecionar todos" para facilitar a seleção
3. **Usuário clica em "Exportar"**
   - Seleção é salva no localStorage para uso futuro
   - Chamada para o endpoint `/api/{collection}:export`
   - Arquivo Excel é gerado e baixado automaticamente

## Endpoint da API

O plugin cria automaticamente o endpoint:

```
POST /api/{collection}:export
```

**Payload:**
```json
{
  "columns": [
    {
      "dataIndex": ["campo1"],
      "title": "Título do Campo 1",
      "defaultTitle": "Título do Campo 1"
    },
    {
      "dataIndex": ["campo2"],
      "title": "Título do Campo 2", 
      "defaultTitle": "Título do Campo 2"
    }
  ]
}
```

**Parâmetros:**
```json
{
  "filter": { "status": "ativo" },
  "title": "NOME DA COLLECTION"
}
```

**Response:**
- Arquivo Excel (.xlsx) para download

## Personalização

### Customizar o Título do Botão

```tsx
<ActionExport 
  collection="users" 
  title="Exportar Relatório Customizado"
/>
```

### Customizar o Ícone

```tsx
import { FileExcelOutlined } from '@ant-design/icons';

<ActionExport 
  collection="users" 
  icon={<FileExcelOutlined />}
/>
```

### Aplicar Filtros

```tsx
<ActionExport 
  collection="users" 
  filter={{ 
    status: { $eq: 'ativo' },
    createdAt: { $gt: '2023-01-01' }
  }}
/>
```

## Exemplo Completo

```tsx
import React, { useState } from 'react';
import { ActionExport } from '@sigmacore/action-export/client';
import { FileExcelOutlined } from '@ant-design/icons';

const UsersTable = () => {
  const [filters, setFilters] = useState({
    status: { $eq: 'ativo' }
  });

  const handleExportFinish = () => {
    console.log('Exportação concluída!');
  };

  const handleExportError = (error) => {
    console.error('Erro na exportação:', error);
  };

  return (
    <div>
      <h1>Lista de Usuários</h1>
      
      {/* Sua tabela aqui */}
      <table>
        {/* ... */}
      </table>
      
      {/* Botão de exportação */}
      <div style={{ marginTop: '20px' }}>
        <ActionExport
          collection="users"
          title="Exportar Usuários SIGMA"
          icon={<FileExcelOutlined />}
          filter={filters}
          onFinish={handleExportFinish}
          onError={handleExportError}
        />
      </div>
    </div>
  );
};

export default UsersTable;
```

## Correções Aplicadas

- **✅ Corrigido erro do servidor**: `column.includes is not a function`
- **✅ Formato de dados corrigido**: Suporte para estrutura `{dataIndex: [], title: string}`
- **✅ Remoção de restrições**: Modal funciona para todos os usuários
- **✅ Interface melhorada**: Checkbox intuitivo para seleção de colunas
- **✅ Personalização**: Botão exibe "Export SIGMA" por padrão

## Desenvolvimento

Para desenvolvimento local:

```bash
# Fazer build do plugin
cd /root/www/my-nocobase-app
yarn build

# Reiniciar o NocoBase para aplicar mudanças
yarn dev
```

## Dependências

- `exceljs`: Para geração de arquivos Excel
- `@nocobase/client`: Framework do NocoBase (peer dependency)
- `@nocobase/server`: Servidor do NocoBase (peer dependency)

## Licença

Este plugin segue a mesma licença do projeto NocoBase.
