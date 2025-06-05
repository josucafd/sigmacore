import React, { useState, useCallback, useEffect } from 'react';
import { Button, Dropdown, Modal, Select, DatePicker, message, Tooltip, Space } from 'antd';
import { DownloadOutlined, FilePdfOutlined, FileExcelOutlined, PrinterOutlined, SyncOutlined } from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { Programacao, useKanbanBlockContext } from '../KanbanBlockProvider';
import { getAllStatusValues, formatStatusLabel } from '../utils/statusUtils';
import { useAPIClient } from '@nocobase/client';
import { exportToPDFService } from './ExportButton/services/exportPDF';
import { exportToExcelService } from './ExportButton/services/exportExcel';
import { exportPrintableCardsService } from './ExportButton/services/exportPrintableCards';
import { usePendingCards } from './ExportButton/hooks/usePendingCards';
import { ReportData } from './ExportButton/types';
import { extractCardsFromResponse, generateReportDataLogic } from './ExportButton/utils/reportUtils';
import { ExportSettingsModal } from './ExportButton/components/ExportSettingsModal';

// Interfaces
interface ExportButtonProps {
  data: Programacao[];
  filteredData: Programacao[];
  selectedStatuses: string[];
  viewMode: 'weekly' | 'monthly';
}

// Main ExportButton Component
export const ExportButton: React.FC<ExportButtonProps> = ({ data, filteredData, selectedStatuses, viewMode }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel'>('pdf');
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([dayjs().subtract(30, 'day'), dayjs().add(30, 'day')]);
  const [includeFilters, setIncludeFilters] = useState(true);
  const [includeOverdue, setIncludeOverdue] = useState(true);
  const [printing, setPrinting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showPrintOptions, setShowPrintOptions] = useState(false);
  const [printOptions, setPrintOptions] = useState({
    showOPInterna: true,
    showOPCliente: true,
    showQuantidade: true,
    showTipo: false
  });

  const { overdueCards } = useKanbanBlockContext();
  const api = useAPIClient();
  const { pendingCardCount, checkingPending, refreshPendingCount } = usePendingCards();
  
  // Efeito para verificar se o contador é zero mas deveria ter cards
  useEffect(() => {
    const checkAndRefreshIfNeeded = async () => {
      if (pendingCardCount === 0 && !checkingPending) {
        try {
          // Filtro melhorado para booleano false, string 'false' ou null
          const filter = JSON.stringify({
            "$or": [
              { "status_impresso": { "$isTruly": false } },
              { "status_impresso": { "$eq": "false" } },
              { "status_impresso": { "$eq": null } }
            ]
          });
          
          const response = await api.request({ 
            url: `programacoes_kanban:list`,
            method: 'GET',
            params: {
              paginate: false,
              filter: JSON.stringify({"status_impresso":{"$eq":false}})
            }
          });
          
          console.log('[DEBUG] Verificação de consistência - Resposta da API:', {
            hasData: !!response?.data,
            dataStructure: typeof response?.data,
            dataDataExists: !!response?.data?.data,
            isDataDataArray: Array.isArray(response?.data?.data),
            dataLength: Array.isArray(response?.data?.data) ? response.data.data.length : 'não é array'
          });
          
          // Usar a função centralizada para extrair os cards
          const extractedCards = extractCardsFromResponse(response);
          console.log('[DEBUG] Verificação de consistência - Cards extraídos:', extractedCards.length);
          
          // Se encontrou cards na API mas o contador está zerado, atualiza
          if (extractedCards.length > 0 && pendingCardCount === 0) {
            console.log('[DEBUG] Verificação de consistência - Atualizando contador de pendentes');
            refreshPendingCount();
          }
        } catch (err) {
          console.error('Erro na verificação de consistência:', err);
        }
      }
    };
    
    // Executar a verificação uma vez após a montagem
    checkAndRefreshIfNeeded();
  }, [api, pendingCardCount, checkingPending, refreshPendingCount]);

  const generateReportData = useCallback((): ReportData => {
    return generateReportDataLogic({
      dateRange,
      includeFilters,
      filteredData,
      data,
      includeOverdue,
      overdueCards,
    });
  }, [data, filteredData, includeFilters, includeOverdue, dateRange, overdueCards]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const reportData = generateReportData();
      if (exportFormat === 'pdf') {
        await exportToPDFService({
          reportData,
          viewMode,
          includeFilters,
          selectedStatuses,
          setModalVisible,
        });
      } else {
        await exportToExcelService({
          reportData,
          setModalVisible,
        });
      }
    } catch (error) {
      console.error("Error during export process:", error);
      message.error("Falha na exportação geral.");
      setModalVisible(false);
    } finally {
      setExporting(false);
    }
  };

  const handlePrintableCards = async () => {
    try {
      try {
        // Filtro melhorado para booleano false, string 'false' ou null
        const filter = JSON.stringify({
          "$or": [
            { "status_impresso": { "$isTruly": false } },
            { "status_impresso": { "$eq": "false" } },
            { "status_impresso": { "$eq": null } }
          ]
        });
        
        const response = await api.request({ 
          url: `programacoes_kanban:list`,
          method: 'GET',
          params: {
            paginate: false,
            filter: JSON.stringify({"status_impresso":{"$eq":false}})
          }
        });
        
        console.log('[DEBUG] handlePrintableCards: Resposta bruta da API:', response.data);
        
        // Usar a função centralizada para extrair os cards
        const apiCards = extractCardsFromResponse(response);
        console.log('[DEBUG] handlePrintableCards: Cards extraídos:', apiCards.length);
        
        if (apiCards && apiCards.length > 0) {
          setShowPrintOptions(true);
          return;
        }
      } catch (apiError) {
        console.error('❌ Erro ao buscar da API, verificando dados locais:', apiError);
      }
      
      // Fallback para dados locais
      if (data && data.length > 0) {
        const notPrintedCards = data.filter(card => 
          !card.status_impresso || card.status_impresso === 'false' || card.status_impresso === null || card.status_impresso === undefined
        );
        if (notPrintedCards.length > 0) {
          setShowPrintOptions(true);
          return;
        }
        message.info('Não há cards não impressos disponíveis para impressão');
      } else {
        message.info('Não há cards disponíveis no Kanban');
      }
    } catch (err) {
      console.error('❌ Erro ao verificar cards:', err);
      message.error('Erro ao verificar cards disponíveis');
    }
  };
  
  const executePrintableCards = async () => {
    setPrinting(true);
    setShowPrintOptions(false);
    try {
      // Filtro melhorado para booleano false, string 'false' ou null
      const filter = JSON.stringify({
        "$or": [
          { "status_impresso": { "$isTruly": false } },
          { "status_impresso": { "$eq": "false" } },
          { "status_impresso": { "$eq": null } }
        ]
      });
      
      const response = await api.request({ 
        url: `programacoes_kanban:list`,
        method: 'GET',
        params: {
          paginate: false,
          filter: JSON.stringify({"status_impresso":{"$eq":false}})
        }
      });
      
      console.log('[DEBUG] executePrintableCards: Resposta bruta da API:', response.data);
      
      // Usar a função centralizada para extrair e normalizar os cards
      const cardsFromApi = extractCardsFromResponse(response);
      console.log('[DEBUG] executePrintableCards: Cards extraídos:', cardsFromApi.length);
      
      // Double-check para garantir que só imprimimos cards não impressos
      const cardsForPrinting = cardsFromApi.filter(card => 
        card.status_impresso === false || 
        card.status_impresso === 'false' || 
        card.status_impresso === null || 
        card.status_impresso === undefined
      );
      
      console.log('[DEBUG] executePrintableCards: Cards filtrados para impressão:', cardsForPrinting.length);
      
      let cards = cardsForPrinting;
      
      // Fallback para dados locais se não encontrou na API
      if (cards.length === 0) {
        if (data && data.length > 0) {
          const notPrintedCards = data.filter(card => 
            !card.status_impresso || 
            card.status_impresso === 'false' || 
            card.status_impresso === null || 
            card.status_impresso === undefined
          );
          
          if (notPrintedCards.length > 0) {
            cards = notPrintedCards;
            console.log('[DEBUG] executePrintableCards: Usando cards locais:', cards.length);
          } else {
            message.info('Não há cards com status_impresso = false ou null disponíveis.');
            setPrinting(false);
            return;
          }
        } else {
          message.info('Não há cards disponíveis para impressão');
          setPrinting(false);
          return;
        }
      }
      
      await exportPrintableCardsService({
        cards,
        api,
        refreshPendingCount,
        setPrinting,
        options: printOptions
      });
    } catch (err: any) {
      setPrinting(false);
      console.error('❌ Erro ao exportar para impressão:', err);
      setTimeout(() => {
        alert(`Erro ao exportar para impressão: ${err.message || 'Erro desconhecido'}`);
      }, 0);
    }
  };

  const menuItems = [
    { key: 'pdf', icon: <FilePdfOutlined />, label: 'Exportar PDF', onClick: () => { setExportFormat('pdf'); setModalVisible(true); } },
    { key: 'excel', icon: <FileExcelOutlined />, label: 'Exportar Excel', onClick: () => { setExportFormat('excel'); setModalVisible(true); } },
  ];

  return (
    <>
      <Space size="small" style={{ marginRight: 8 }}>
        <Tooltip title="Imprime cards com status_impresso = false (ou nulo), independentemente do status da operação.">
          <Button
            icon={<PrinterOutlined />}
            loading={printing}
            onClick={handlePrintableCards}
            type="primary"
            size="small"
          >
            Imprimir Novos Cards
          </Button>
        </Tooltip>
        <Tooltip title="Atualizar contagem de cards pendentes">
          <Button
            icon={<SyncOutlined spin={checkingPending} />}
            onClick={refreshPendingCount}
            size="small"
            disabled={printing}
          />
        </Tooltip>
      </Space>
      <Dropdown menu={{ items: menuItems }} trigger={['click']}>
        <Button icon={<DownloadOutlined />} size="small">Exportar</Button>
      </Dropdown>
      <ExportSettingsModal
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleExport}
        exportFormat={exportFormat}
        dateRange={dateRange}
        setDateRange={setDateRange}
        includeFilters={includeFilters}
        setIncludeFilters={setIncludeFilters}
        includeOverdue={includeOverdue}
        setIncludeOverdue={setIncludeOverdue}
        data={data}
        filteredData={filteredData}
        overdueCards={overdueCards}
        selectedStatuses={selectedStatuses}
        okButtonProps={{ loading: exporting }}
      />
      <Modal
        title="Opções de Impressão - Cards Não Impressos"
        open={showPrintOptions}
        onCancel={() => setShowPrintOptions(false)}
        onOk={executePrintableCards}
        okText="Imprimir"
        cancelText="Cancelar"
        okButtonProps={{ loading: printing }}
      >
        <div style={{ padding: '16px' }}>
          <div style={{ marginBottom: '16px', padding: '8px', background: '#f0f2ff', borderRadius: '4px' }}>
            <p style={{ margin: 0 }}>
              Esta opção imprime <strong>apenas os cards que ainda não foram impressos</strong> 
              (ou seja, aqueles com status_impresso = false ou nulo), independentemente do status da operação (ex: "EM PRODUÇÃO", "ENCERRADA", etc.).
              <br />
              Após a impressão, estes cards serão automaticamente marcados como impressos.
            </p>
          </div>
          
          <h4>Selecione os campos que deseja incluir nos cards:</h4>
          <div style={{ marginBottom: '12px' }}>
            <label>
              <input
                type="checkbox"
                checked={printOptions.showOPInterna}
                onChange={(e) => setPrintOptions({...printOptions, showOPInterna: e.target.checked})}
                style={{ marginRight: '8px' }}
              />
              OP Interna
            </label>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label>
              <input
                type="checkbox"
                checked={printOptions.showOPCliente}
                onChange={(e) => setPrintOptions({...printOptions, showOPCliente: e.target.checked})}
                style={{ marginRight: '8px' }}
              />
              OP Cliente
            </label>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label>
              <input
                type="checkbox"
                checked={printOptions.showQuantidade}
                onChange={(e) => setPrintOptions({...printOptions, showQuantidade: e.target.checked})}
                style={{ marginRight: '8px' }}
              />
              Quantidade
            </label>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label>
              <input
                type="checkbox"
                checked={printOptions.showTipo}
                onChange={(e) => setPrintOptions({...printOptions, showTipo: e.target.checked})}
                style={{ marginRight: '8px' }}
              />
              Tipo
            </label>
          </div>
        </div>
      </Modal>
    </>
  );
};