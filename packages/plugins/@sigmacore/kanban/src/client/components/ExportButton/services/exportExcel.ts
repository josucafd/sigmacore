import dayjs from 'dayjs';
import { message } from 'antd';
import { getAllStatusValues, formatStatusLabel } from '../../../utils/statusUtils';
import { Programacao } from '../../../KanbanBlockProvider';

const formatDate = (date: string | undefined) => (date ? dayjs(date).format('DD/MM/YYYY') : '-');

interface ReportData {
  filteredByDate: Programacao[];
  groupedByDate: Record<string, Programacao[]>;
  totalOrders: number;
  totalQuantity: number;
  statusDistribution: Record<string, number>;
  period: { start: string; end: string };
}

interface ExportExcelParams {
  reportData: ReportData;
  setModalVisible?: (v: boolean) => void;
}

export async function exportToExcelService({
  reportData,
  setModalVisible
}: ExportExcelParams) {
  try {
    if (reportData.totalOrders === 0) {
      message.warning('Não há dados para exportar no período selecionado.');
      return;
    }

    const today = dayjs().startOf('day');
    const overdueOrderIds = new Set(
      reportData.filteredByDate
        .filter(p => dayjs(p.data_termino).startOf('day').isBefore(today))
        .map(p => p.id_programacao)
    );

    const csvData = [
      ['Relatório de Planejamento de Produção'],
      [`Período: ${reportData.period.start} a ${reportData.period.end}`],
      [`Gerado em: ${dayjs().format('DD/MM/YYYY HH:mm')}`],
      [''],
      ['Resumo Geral'],
      ['Total de Programações', reportData.totalOrders],
      ['Quantidade Total', reportData.totalQuantity],
      ['Dias com Produção', Object.keys(reportData.groupedByDate).length],
      ['Programações em Atraso', overdueOrderIds.size],
      [''],
    ];

    if (overdueOrderIds.size > 0) {
      csvData.push(
        ['PROGRAMAÇÕES EM ATRASO'],
        ['Ref', 'Op Interna', 'Op Cliente', 'Quantidade', 'Status', 'Tipo', 'Data Programada'],
        ...reportData.filteredByDate
          .filter(p => overdueOrderIds.has(p.id_programacao))
          .map(p => [
            p.referencia || `#${p.id_programacao}`,
            p.op_interna || '-',
            p.op_cliente || '-',
            String(p.qtd_op || 0),
            getAllStatusValues(p.setores_atuais).map(s => formatStatusLabel(s)).join(', '),
            p.tipo_op || '-',
            formatDate(p.data_termino),
          ])
      );
      csvData.push(['']);
    }

    csvData.push(
      ['TODAS AS PROGRAMAÇÕES POR DATA'],
      ['Data', 'Ref', 'Op Interna', 'Op Cliente', 'Quantidade', 'Status', 'Tipo', 'Em Atraso'],
      ...reportData.filteredByDate.map(p => [
        formatDate(p.data_termino),
        p.referencia || `#${p.id_programacao}`,
        p.op_interna || '-',
        p.op_cliente || '-',
        String(p.qtd_op || 0),
        getAllStatusValues(p.setores_atuais).map(s => formatStatusLabel(s)).join(', '),
        p.tipo_op || '-',
        overdueOrderIds.has(p.id_programacao) ? 'Sim' : 'Não',
      ])
    );

    const csvContent = csvData
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `planejamento_${reportData.period.start.replace(/\//g, '-')}_${reportData.period.end.replace(/\//g, '-')}.csv`;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    message.success('Excel gerado com sucesso!');
    if (setModalVisible) setModalVisible(false);
  } catch (error) {
    console.error('Erro ao gerar Excel:', error);
    message.error('Erro ao gerar Excel');
    if (setModalVisible) setModalVisible(false);
  }
} 