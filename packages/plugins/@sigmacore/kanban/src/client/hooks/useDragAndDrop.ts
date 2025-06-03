import { useState } from 'react';
import { DragEndEvent, DragStartEvent, DragOverEvent } from '@dnd-kit/core';
import { useWeekNavigation } from './useWeekNavigation';

export interface UseDragAndDropProps {
  weekNavigation: ReturnType<typeof useWeekNavigation>;
  moveCard: (programacaoId: string | number, targetWeekDay: string) => Promise<void>;
  onSuccess?: (programacaoId: string | number, targetWeekDay: string) => void;
  onError?: (error: string) => void;
}

export const useDragAndDrop = ({ weekNavigation, moveCard, onSuccess, onError }: UseDragAndDropProps) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Handlers do drag & drop
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    setIsDragging(true);
    console.log('🎯 Drag started:', active.id);
  };

  const handleDragOver = (event: DragOverEvent) => {
    // Aqui podemos adicionar feedback visual durante o drag
    console.log('🔄 Drag over:', event.over?.id);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveId(null);
    setIsDragging(false);

    if (!over) {
      console.log('❌ Drag cancelled - no drop target');
      return;
    }

    const programacaoId = active.id as string;
    const targetWeekDay = over.id as string;

    console.log(`📋 Processando drag end:`);
    console.log(`   - programacaoId: "${programacaoId}" (tipo: ${typeof programacaoId})`);
    console.log(`   - targetWeekDay: "${targetWeekDay}"`);
    console.log(`   - active.id original: "${active.id}" (tipo: ${typeof active.id})`);
    console.log(`   - active.data.current:`, active.data.current);

    // Tentar usar o ID original da programação se disponível
    const originalProgramacaoId = active.data.current?.originalId;
    const finalProgramacaoId = originalProgramacaoId !== undefined ? originalProgramacaoId : programacaoId;
    
    console.log(`🔄 ID final para busca: "${finalProgramacaoId}" (tipo: ${typeof finalProgramacaoId})`);

    // Verificar se o card já está no dia correto da semana sendo exibida
    const currentProgramacaoData = active.data.current;
    if (currentProgramacaoData?.weekDay) {
      const currentWeekDay = weekNavigation.getWeekDayFromDate(currentProgramacaoData.weekDay);
      if (currentWeekDay === targetWeekDay) {
        console.log('ℹ️ Programação dropped in same day of the week, no action needed');
        return;
      }
    }

    try {
      console.log(`🔄 Iniciando movimentação da programação ${finalProgramacaoId} para ${targetWeekDay}...`);
      
      // Usar a função moveCard que já faz toda a lógica
      await moveCard(finalProgramacaoId, targetWeekDay);
      
      console.log(`✅ Movimentação concluída com sucesso!`);
      
      if (onSuccess) {
        onSuccess(finalProgramacaoId, targetWeekDay);
      }
    } catch (error) {
      console.error('❌ Erro durante movimentação:', error);
      
      if (onError) {
        onError(`Erro ao reprogramar programação ${finalProgramacaoId}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setIsDragging(false);
    console.log('❌ Drag cancelled');
  };

  return {
    activeId,
    isDragging,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
  };
}; 