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
      const response = await api.request({ 
        url: 'programacoes_kanban:list', 
        method: 'GET',
        params: {
          paginate: false,
          filter: {
            status_impresso: {
              $eq: false
            }
          }
        }
      });
      if (response?.data?.data && Array.isArray(response.data.data)) {
        const cards = response.data.data;
        setPendingCardCount(cards.length);
        setCheckingPending(false);
        return;
      }
      const cards = extractCardsFromResponse(response);
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