# @sigmacore/kanban

Plugin Kanban para NocoBase - Sistema de Planejamento de Produção

## Funcionalidades

- **Visualização Kanban**: Organize programações de produção por data de término
- **Drag & Drop**: Mova programações entre dias da semana facilmente
- **Filtros por Setor**: Filtre programações por setores atuais de produção
- **Navegação Temporal**: Navegue entre semanas para planejar a produção
- **Visualização Mensal**: Calendário mensal com indicadores de carga
- **Exportação**: Exporte relatórios em PDF e Excel
- **Tempo Real**: Sincronização automática e feedback visual
- **Programações Atrasadas**: Seção dedicada para itens em atraso

## Estrutura de Dados

O plugin trabalha com programações que incluem:

- `referencia`: Referência do produto
- `op_interna`: Ordem de produção interna  
- `op_cliente`: Ordem de produção do cliente
- `qtd_op`: Quantidade da ordem de produção
- `tipo_op`: Tipo da ordem de produção
- `data_termino`: Data de término (usado para agrupamento no kanban)
- `setores_atuais`: Lista de setores/status atuais da programação
- `foto_piloto_url`: URL da foto do produto

## Query SQL

O plugin utiliza uma query SQL personalizada que integra dados de:
- `tb_programacoes`: Dados principais das programações
- `tb_referencias`: Informações das referências dos produtos  
- `tb_fotos_pilotos`: Fotos dos produtos com priorização por sufixo

Apenas programações com `status_op = 'EM PRODUÇÃO'` são exibidas.

## Uso

1. Instale o plugin no NocoBase
2. Configure as collections necessárias (`tb_programacoes`, `tb_referencias`, `tb_fotos_pilotos`)
3. Acesse via `/admin/kanban-producao`
4. Use drag & drop para reorganizar as programações
5. Aplique filtros por setor conforme necessário
