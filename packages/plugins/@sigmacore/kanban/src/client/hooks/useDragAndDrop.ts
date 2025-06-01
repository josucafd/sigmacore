import { useState } from 'react';
import { DragEndEvent, DragStartEvent, DragOverEvent } from '@dnd-kit/core';
import { useWeekNavigation } from './useWeekNavigation';

export interface UseDragAndDropProps {
  weekNavigation: ReturnType<typeof useWeekNavigation>;
  moveCard: (orderId: string | number, targetWeekDay: string) => Promise<void>;
  onSuccess?: (orderId: string | number, targetWeekDay: string) => void;
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

    const orderId = active.id as string;
    const targetWeekDay = over.id as string;

    console.log(`📋 Processando drag end:`);
    console.log(`   - orderId: "${orderId}" (tipo: ${typeof orderId})`);
    console.log(`   - targetWeekDay: "${targetWeekDay}"`);
    console.log(`   - active.id original: "${active.id}" (tipo: ${typeof active.id})`);
    console.log(`   - active.data.current:`, active.data.current);

    // Tentar usar o ID original da order se disponível
    const originalOrderId = active.data.current?.originalId;
    const finalOrderId = originalOrderId !== undefined ? originalOrderId : orderId;
    
    console.log(`🔄 ID final para busca: "${finalOrderId}" (tipo: ${typeof finalOrderId})`);

    // Verificar se o card já está no dia correto da semana sendo exibida
    const currentOrderData = active.data.current;
    if (currentOrderData?.weekDay) {
      const currentWeekDay = weekNavigation.getWeekDayFromDate(currentOrderData.weekDay);
      if (currentWeekDay === targetWeekDay) {
        console.log('ℹ️ Order dropped in same day of the week, no action needed');
        return;
      }
    }

    try {
      console.log(`🔄 Iniciando movimentação da ordem ${finalOrderId} para ${targetWeekDay}...`);
      
      // Usar a função moveCard que já faz toda a lógica
      await moveCard(finalOrderId, targetWeekDay);
      
      console.log(`✅ Movimentação concluída com sucesso!`);
      
      if (onSuccess) {
        onSuccess(finalOrderId, targetWeekDay);
      }
    } catch (error) {
      console.error('❌ Erro durante movimentação:', error);
      
      if (onError) {
        onError(`Erro ao reprogramar programação ${finalOrderId}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
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