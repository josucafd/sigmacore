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
      // Se o contador for zero e não estiver carregando, verificar diretamente
      if (pendingCardCount === 0 && !checkingPending) {
        try {
          console.log('🔄 Verificação de consistência: contador de cards é zero, checando API diretamente...');
          const response = await api.request({ url: 'programacoes:paraImpressao', method: 'GET' });
          
          let hasCardsInResponse = false;
          
          // Verificar os caminhos possíveis
          if (response?.data?.data?.data && Array.isArray(response.data.data.data) && response.data.data.data.length > 0) {
            hasCardsInResponse = true;
            console.log('🔄 Verificação detectou cards no caminho aninhado:', response.data.data.data.length);
          } else {
            const extractedCards = extractCardsFromResponse(response);
            hasCardsInResponse = extractedCards.length > 0;
            console.log('🔄 Verificação com extrator padrão:', extractedCards.length);
          }
          
          // Se houver uma discrepância, forçar a atualização
          if (hasCardsInResponse && pendingCardCount === 0) {
            console.log('⚠️ Inconsistência detectada: API tem cards mas contador mostra zero. Atualizando...');
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
    console.log('🔍 Verificando cards disponíveis para impressão...');
    
    try {
      // Primeiro, tenta obter da API
      try {
        const response = await api.request({ url: 'programacoes:paraImpressao', method: 'GET' });
        const apiCards = extractCardsFromResponse(response);
        
        if (apiCards && apiCards.length > 0) {
          console.log('✅ Cards não impressos disponíveis via API:', apiCards.length);
          setShowPrintOptions(true);
          return;
        }
      } catch (apiError) {
        console.error('❌ Erro ao buscar da API, verificando dados locais:', apiError);
      }
      
      // Se não encontrou pela API, verifica nos dados locais
      if (data && data.length > 0) {
        // Verifica status_impresso nos dados do Kanban
        const notPrintedCards = data.filter(card => 
          card.status_impresso === 'false' || 
          card.status_impresso === undefined || 
          card.status_impresso === null || 
          card.status_impresso === ''
        );
        
        console.log(`🔍 Verificação local: ${notPrintedCards.length} cards não impressos de ${data.length} total`);
        
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
      console.log('🖨️ Iniciando exportação de cards para impressão...');
      
      // Tentar usar a API melhorada que agora tem diagnóstico e fallback
      console.log('🖨️ Tentando API para cards não impressos...');
      
      const response = await api.request({ 
        url: 'programacoes:paraImpressao', 
        method: 'GET' 
      });
      
      // Processar a resposta
      let cardsFromApi: Programacao[] = [];
      
      if (response?.data?.data && Array.isArray(response.data.data)) {
        cardsFromApi = response.data.data;
        console.log('✅ Cards da API com diagnóstico melhorado:', cardsFromApi.length);
      } else {
        // Tentar extrair com extrator genérico
        cardsFromApi = extractCardsFromResponse(response);
        console.log('✅ Cards extraídos pelo extrator genérico:', cardsFromApi.length);
      }
      
      // Diagnóstico dos dados que vêm da API
      if (cardsFromApi.length > 0) {
        // Verificar estrutura dos primeiros 3 registros
        console.log('🔍 Amostra dos primeiros registros da API:');
        const sampleCards = cardsFromApi.slice(0, 3);
        sampleCards.forEach((card, index) => {
          console.log(`Card #${index + 1}:`, {
            id: card.id_programacao,
            referencia: card.referencia,
            status_impresso: card.status_impresso,
            tipo_status_impresso: typeof card.status_impresso
          });
        });
        
        // Contagem de valores status_impresso
        const statusMap = cardsFromApi.reduce((acc, card) => {
          const status = String(card.status_impresso);
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        console.log('🔍 Diagnóstico de status_impresso da API:', statusMap);
      }
      
      // IMPORTANTE: Filtrar explicitamente por status_impresso = false mesmo nos dados da API
      const cardsForPrinting = cardsFromApi.filter(card => card.status_impresso === false || card.status_impresso == null);
      console.log(`🔍 Filtragem explícita no frontend: ${cardsForPrinting.length} cards com status_impresso = false/null de ${cardsFromApi.length} recebidos da API`);
      let cards = cardsForPrinting;
      if (cards.length === 0) {
        console.log('⚠️ Sem cards qualificados após filtragem da API. Verificando dados locais...');
        if (data && data.length > 0) {
          const statusMap = data.reduce((acc, card) => {
            const status = String(card.status_impresso);
            acc[status] = (acc[status] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
          console.log('🔍 Diagnóstico de status_impresso (dados locais):', statusMap);
          const notPrintedCards = data.filter(card => card.status_impresso === false || card.status_impresso == null);
          console.log(`🔍 Filtragem local: ${notPrintedCards.length} cards com status_impresso = false/null de ${data.length} total`);
          if (notPrintedCards.length > 0) {
            console.log('🖨️ Usando dados filtrados do Kanban para impressão: ', notPrintedCards.length);
            cards = notPrintedCards;
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
      
      console.log('🖨️ Cards para impressão (final):', cards.length);
      
      // Processar a impressão
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