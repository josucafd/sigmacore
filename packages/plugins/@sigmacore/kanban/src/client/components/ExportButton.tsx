import React, { useState } from 'react';
import { Button, Dropdown, Modal, Select, DatePicker, message } from 'antd';
import { DownloadOutlined, FilePdfOutlined, FileExcelOutlined } from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { Programacao, useKanbanBlockContext } from '../KanbanBlockProvider';
import { getAllStatusValues, formatStatusLabel } from '../utils/statusUtils';

export interface ExportButtonProps {
  data: Programacao[];
  filteredData: Programacao[];
  selectedStatuses: string[];
  viewMode: 'weekly' | 'monthly';
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  data,
  filteredData,
  selectedStatuses,
  viewMode
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel'>('pdf');
  
  // Ajuste para um período padrão mais amplo: últimos 30 dias até próximos 30 dias
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().subtract(30, 'day'),
    dayjs().add(30, 'day')
  ]);
  
  const [includeFilters, setIncludeFilters] = useState(true);
  const [includeOverdue, setIncludeOverdue] = useState(true);
  
  // Obter as programações em atraso do contexto
  const { overdueCards } = useKanbanBlockContext();

  // Função para gerar dados do relatório
  const generateReportData = () => {
    const [startDate, endDate] = dateRange;
    const dataToExport = includeFilters ? filteredData : data;
    
    console.log('📊 Exportação - dataToExport original:', dataToExport.length, 'programações');
    console.log('📊 Exportação - período selecionado:', startDate.format('YYYY-MM-DD'), 'até', endDate.format('YYYY-MM-DD'));
    
    // Filtrar por período selecionado - CORRIGIDO
    let filteredByDate = dataToExport.filter(programacao => {
      if (!programacao.data_termino) {
        console.log('❌ Programação sem data:', programacao.id_programacao, programacao.referencia);
        return false;
      }
      
      try {
        const programacaoDate = dayjs(programacao.data_termino);
        // Normalizar para comparação apenas de datas (sem horas)
        const programacaoDateStr = programacaoDate.format('YYYY-MM-DD');
        const startDateStr = startDate.format('YYYY-MM-DD');
        const endDateStr = endDate.format('YYYY-MM-DD');
        
        const isAfterOrEqualStart = programacaoDateStr >= startDateStr;
        const isBeforeOrEqualEnd = programacaoDateStr <= endDateStr;
        const isInRange = isAfterOrEqualStart && isBeforeOrEqualEnd;
        
        // Log detalhado para debug
        if (isInRange) {
          console.log('✅ Programação dentro do período:', programacao.id_programacao, programacao.referencia, programacaoDateStr);
        }
        
        return isInRange;
      } catch (e) {
        console.error('❌ Erro ao processar data da programação:', programacao.id_programacao, programacao.data_termino, e);
        return false;
      }
    });
    
    // Adicionar programações em atraso se necessário
    if (includeOverdue && overdueCards.length > 0) {
      console.log('📊 Exportação - incluindo programações em atraso:', overdueCards.length);
      
      // Verificar se já não existem nos dados filtrados
      const filteredIds = new Set(filteredByDate.map(programacao => programacao.id_programacao));
      const newOverdueCards = overdueCards.filter(programacao => !filteredIds.has(programacao.id_programacao));
      
      // Concatenar
      filteredByDate = [...filteredByDate, ...newOverdueCards];
      
      console.log('📊 Exportação - adicionadas', newOverdueCards.length, 'programações em atraso');
    }
    
    console.log('📊 Exportação - filteredByDate:', filteredByDate.length, 'programações após filtro de data e inclusão de atrasados');

    // Agrupar por data
    const groupedByDate: Record<string, Programacao[]> = {};
    filteredByDate.forEach(programacao => {
      // Garantir formato consistente de data
      const dateKey = dayjs(programacao.data_termino).format('YYYY-MM-DD');
      if (!groupedByDate[dateKey]) {
        groupedByDate[dateKey] = [];
      }
      groupedByDate[dateKey].push(programacao);
    });

    console.log('📊 Exportação - groupedByDate:', Object.keys(groupedByDate).length, 'dias diferentes');

    // Calcular estatísticas
    const totalOrders = filteredByDate.length;
    const totalQuantity = filteredByDate.reduce((sum, programacao) => sum + (programacao.qtd_op || 0), 0);
    
    const statusDistribution: Record<string, number> = {};
    filteredByDate.forEach(programacao => {
      const statuses = getAllStatusValues(programacao.setores_atuais);
      statuses.forEach(status => {
        statusDistribution[status] = (statusDistribution[status] || 0) + 1;
      });
    });

    return {
      filteredByDate,
      groupedByDate,
      totalOrders,
      totalQuantity,
      statusDistribution,
      period: {
        start: startDate.format('DD/MM/YYYY'),
        end: endDate.format('DD/MM/YYYY')
      }
    };
  };

  // Função para exportar para PDF
  const exportToPDF = async () => {
    try {
      const reportData = generateReportData();
      
      console.log('📊 Exportação PDF - Dados do relatório:', {
        totalOrders: reportData.totalOrders,
        totalDays: Object.keys(reportData.groupedByDate).length,
        dates: Object.keys(reportData.groupedByDate)
      });
      
      // Se não houver dados, mostrar mensagem
      if (reportData.totalOrders === 0) {
        message.warning('Não há dados para exportar no período selecionado.');
        return;
      }
      
      // Identificar programações em atraso para destaque especial
      const today = dayjs().startOf('day');
      const overdueOrderIds = new Set(
        reportData.filteredByDate
          .filter(programacao => {
            try {
              const programacaoDate = dayjs(programacao.data_termino).startOf('day');
              return programacaoDate.isBefore(today);
            } catch {
              return false;
            }
          })
          .map(programacao => programacao.id_programacao)
      );
      
      // Criar conteúdo HTML para o PDF
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
            .status-tag { padding: 2px 6px; border-radius: 3px; font-size: 11px; }
            .filters-info { background: #e6f7ff; padding: 10px; border-radius: 5px; margin-bottom: 20px; }
            .overdue-row { background-color: #fff1f0; }
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
            <div class="summary-grid">
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
          </div>

          ${
            // Seção para programações em atraso
            overdueOrderIds.size > 0 
            ? `
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
                      .filter(programacao => overdueOrderIds.has(programacao.id_programacao))
                      .map(programacao => `
                        <tr class="overdue-row">
                          <td>${programacao.referencia || `#${programacao.id_programacao}`}</td>
                          <td>${programacao.op_interna || '-'}</td>
                          <td>${programacao.op_cliente || '-'}</td>
                          <td>${programacao.qtd_op ? programacao.qtd_op.toLocaleString() : '-'}</td>
                          <td>${getAllStatusValues(programacao.setores_atuais).map(s => formatStatusLabel(s)).join(', ')}</td>
                          <td>${programacao.tipo_op || '-'}</td>
                          <td>${programacao.data_termino ? dayjs(programacao.data_termino).format('DD/MM/YYYY') : '-'}</td>
                        </tr>
                      `).join('')}
                  </tbody>
                </table>
              </div>
            `
            : ''
          }

          <h3>Programações por Data</h3>
          ${
            Object.keys(reportData.groupedByDate).length === 0 
            ? `<div style="text-align: center; padding: 20px; color: #999;">
                <p>Nenhum dia com produção encontrado no período selecionado.</p>
               </div>`
            : Object.entries(reportData.groupedByDate)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([date, programações]) => `
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
                      ${programações.map(programacao => `
                        <tr ${overdueOrderIds.has(programacao.id_programacao) ? 'class="overdue-row"' : ''}>
                          <td>${programacao.referencia || `#${programacao.id_programacao}`}</td>
                          <td>${programacao.op_interna || '-'}</td>
                          <td>${programacao.op_cliente || '-'}</td>
                          <td>${programacao.qtd_op ? programacao.qtd_op.toLocaleString() : '-'}</td>
                          <td>${getAllStatusValues(programacao.setores_atuais).map(s => formatStatusLabel(s)).join(', ')}</td>
                          <td>${programacao.tipo_op || '-'}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              `).join('')
          }
          
          ${
            reportData.totalOrders > 0 && Object.keys(reportData.groupedByDate).length === 0 
            ? `<div style="text-align: center; padding: 20px; color: #ff4d4f; border: 1px dashed #ff4d4f; margin-top: 20px;">
                <p><strong>Aviso:</strong> Existem ${reportData.totalOrders} programações no período, mas não foi possível agrupá-las por data.</p>
                <p>Verifique se as programações possuem datas válidas.</p>
               </div>`
            : ''
          }

          ${
            reportData.filteredByDate.length > 0 && Object.keys(reportData.groupedByDate).length === 0 
            ? `
              <div style="margin-top: 30px;">
                <h3>Lista de Todas as Programações</h3>
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
                    ${reportData.filteredByDate.map(programacao => `
                      <tr ${overdueOrderIds.has(programacao.id_programacao) ? 'class="overdue-row"' : ''}>
                        <td>${programacao.referencia || `#${programacao.id_programacao}`}</td>
                        <td>${programacao.op_interna || '-'}</td>
                        <td>${programacao.op_cliente || '-'}</td>
                        <td>${programacao.qtd_op ? programacao.qtd_op.toLocaleString() : '-'}</td>
                        <td>${getAllStatusValues(programacao.setores_atuais).map(s => formatStatusLabel(s)).join(', ')}</td>
                        <td>${programacao.tipo_op || '-'}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            `
            : ''
          }
        </body>
        </html>
      `;

      // Abrir nova janela para impressão/PDF
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 500);
      }

      message.success('PDF gerado com sucesso!');
      setModalVisible(false);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      message.error('Erro ao gerar PDF');
    }
  };

  // Função para exportar para Excel
  const exportToExcel = async () => {
    try {
      const reportData = generateReportData();
      
      console.log('📊 Exportação Excel - Dados do relatório:', {
        totalOrders: reportData.totalOrders,
        totalDays: Object.keys(reportData.groupedByDate).length
      });
      
      // Se não houver dados, mostrar mensagem
      if (reportData.totalOrders === 0) {
        message.warning('Não há dados para exportar no período selecionado.');
        return;
      }
      
      // Identificar programações em atraso
      const today = dayjs().startOf('day');
      const overdueOrderIds = new Set(
        reportData.filteredByDate
          .filter(programacao => {
            try {
              const programacaoDate = dayjs(programacao.data_termino).startOf('day');
              return programacaoDate.isBefore(today);
            } catch {
              return false;
            }
          })
          .map(programacao => programacao.id_programacao)
      );
      
      // Criar dados para CSV (simulando Excel)
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
      
      // Adicionar cabeçalho para programações em atraso se houver
      if (overdueOrderIds.size > 0) {
        csvData.push(
          ['PROGRAMAÇÕES EM ATRASO'],
          ['Ref', 'Op Interna', 'Op Cliente', 'Quantidade', 'Status', 'Tipo', 'Data Programada']
        );
        
        // Adicionar programações em atraso
        reportData.filteredByDate
          .filter(programacao => overdueOrderIds.has(programacao.id_programacao))
          .forEach(programacao => {
            try {
              const formattedDate = programacao.data_termino 
                ? dayjs(programacao.data_termino).format('DD/MM/YYYY') 
                : '-';
                
              csvData.push([
                programacao.referencia || `#${programacao.id_programacao}`,
                programacao.op_interna || '-',
                programacao.op_cliente || '-',
                String(programacao.qtd_op || 0),
                getAllStatusValues(programacao.setores_atuais).map(s => formatStatusLabel(s)).join(', '),
                programacao.tipo_op || '-',
                formattedDate
              ]);
            } catch (e) {
              console.error('❌ Erro ao formatar data para Excel:', programacao.id_programacao, programacao.data_termino, e);
            }
          });
          
        csvData.push(['']);
      }
      
      // Adicionar cabeçalho principal para todas as programações
      csvData.push(
        ['TODAS AS PROGRAMAÇÕES POR DATA'],
        ['Data', 'Ref', 'Op Interna', 'Op Cliente', 'Quantidade', 'Status', 'Tipo', 'Em Atraso']
      );
      
      // Adicionar cada programação com sua data formatada
      if (reportData.filteredByDate.length > 0) {
        reportData.filteredByDate.forEach(programacao => {
          try {
            const formattedDate = programacao.data_termino 
              ? dayjs(programacao.data_termino).format('DD/MM/YYYY') 
              : '-';
            
            const isOverdue = overdueOrderIds.has(programacao.id_programacao);
              
            csvData.push([
              formattedDate,
              programacao.referencia || `#${programacao.id_programacao}`,
              programacao.op_interna || '-',
              programacao.op_cliente || '-',
              String(programacao.qtd_op || 0),
              getAllStatusValues(programacao.setores_atuais).map(s => formatStatusLabel(s)).join(', '),
              programacao.tipo_op || '-',
              isOverdue ? 'Sim' : 'Não'
            ]);
          } catch (e) {
            console.error('❌ Erro ao formatar data para Excel:', programacao.id_programacao, programacao.data_termino, e);
            csvData.push([
              'Data inválida',
              programacao.referencia || `#${programacao.id_programacao}`,
              programacao.op_interna || '-',
              programacao.op_cliente || '-',
              String(programacao.qtd_op || 0),
              getAllStatusValues(programacao.setores_atuais).map(s => formatStatusLabel(s)).join(', '),
              programacao.tipo_op || '-',
              overdueOrderIds.has(programacao.id_programacao) ? 'Sim' : 'Não'
            ]);
          }
        });
      }

      // Converter para CSV, garantindo que strings com vírgulas sejam devidamente tratadas
      const csvContent = csvData.map(row => 
        row.map(cell => {
          // Garantir que o valor seja uma string
          const cellStr = String(cell || '');
          // Se a célula contiver vírgulas, aspas ou quebras de linha, colocá-la entre aspas duplas
          // e escapar aspas duplas já existentes duplicando-as
          if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          return cellStr;
        }).join(',')
      ).join('\n');

      // Download do arquivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `planejamento_${reportData.period.start.replace(/\//g, '-')}_${reportData.period.end.replace(/\//g, '-')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      message.success('Excel gerado com sucesso!');
      setModalVisible(false);
    } catch (error) {
      console.error('Erro ao gerar Excel:', error);
      message.error('Erro ao gerar Excel');
    }
  };

  const handleExport = () => {
    if (exportFormat === 'pdf') {
      exportToPDF();
    } else {
      exportToExcel();
    }
  };

  const menuItems = [
    {
      key: 'pdf',
      icon: <FilePdfOutlined />,
      label: 'Exportar PDF',
      onClick: () => {
        setExportFormat('pdf');
        setModalVisible(true);
      }
    },
    {
      key: 'excel',
      icon: <FileExcelOutlined />,
      label: 'Exportar Excel',
      onClick: () => {
        setExportFormat('excel');
        setModalVisible(true);
      }
    }
  ];

  return (
    <>
      <Dropdown menu={{ items: menuItems }} trigger={['click']}>
        <Button icon={<DownloadOutlined />} size="small">
          Exportar
        </Button>
      </Dropdown>

      <Modal
        title={`Exportar ${exportFormat.toUpperCase()}`}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleExport}
        okText="Exportar"
        cancelText="Cancelar"
        width={500}
      >
        <div className="export-modal-content">
          <div className="export-info" style={{ marginBottom: '16px', padding: '8px', backgroundColor: '#f0f2ff', borderRadius: '4px' }}>
            <p style={{ margin: 0 }}>Selecione o período e os dados que deseja exportar. O relatório incluirá todas as programações dentro do período selecionado.</p>
          </div>
          
          <div className="export-option">
            <label>Período:</label>
            <DatePicker.RangePicker
              value={dateRange}
              onChange={(dates) => dates && setDateRange(dates)}
              format="DD/MM/YYYY"
              style={{ width: '100%' }}
              placeholder={['Data inicial', 'Data final']}
              allowClear={false}
            />
          </div>

          <div className="export-option">
            <label>Dados:</label>
            <Select
              value={includeFilters ? 'filtered' : 'all'}
              onChange={(value) => setIncludeFilters(value === 'filtered')}
              style={{ width: '100%' }}
              options={[
                { value: 'all', label: `Todos os dados (${data.length} programações)` },
                { value: 'filtered', label: `Dados filtrados (${filteredData.length} programações)` }
              ]}
            />
          </div>

          <div className="export-option">
            <label>Incluir programações em atraso:</label>
            <Select
              value={includeOverdue ? 'yes' : 'no'}
              onChange={(value) => setIncludeOverdue(value === 'yes')}
              style={{ width: '100%' }}
              options={[
                { value: 'yes', label: `Sim (${overdueCards.length} programações)` },
                { value: 'no', label: 'Não' }
              ]}
            />
          </div>

          {includeFilters && selectedStatuses.length > 0 && (
            <div className="export-filters-info">
              <strong>Filtros aplicados:</strong> {selectedStatuses.map(s => formatStatusLabel(s)).join(', ')}
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}; 