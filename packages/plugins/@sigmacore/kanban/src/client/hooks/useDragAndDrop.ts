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
  };

  const handleDragOver = (event: DragOverEvent) => {
    // Aqui podemos adicionar feedback visual durante o drag
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveId(null);
    setIsDragging(false);

    if (!over) {
      return;
    }

    const programacaoId = active.id as string;
    const targetWeekDay = over.id as string;

    const originalProgramacaoId = active.data.current?.originalId;
    const finalProgramacaoId = originalProgramacaoId !== undefined ? originalProgramacaoId : programacaoId;
    
    const currentProgramacaoData = active.data.current;
    if (currentProgramacaoData?.weekDay) {
      const currentWeekDay = weekNavigation.getWeekDayFromDate(currentProgramacaoData.weekDay);
      if (currentWeekDay === targetWeekDay) {
        return;
      }
    }

    try {
      await moveCard(finalProgramacaoId, targetWeekDay);
      
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