import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { useAPIClient } from '@nocobase/client';
import { useWeekNavigation } from './hooks/useWeekNavigation';

// Tipos de dados da nova estrutura de programações
export interface Programacao {
  id_programacao: string | number;
  data_termino: string; // Data de término (agregador para o kanban)
  op_interna: string;
  op_cliente: string;
  qtd_op: number;
  setores_atuais: any; // Lista de status/setores atuais
  referencia: string;
  tipo_op: string;
  status_impresso: string;
  status_op?: string; // Status da operação (ex: 'EM PRODUÇÃO')
  foto_piloto_url?: string;
  createdAt?: string;
  updatedAt?: string;
  createdById?: number;
  updatedById?: number;
}

export interface KanbanContextType {
  data: Programacao[];
  filteredData: Programacao[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  moveCard: (programacaoId: string | number, newDataTermino: string) => Promise<void>;
  groupField: string;
  columns: Array<{
    id: string;
    title: string;
    backgroundColor: string;
    cards: Programacao[];
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
  overdueCards: Programacao[];
  showOverdueSection: boolean;
  toggleOverdueSection: () => void;
}

// Context
const KanbanBlockContext = createContext<KanbanContextType | null>(null);

export const KanbanBlockProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<Programacao[]>([]);
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
  const groupField = 'data_termino'; // Agrupando por data de término

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

  // Função para buscar dados da API usando a nova action customizada
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.request({
        url: 'programacoes:kanbanData',
        method: 'GET',
      });
      
      if (response && response.data) {
        let programacoes: Programacao[] = [];
        
        if (Array.isArray(response.data)) {
          programacoes = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          programacoes = response.data.data;
        } else if (response.data.data && response.data.data.data && Array.isArray(response.data.data.data)) {
          programacoes = response.data.data.data;
        } else if (response.data.results && Array.isArray(response.data.results)) {
          programacoes = response.data.results;
        } else {
          const findArrayDeep = (obj: any, depth: number = 0, maxDepth: number = 3): Programacao[] | null => {
            if (depth > maxDepth) return null;
            if (!obj || typeof obj !== 'object') return null;
            
            if (Array.isArray(obj) && obj.length > 0 && obj[0] && 'id_programacao' in obj[0]) {
              return obj as Programacao[];
            }
            
            for (const key in obj) {
              if (typeof obj[key] === 'object' && obj[key] !== null) {
                const result = findArrayDeep(obj[key], depth + 1, maxDepth);
                if (result) {
                  return result;
                }
              }
            }
            
            return null;
          };
          
          const foundArray = findArrayDeep(response.data);
          if (foundArray && foundArray.length > 0) {
            programacoes = foundArray;
          } else {
            console.warn('❌ Nenhum array encontrado na resposta');
          }
        }
        
        if (programacoes.length > 0) {
          // Log dos primeiros registros para debug
        }
        
        setData(programacoes);
        // Limpar estados visuais
        setMovingCards(new Set());
        setMovedCards(new Set());
      } else {
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
    try {
      // Garantir que temos uma data válida
      if (!date || isNaN(date.getTime())) {
        const today = new Date();
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      }
      
      // Extrair componentes da data
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      // Formato para o banco: YYYY-MM-DD (sem a parte do tempo - o servidor adiciona isso)
      const formattedDate = `${year}-${month}-${day}`;
      
      return formattedDate;
    } catch (e) {
      console.error('❌ Erro ao formatar data para o banco:', e);
      const today = new Date();
      return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    }
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

  // Função principal para mover card (state local + API)
  const moveCard = useCallback(async (programacaoId: string | number, targetWeekDay: string) => {
    // Find the programacao in the current state FIRST
    const currentProgramacaoToMove = data.find(prog => compareIds(prog.id_programacao, programacaoId));

    if (!currentProgramacaoToMove) {
      console.error(`❌ Programação ${programacaoId} (tipo: ${typeof programacaoId}) não encontrada nos dados ANTES da atualização.`);
      throw new Error(`Programação ${programacaoId} não encontrada nos dados locais (pré-atualização)`);
    }

    // Clone it to preserve its original state for potential revert
    const originalProgramacaoState = { ...currentProgramacaoToMove };
    
    try {
      const newDate = calculateNewDate(targetWeekDay);
      
      // 1. Marcar card como sendo movido (feedback visual)
      setMovingCards(prev => new Set(prev).add(programacaoId));
      
      // 2. Optimistically update the local state
      setData(prevData => {
        return prevData.map(prog => {
          if (compareIds(prog.id_programacao, programacaoId)) {
            return { ...prog, data_termino: newDate };
          }
          return prog;
        });
      });
      
      // 3. Chamar API em background
      const apiPayload = {
        data_termino: newDate,
      };
      
      await api.request({
        url: `programacoes:updateDataTermino`,
        method: 'POST',
        params: {
          filterByTk: programacaoId,
        },
        data: apiPayload,
      });

      // 4. Feedback visual de sucesso
      setMovingCards(prev => {
        const newSet = new Set(prev);
        newSet.delete(programacaoId);
        return newSet;
      });
      setMovedCards(prev => new Set(prev).add(programacaoId));
      
      // 5. Recarregar dados depois de um breve delay para garantir sincronização
      setTimeout(() => {
        // Remover estado "movido" após alguns segundos
        setMovedCards(prev => {
          const newSet = new Set(prev);
          newSet.delete(programacaoId);
          return newSet;
        });
        
        // Recarregar dados do servidor para garantir sincronização
        fetchData();
      }, 2000);
      
    } catch (error) {
      console.error('❌ Erro ao mover programação:', error);
      
      // Revert to the captured original state
      setData(prevData => {
        return prevData.map(prog => {
          if (compareIds(prog.id_programacao, programacaoId)) {
            return { ...originalProgramacaoState }; // Use the captured full original state
          }
          return prog;
        });
      });
      
      // Remover estado de loading
      setMovingCards(prev => {
        const newSet = new Set(prev);
        newSet.delete(programacaoId);
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

  // Função para extrair todos os valores de status dos setores_atuais
  const getAllStatusValues = (setoresAtuais: any): string[] => {
    if (Array.isArray(setoresAtuais)) {
      return setoresAtuais.map(item => String(item).toLowerCase());
    }
    if (typeof setoresAtuais === 'string') {
      try {
        const parsed = JSON.parse(setoresAtuais);
        if (Array.isArray(parsed)) {
          return parsed.map(item => String(item).toLowerCase());
        }
        return [(parsed.value || parsed.setor || setoresAtuais).toLowerCase()];
      } catch {
        return [setoresAtuais.replace(/['"]/g, '').toLowerCase()];
      }
    } else if (typeof setoresAtuais === 'object' && setoresAtuais !== null) {
      return [(setoresAtuais.value || setoresAtuais.setor || 'indefinido').toLowerCase()];
    }
    return ['indefinido'];
  };

  // Agora vamos usar os dados principais diretamente, sem movimentos locais temporários
  const dataWithLocalMovements = useMemo(() => {
    return data;
  }, [data, forceRenderCounter]);

  // Filtrar dados apenas para a semana sendo exibida
  const dataForWeeklyView = useMemo(() => {
    return data;
  }, [data]);

  const weekFilteredData = useMemo(() => {
    const result = dataForWeeklyView.filter(prog => {
      if (!prog.data_termino) return false;
      const isInWeek = weekNavigation.isDateInCurrentDisplayWeek(prog.data_termino);
      return isInWeek;
    });
    
    return result;
  }, [dataForWeeklyView, weekNavigation.currentWeekStart, weekNavigation.isDateInCurrentDisplayWeek]);

  // Aplicar filtros de status aos dados da semana
  const filteredData = useMemo(() => {
    if (selectedStatuses.length === 0) {
      return weekFilteredData; // Se nenhum filtro selecionado, retorna todos os dados da semana
    }

    const result = weekFilteredData.filter(prog => {
      const progStatuses = getAllStatusValues(prog.setores_atuais);
      const matches = progStatuses.some(status => selectedStatuses.includes(status));
      return matches;
    });
    
    return result;
  }, [weekFilteredData, selectedStatuses]);

  // Organizar dados filtrados por dia da semana (apenas segunda a sexta)
  const columns = useMemo(() => {
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
      const filteredDataByDay = filteredData.filter(prog => {
        const progWeekDay = weekNavigation.getWeekDayFromDate(prog.data_termino);
        const matches = progWeekDay === dayInfo.weekDay;
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
    
    return result;
  }, [filteredData, weekNavigation.weekDays, weekNavigation.getWeekDayFromDate]);

  // Função para calcular cards atrasados (simplificado)
  const overdueCards = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return data
      .filter(prog => {
        if (!prog.data_termino) return false;
        try {
          const progDate = new Date(prog.data_termino);
          progDate.setHours(0, 0, 0, 0);
          return progDate < today;
        } catch (e) {
          return false;
        }
      })
      .sort((a, b) => new Date(a.data_termino).getTime() - new Date(b.data_termino).getTime());
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