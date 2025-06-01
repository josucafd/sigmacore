import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { useAPIClient } from '@nocobase/client';
import { useWeekNavigation } from './hooks/useWeekNavigation';

// Tipos de dados da tabela tb_programacoes
export interface ProductionOrder {
  id: string | number;
  ref: string;
  opInterna: string;
  opCliente: string;
  qtd: number;
  status: any; // Campo JSON pode ter diferentes formatos
  weekDay: string;
  produto: string;
  tipoOp?: string; // Novo campo do tipo de operação
  priority: 'high' | 'normal' | 'low';
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  createdById?: number;
  updatedById?: number;
}

export interface KanbanContextType {
  data: ProductionOrder[];
  filteredData: ProductionOrder[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  moveCard: (orderId: string | number, newWeekDay: string) => Promise<void>;
  groupField: string;
  columns: Array<{
    id: string;
    title: string;
    backgroundColor: string;
    cards: ProductionOrder[];
    date: Date;
    isToday: boolean;
  }>;
  // Filtros
  selectedStatuses: string[];
  setSelectedStatuses: (statuses: string[]) => void;
  // Navegação por semanas
  weekNavigation: ReturnType<typeof useWeekNavigation>;
  // Estados para feedback visual
  movingCards: Set<string | number>;
  movedCards: Set<string | number>;
  // Seção de Atrasados
  overdueCards: ProductionOrder[];
  showOverdueSection: boolean;
  toggleOverdueSection: () => void;
}

// Context
const KanbanBlockContext = createContext<KanbanContextType | null>(null);

export const KanbanBlockProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<ProductionOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  // Estados para feedback visual durante movimentação
  const [movingCards, setMovingCards] = useState<Set<string | number>>(new Set());
  const [movedCards, setMovedCards] = useState<Set<string | number>>(new Set());
  // Contador para forçar re-renders
  const [forceRenderCounter, setForceRenderCounter] = useState(0);
  // Estado para a seção de atrasados
  const [showOverdueSection, setShowOverdueSection] = useState(false);
  
  const api = useAPIClient();
  const groupField = 'weekDay'; // Agrupando por dia da semana

  // Hook para navegação por semanas
  const weekNavigation = useWeekNavigation();

  // Função para forçar re-render
  const forceRender = useCallback(() => {
    setForceRenderCounter(prev => prev + 1);
  }, []);

  // Função utilitária para comparar IDs de forma robusta
  const compareIds = useCallback((id1: string | number, id2: string | number): boolean => {
    // Comparação direta primeiro
    if (id1 === id2) {
      return true;
    }
    
    // Comparação como strings
    const str1 = String(id1);
    const str2 = String(id2);
    if (str1 === str2) {
      return true;
    }
    
    // Comparação como números se ambos são numéricos
    const num1 = Number(id1);
    const num2 = Number(id2);
    if (!isNaN(num1) && !isNaN(num2) && num1 === num2) {
      return true;
    }
    
    return false;
  }, []);

  // Função para buscar dados da API usando a nova rota
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.request({
        url: 'kanban_programacoes:list', // Nova rota que usa a query SQL personalizada
        method: 'GET',
        params: {
          paginate: false, // Buscar todos os registros
        },
      });
      
      console.log('🔄 Dados recebidos da API (programações):', response.data);
      console.log('🔍 Detalhes dos IDs recebidos:', response.data?.data?.map(order => ({
        id: order.id,
        type: typeof order.id,
        ref: order.ref,
        weekDay: order.weekDay,
        tipoOp: order.tipoOp
      })));
      
      if (response?.data?.data) {
        const orders = response.data.data;
        console.log(`📊 Carregando ${orders.length} programações na memória`);
        
        // Log dos primeiros registros para debug
        orders.slice(0, 3).forEach(order => {
          console.log(`📋 Programação exemplo:`, {
            id: order.id,
            idType: typeof order.id,
            ref: order.ref,
            weekDay: order.weekDay,
            tipoOp: order.tipoOp,
            status: order.status
          });
        });
        
        setData(orders);
        // Limpar estados visuais
        setMovingCards(new Set());
        setMovedCards(new Set());
      } else {
        console.log('⚠️ Nenhum dado retornado da API');
        setData([]);
      }
    } catch (err) {
      console.error('❌ Erro ao buscar dados das programações:', err);
      setError('Erro ao carregar dados das programações');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [api]);

  // Função para formatar data para o banco de dados considerando fuso horário
  const formatDateForDatabase = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T12:00:00.000Z`;
  };

  // Função para calcular a nova data baseada no dia da semana da semana sendo exibida
  const calculateNewDate = (targetWeekDay: string): string => {
    const weekDayMap: Record<string, number> = {
      'domingo': 0,
      'segunda-feira': 1,
      'terca-feira': 2,
      'quarta-feira': 3,
      'quinta-feira': 4,
      'sexta-feira': 5,
      'sabado': 6
    };

    const targetDayNumber = weekDayMap[targetWeekDay];
    if (targetDayNumber === undefined) {
      const today = new Date();
      return formatDateForDatabase(today);
    }

    const newDate = new Date(weekNavigation.currentWeekStart);
    const daysToAdd = targetDayNumber - 1;
    newDate.setDate(weekNavigation.currentWeekStart.getDate() + daysToAdd);
    
    return formatDateForDatabase(newDate);
  };

  // Função principal para mover card (state local + API) - usando nova API
  const moveCard = useCallback(async (orderId: string | number, targetWeekDay: string) => {
    // Find the order in the current state FIRST
    const currentOrderToMove = data.find(order => compareIds(order.id, orderId));

    if (!currentOrderToMove) {
      console.error(`❌ Programação ${orderId} (tipo: ${typeof orderId}) não encontrada nos dados ANTES da atualização.`);
      console.error(`📊 IDs disponíveis no estado 'data':`, data.map(o => ({ id: o.id, type: typeof o.id, ref: o.ref })));
      throw new Error(`Programação ${orderId} não encontrada nos dados locais (pré-atualização)`);
    }

    // Clone it to preserve its original state for potential revert
    const originalOrderState = { ...currentOrderToMove };
    
    try {
      const newDate = calculateNewDate(targetWeekDay);
      
      console.log(`🎯 Movendo programação ${orderId} (tipo: ${typeof orderId}) para ${targetWeekDay} (${newDate})`);
      
      // 1. Marcar card como sendo movido (feedback visual)
      setMovingCards(prev => new Set(prev).add(orderId));
      
      // 2. Optimistically update the local state
      setData(prevData => {
        return prevData.map(order => {
          if (compareIds(order.id, orderId)) {
            console.log(`🔄 Atualizando programação ${orderId} no estado local: ${order.weekDay} → ${newDate}`);
            return { ...order, weekDay: newDate };
          }
          return order;
        });
      });
      
      // 3. Chamar nova API para atualizar apenas o weekDay
      console.log(`🌐 Chamando API para atualizar programação ${orderId}...`);
      await api.request({
        url: `kanban_programacoes:updateWeekDay`, // Nova ação específica para atualizar weekDay
        method: 'POST',
        params: {
          filterByTk: orderId,
        },
        data: {
          weekDay: newDate,
        },
      });

      console.log(`✅ Programação ${orderId} movida com sucesso para ${targetWeekDay} - API confirmou`);
      
      // 4. Feedback visual de sucesso
      setMovingCards(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
      setMovedCards(prev => new Set(prev).add(orderId));
      
      setTimeout(() => {
        setMovedCards(prev => {
          const newSet = new Set(prev);
          newSet.delete(orderId);
          return newSet;
        });
      }, 2000);
      
    } catch (error) {
      console.error('❌ Erro ao mover programação:', error);
      
      // Revert to the captured original state
      console.log(`🔄 Revertendo programação ${orderId} para estado original:`, originalOrderState.weekDay);
      setData(prevData => {
        return prevData.map(order => {
          if (compareIds(order.id, orderId)) {
            console.log(`🔄 Revertido no estado local: ${order.weekDay} → ${originalOrderState.weekDay}`);
            return { ...originalOrderState }; // Use the captured full original state
          }
          return order;
        });
      });
      
      // Remover estado de loading
      setMovingCards(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
      
      // Re-throw the error so useDragAndDrop can catch it
      throw error; 
    }
  }, [api, data, weekNavigation.currentWeekStart, calculateNewDate, compareIds]);

  // Buscar dados ao montar o componente
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Função para extrair todos os valores de status
  const getAllStatusValues = (status: any): string[] => {
    if (Array.isArray(status)) {
      return status.map(item => String(item).toLowerCase());
    }
    if (typeof status === 'string') {
      try {
        const parsed = JSON.parse(status);
        if (Array.isArray(parsed)) {
          return parsed.map(item => String(item).toLowerCase());
        }
        return [(parsed.value || parsed.status || status).toLowerCase()];
      } catch {
        return [status.replace(/['"]/g, '').toLowerCase()];
      }
    } else if (typeof status === 'object' && status !== null) {
      return [(status.value || status.status || 'indefinido').toLowerCase()];
    }
    return ['indefinido'];
  };

  // Agora vamos usar os dados principais diretamente, sem movimentos locais temporários
  const dataWithLocalMovements = useMemo(() => {
    console.log('🔄 Using main data directly:', {
      dataLength: data.length,
      forceRenderCounter,
      sampleIds: data.slice(0, 3).map(o => ({ id: o.id, type: typeof o.id }))
    });
    
    return data;
  }, [data, forceRenderCounter]);

  // Filtrar dados da semana atual sendo exibida, excluindo atrasados e garantindo data atual/futura
  const dataForWeeklyView = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Adicionar fallback para overdueCards caso seja undefined transitoriamente
    const overdueIds = new Set((overdueCards || []).map(card => card.id));

    return data.filter(order => {
      if (overdueIds.has(order.id)) {
        return false; // Já está na lista de atrasados
      }
      if (!order.weekDay) return false;
      try {
        const orderDate = new Date(order.weekDay);
        orderDate.setHours(0, 0, 0, 0);
        return orderDate >= today; // Apenas cards de hoje ou futuros para as colunas da semana
      } catch {
        return false;
      }
    });
  }, [data, overdueCards]);

  const weekFilteredData = useMemo(() => {
    console.log('🔄 Recalculating weekFilteredData');
    // AGORA USA dataForWeeklyView
    const result = dataForWeeklyView.filter(order => {
      if (!order.weekDay) return false;
      const isInWeek = weekNavigation.isDateInCurrentDisplayWeek(order.weekDay);
      return isInWeek;
    });
    
    console.log('🔄 WeekFilteredData result:', result.length, 'orders in current week');
    return result;
  }, [dataForWeeklyView, weekNavigation.currentWeekStart, weekNavigation.isDateInCurrentDisplayWeek]);

  // Aplicar filtros de status aos dados da semana
  const filteredData = useMemo(() => {
    console.log('🔄 Recalculating filteredData');
    if (selectedStatuses.length === 0) {
      return weekFilteredData; // Se nenhum filtro selecionado, retorna todos os dados da semana
    }

    const result = weekFilteredData.filter(order => {
      const orderStatuses = getAllStatusValues(order.status);
      // Verifica se pelo menos um dos status da ordem está nos filtros selecionados
      return orderStatuses.some(status => selectedStatuses.includes(status));
    });
    
    console.log('🔄 FilteredData result:', result.length, 'orders after status filter');
    return result;
  }, [weekFilteredData, selectedStatuses]);

  // Organizar dados filtrados por dia da semana (apenas segunda a sexta)
  const columns = useMemo(() => {
    console.log('🔄 Recalculating columns');
    // Cores para cada dia da semana
    const weekDayColors = {
      'segunda-feira': '#e6f7ff',   // Azul claro
      'terca-feira': '#f6ffed',     // Verde claro
      'quarta-feira': '#fff2e8',    // Laranja claro
      'quinta-feira': '#e6fffb',    // Ciano claro
      'sexta-feira': '#f9f0ff',     // Roxo claro
    };

    // Usar os dias da semana do hook de navegação (segunda a sexta)
    const result = weekNavigation.weekDays.map((dayInfo) => {
      // Filtrar dados por dia da semana - filteredData já está pré-filtrado (sem atrasados, atual/futuro)
      const filteredDataByDay = filteredData.filter(order => {
        const orderWeekDay = weekNavigation.getWeekDayFromDate(order.weekDay);
        // A condição de data >= hoje já foi aplicada em dataForWeeklyView
        // A exclusão de overdue já foi aplicada em dataForWeeklyView
        // O filtro de status já foi aplicado em filteredData
        // O filtro para a semana de visualização já foi aplicado em weekFilteredData
        const matches = orderWeekDay === dayInfo.weekDay;
        return matches;
      });

      return {
        id: dayInfo.weekDay,
        title: `${dayInfo.label} (${dayInfo.date.getDate()}/${dayInfo.date.getMonth() + 1})`,
        backgroundColor: weekDayColors[dayInfo.weekDay] || '#f5f5f5',
        cards: filteredDataByDay,
        date: dayInfo.date,
        isToday: dayInfo.isToday
      };
    });
    
    console.log('🔄 Columns result:', result.map(col => `${col.id}: ${col.cards.length} cards`));
    return result;
  }, [filteredData, weekNavigation.weekDays, weekNavigation.getWeekDayFromDate]);

  // Função para calcular cards atrasados
  const overdueCards = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Compara com o início do dia de hoje

    return data
      .filter(order => {
        if (!order.weekDay) return false;
        try {
          const orderDate = new Date(order.weekDay);
          orderDate.setHours(0, 0, 0, 0); // Compara o início do dia da ordem
          return orderDate < today;
        } catch (e) {
          console.warn(`Data inválida para a ordem ID ${order.id}: ${order.weekDay}`, e);
          return false; // Data inválida não deve quebrar o filtro
        }
      })
      .sort((a, b) => new Date(a.weekDay).getTime() - new Date(b.weekDay).getTime()); // Mais antigos primeiro
  }, [data]);

  // Função para alternar visibilidade da seção de atrasados
  const toggleOverdueSection = useCallback(() => {
    setShowOverdueSection(prev => !prev);
  }, []);

  const contextValue: KanbanContextType = {
    data: dataWithLocalMovements,
    filteredData,
    loading,
    error,
    refetch: fetchData,
    moveCard,
    groupField,
    columns,
    selectedStatuses,
    setSelectedStatuses,
    weekNavigation,
    movingCards,
    movedCards,
    // Para seção de atrasados
    overdueCards,
    showOverdueSection,
    toggleOverdueSection,
  };

  console.log('🎯 KanbanBlockProvider - contextValue:', {
    dataCount: data.length,
    filteredDataCount: filteredData.length,
    columnsCount: columns.length,
    movingCards: Array.from(movingCards),
    movedCards: Array.from(movedCards)
  });

  return (
    <KanbanBlockContext.Provider value={contextValue}>
      {children}
    </KanbanBlockContext.Provider>
  );
};

export const useKanbanBlockContext = (): KanbanContextType => {
  const context = useContext(KanbanBlockContext);
  if (!context) {
    throw new Error('useKanbanBlockContext deve ser usado dentro de KanbanBlockProvider');
  }
  return context;
}; 