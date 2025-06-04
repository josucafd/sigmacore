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

interface ExportPDFParams {
  reportData: ReportData;
  viewMode: 'weekly' | 'monthly';
  includeFilters: boolean;
  selectedStatuses: string[];
  setModalVisible?: (v: boolean) => void;
}

export async function exportToPDFService({
  reportData,
  viewMode,
  includeFilters,
  selectedStatuses,
  setModalVisible
}: ExportPDFParams) {
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

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Relatório de Planejamento - ${reportData.period.start} a ${reportData.period.end}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .summary { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
          .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
          .summary-item { text-align: center; }
          .summary-value { font-size: 24px; font-weight: bold; color: #1677ff; }
          .summary-label { font-size: 12px; color: #666; }
          .day-section { margin-bottom: 25px; page-break-inside: avoid; }
          .day-header { background: #1677ff; color: white; padding: 10px; border-radius: 5px; margin-bottom: 10px; }
          .overdue-header { background: #ff4d4f; color: white; padding: 10px; border-radius: 5px; margin-bottom: 10px; }
          .orders-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
          .orders-table th, .orders-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .orders-table th { background: #f5f5f5; font-weight: bold; }
          .filters-info { background: #e6f7ff; padding: 10px; border-radius: 5px; margin-bottom: 20px; }
          .overdue-row { background: #fff1f0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Relatório de Planejamento de Produção</h1>
          <h2>Período: ${reportData.period.start} a ${reportData.period.end}</h2>
          <p>Visualização: ${viewMode === 'weekly' ? 'Semanal' : 'Mensal'} | Gerado em: ${dayjs().format('DD/MM/YYYY HH:mm')}</p>
        </div>
        ${includeFilters && selectedStatuses.length > 0 ? `
          <div class="filters-info">
            <strong>Filtros Aplicados:</strong> ${selectedStatuses.map(s => formatStatusLabel(s)).join(', ')}
          </div>
        ` : ''}
        <div class="summary">
          <h3>Resumo Geral</h3>
          <div class="summary-item">
            <div class="summary-value">${reportData.totalOrders}</div>
            <div class="summary-label">Total de Programações</div>
          </div>
          <div class="summary-item">
            <div class="summary-value">${reportData.totalQuantity.toLocaleString()}</div>
            <div class="summary-label">Quantidade Total</div>
          </div>
          <div class="summary-item">
            <div class="summary-value">${Object.keys(reportData.groupedByDate).length}</div>
            <div class="summary-label">Dias com Produção</div>
          </div>
          <div class="summary-item">
            <div class="summary-value">${overdueOrderIds.size}</div>
            <div class="summary-label">Programações em Atraso</div>
          </div>
        </div>
        ${overdueOrderIds.size > 0 ? `
          <div class="day-section">
            <div class="overdue-header">
              <h3>Programações em Atraso (${overdueOrderIds.size} programações)</h3>
            </div>
            <table class="orders-table">
              <thead>
                <tr>
                  <th>Ref</th>
                  <th>Op Interna</th>
                  <th>Op Cliente</th>
                  <th>Quantidade</th>
                  <th>Status</th>
                  <th>Tipo</th>
                  <th>Data Programada</th>
                </tr>
              </thead>
              <tbody>
                ${reportData.filteredByDate
                  .filter(p => overdueOrderIds.has(p.id_programacao))
                  .map(p => `
                    <tr class="overdue-row">
                      <td>${p.referencia || `#${p.id_programacao}`}</td>
                      <td>${p.op_interna || '-'}</td>
                      <td>${p.op_cliente || '-'}</td>
                      <td>${p.qtd_op?.toLocaleString() || '-'}</td>
                      <td>${getAllStatusValues(p.setores_atuais).map(s => formatStatusLabel(s)).join(', ')}</td>
                      <td>${p.tipo_op || '-'}</td>
                      <td>${formatDate(p.data_termino)}</td>
                    </tr>
                  `).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}
        <h3>Programações por Data</h3>
        ${Object.entries(reportData.groupedByDate).length === 0 ? `
          <div style="text-align: center; padding: 20px; color: #999;">
            <p>Nenhum dia com produção encontrado no período selecionado.</p>
          </div>
        ` : Object.entries(reportData.groupedByDate).sort(([a], [b]) => a.localeCompare(b)).map(([date, programações]) => `
          <div class="day-section">
            <div class="day-header">
              <h3>${dayjs(date).format('dddd, DD/MM/YYYY')} (${programações.length} programações)</h3>
            </div>
            <table class="orders-table">
              <thead>
                <tr>
                  <th>Ref</th>
                  <th>Op Interna</th>
                  <th>Op Cliente</th>
                  <th>Quantidade</th>
                  <th>Status</th>
                  <th>Tipo</th>
                </tr>
              </thead>
              <tbody>
                ${programações.map(p => `
                  <tr ${overdueOrderIds.has(p.id_programacao) ? 'class="overdue-row"' : ''}>
                    <td>${p.referencia || `#${p.id_programacao}`}</td>
                    <td>${p.op_interna || '-'}</td>
                    <td>${p.op_cliente || '-'}</td>
                    <td>${p.qtd_op?.toLocaleString() || '-'}</td>
                    <td>${getAllStatusValues(p.setores_atuais).map(s => formatStatusLabel(s)).join(', ')}</td>
                    <td>${p.tipo_op || '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `).join('')}
        ${reportData.totalOrders > 0 && Object.keys(reportData.groupedByDate).length === 0 ? `
          <div style="text-align: center; padding: 20px; color: #ff4d4f; border: 1px dashed #ff4d4f; margin-top: 20px;">
            <p><strong>Aviso:</strong> Existem ${reportData.totalOrders} programações no período, mas não foi possível agrupá-las por data.</p>
            <p>Verifique se as programações possuem datas válidas.</p>
          </div>
        ` : ''}
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (!printWindow) throw new Error('Não foi possível abrir a janela de impressão.');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 500);

    message.success('PDF gerado com sucesso!');
    if (setModalVisible) setModalVisible(false);
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    message.error('Erro ao gerar PDF');
    if (setModalVisible) setModalVisible(false);
  }
} 