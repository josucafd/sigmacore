import { useEffect, useState, useCallback, useRef } from 'react';

export interface UseKanbanSyncProps {
  /** Função para buscar dados atualizados */
  refetch: () => Promise<void>;
  /** Intervalo de polling em segundos (padrão: 30s, 0 = desabilitado) */
  pollingInterval?: number;
  /** Habilitar polling apenas quando a aba estiver ativa */
  pollingOnlyWhenActive?: boolean;
}

export const useKanbanSync = ({
  refetch,
  pollingInterval = 30, // 30 segundos por padrão
  pollingOnlyWhenActive = true
}: UseKanbanSyncProps) => {
  const [isPolling, setIsPolling] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isTabActive, setIsTabActive] = useState(true);

  // Detectar se a aba está ativa
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabActive(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Função de sincronização manual
  const syncNow = useCallback(async () => {
    if (isSyncing) return; // Evitar múltiplas sincronizações simultâneas
    
    try {
      setIsSyncing(true);
      await refetch();
      setLastSync(new Date());
      console.log('Sincronização manual executada com sucesso');
    } catch (error) {
      console.error('Erro na sincronização manual:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [refetch, isSyncing]);

  // Função de sincronização automática (polling)
  const executePolling = useCallback(async () => {
    if (pollingOnlyWhenActive && !isTabActive) {
      return; // Não fazer polling se a aba não estiver ativa
    }

    try {
      await refetch();
      setLastSync(new Date());
      console.log('Polling executado automaticamente');
    } catch (error) {
      console.error('Erro no polling automático:', error);
    }
  }, [refetch, pollingOnlyWhenActive, isTabActive]);

  // Iniciar polling
  const startPolling = useCallback(() => {
    if (pollingInterval <= 0 || isPolling) return;

    setIsPolling(true);
    intervalRef.current = setInterval(executePolling, pollingInterval * 1000);
    console.log(`Polling iniciado: ${pollingInterval}s de intervalo`);
  }, [pollingInterval, executePolling, isPolling]);

  // Parar polling
  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
    console.log('Polling parado');
  }, []);

  // Reiniciar polling quando a aba voltar a ficar ativa
  useEffect(() => {
    if (isTabActive && pollingInterval > 0 && !isPolling) {
      startPolling();
    } else if (!isTabActive && isPolling) {
      // Não parar o polling completamente, apenas pausar
      // O polling continuará quando a aba voltar a ficar ativa
    }
  }, [isTabActive, pollingInterval, isPolling, startPolling]);

  // Inicializar polling ao montar o hook
  useEffect(() => {
    if (pollingInterval > 0) {
      startPolling();
    }

    // Cleanup ao desmontar
    return () => {
      stopPolling();
    };
  }, [pollingInterval, startPolling, stopPolling]);

  // Forçar sincronização quando a aba voltar a ficar ativa (após inatividade)
  useEffect(() => {
    if (isTabActive && lastSync) {
      const timeSinceLastSync = Date.now() - lastSync.getTime();
      const shouldSyncOnFocus = timeSinceLastSync > (pollingInterval * 1000 * 2); // 2x o intervalo

      if (shouldSyncOnFocus) {
        syncNow();
      }
    }
  }, [isTabActive, lastSync, pollingInterval, syncNow]);

  return {
    /** Se o polling está ativo */
    isPolling,
    /** Se está sincronizando no momento */
    isSyncing,
    /** Data da última sincronização */
    lastSync,
    /** Se a aba está ativa */
    isTabActive,
    /** Sincronizar manualmente */
    syncNow,
    /** Iniciar polling */
    startPolling,
    /** Parar polling */
    stopPolling,
    /** Tempo desde a última sincronização em segundos */
    timeSinceLastSync: lastSync ? Math.floor((Date.now() - lastSync.getTime()) / 1000) : null,
  };
}; 