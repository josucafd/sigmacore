import { useState, useCallback, useEffect } from 'react';
import { useAPIClient } from '@nocobase/client';
import { extractCardsFromResponse } from '../utils/reportUtils';

export const usePendingCards = () => {
  const [pendingCardCount, setPendingCardCount] = useState<number | null>(null);
  const [checkingPending, setCheckingPending] = useState(false);
  const api = useAPIClient();

  const refreshPendingCount = useCallback(async () => {
    if (checkingPending) return; // Evitar múltiplas chamadas simultâneas
    
    try {
      setCheckingPending(true);
      console.log('🔍 usePendingCards: Iniciando busca de cards pendentes...');
      
      const response = await api.request({ 
        url: 'programacoes:paraImpressao', 
        method: 'GET' 
      });
      
      console.log('🔍 usePendingCards: Resposta completa da API:', response);
      
      // Verificar estrutura detalhada da resposta para depuração
      const responseStructure = {
        hasData: !!response?.data,
        dataType: typeof response?.data,
        hasDataData: !!response?.data?.data,
        dataDataType: typeof response?.data?.data,
        hasDataDataData: !!response?.data?.data?.data,
        dataDataDataType: typeof response?.data?.data?.data,
        isDataDataDataArray: Array.isArray(response?.data?.data?.data)
      };
      
      console.log('🔍 usePendingCards: Estrutura da resposta:', responseStructure);
      
      // Verificar primeiro o caminho mais aninhado (prioridade)
      if (response?.data?.data?.data && Array.isArray(response.data.data.data)) {
        const cards = response.data.data.data;
        console.log('✅ usePendingCards: Acessando array diretamente:', cards.length);
        setPendingCardCount(cards.length);
        console.log(`📊 Cards pendentes de impressão (acesso direto): ${cards.length}`);
        setCheckingPending(false);
        return;
      }
      
      // Verificar outras estruturas possíveis usando o extrator genérico
      const cards = extractCardsFromResponse(response);
      console.log('🔍 usePendingCards: Cards extraídos pelo extrator genérico:', cards);
      console.log('🔍 usePendingCards: Quantidade de cards:', cards.length);
      
      setPendingCardCount(cards.length);
      
      console.log(`📊 Cards pendentes de impressão: ${cards.length}`);
    } catch (error) {
      console.error('❌ Erro ao verificar cards pendentes:', error);
      setPendingCardCount(0);
    } finally {
      setCheckingPending(false);
    }
  }, [api]);

  // Carregar contagem inicial ao montar o hook
  useEffect(() => {
    refreshPendingCount();
  }, [refreshPendingCount]);

  return {
    pendingCardCount,
    checkingPending,
    refreshPendingCount,
  };
}; 