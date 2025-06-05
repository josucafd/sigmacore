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
      
      // Filtro melhorado para cards não impressos - combinando ambos os formatos possíveis
      const filter = JSON.stringify({
        "$or": [
          { "status_impresso": { "$isTruly": false } },
          { "status_impresso": { "$eq": "false" } },
          { "status_impresso": { "$eq": null } }
        ]
      });
      
      // Fazer a chamada com parâmetros de query para garantir formato correto
      const response = await api.request({ 
        url: `programacoes_kanban:list`,
        method: 'GET',
        params: {
          paginate: false,
          filter: JSON.stringify({"status_impresso":{"$eq":false}})
        }
      });
      
      // Log detalhado para diagnóstico
      console.log('[DEBUG] usePendingCards: Resposta da API:', {
        hasData: !!response?.data,
        dataIsArray: Array.isArray(response?.data),
        dataDataExists: !!response?.data?.data,
        dataDataIsArray: Array.isArray(response?.data?.data),
        dataLength: Array.isArray(response?.data?.data) ? response.data.data.length : 'não é array'
      });
      
      // Processamento padronizado com a função extractCardsFromResponse
      const cards = extractCardsFromResponse(response);
      console.log('[DEBUG] usePendingCards: Cards extraídos:', cards.length);
      
      setPendingCardCount(cards.length);
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