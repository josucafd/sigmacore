# @sigmacore/action-export

Plugin para exportação de dados do NocoBase para Excel com seleção dinâmica de colunas.

## Instalação

1. Certifique-se de que o plugin está instalado na pasta `packages/plugins/@sigmacore/action-export`
2. Ative o plugin nas configurações do NocoBase

## Como Usar

### 1. Como componente em um bloco personalizado

```tsx
import { ActionExport } from '@sigmacore/action-export';

const MyBlock = () => {
  return (
    <div>
      <h3>Minha Tabela</h3>
      <ActionExport 
        collection="users" 
        title="Exportar Usuários" 
        filter={{ status: 'active' }}
      />
      {/* ... outros componentes */}
    </div>
  );
};
```

### 2. Propriedades do Componente

| Propriedade | Tipo | Descrição |
|-------------|------|-----------|
| `collection` | `string` | Nome da collection para exportar |
| `title` | `string` | Texto do botão (opcional, default: "Exportar Excel") |
| `icon` | `ReactNode` | Ícone personalizado (opcional) |
| `filter` | `object` | Filtros a serem aplicados na exportação (opcional) |
| `onFinish` | `() => void` | Função chamada após exportação bem-sucedida (opcional) |
| `onError` | `(error: Error) => void` | Função chamada em caso de erro (opcional) |

### 3. Fluxo de Funcionamento

1. **Usuário clica no botão "Exportar Excel"**
2. **Modal de seleção de colunas é aberto**
   - Todas as colunas visíveis aparecem selecionadas por padrão
   - Usuário pode marcar/desmarcar as colunas desejadas
3. **Usuário clica em "Exportar"**
   - Seleção é salva no localStorage para uso futuro
   - Arquivo Excel é gerado e baixado automaticamente

## Personalização

Para personalizar o botão:

```tsx
import { BarChartOutlined } from '@ant-design/icons';

<ActionExport 
  collection="users" 
  title="Exportar Relatório" 
  icon={<BarChartOutlined />}
  filter={{ createdAt: { $gt: '2023-01-01' } }}
/>
```

## Implementação Técnica

O plugin registra uma nova action `export` no servidor NocoBase que gera um arquivo Excel baseado nas colunas selecionadas.

## Compatibilidade

- Compatível com NocoBase 1.x
- Usa ExcelJS para geração de arquivos Excel 