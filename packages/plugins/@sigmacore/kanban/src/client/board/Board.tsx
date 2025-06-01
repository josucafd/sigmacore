import React, { useState } from 'react';
import { Spin, Alert, Button, message, Badge, Empty } from 'antd';
import { ReloadOutlined, DownCircleOutlined, UpCircleOutlined, RightOutlined } from '@ant-design/icons';
import { DndContext, DragEndEvent, DragStartEvent, DragOverEvent } from '@dnd-kit/core';
import { Column } from './Column';
import { OverdueLane } from './OverdueLane';
import { useKanbanBlockContext } from '../KanbanBlockProvider';
import { StatusFilter } from '../components/StatusFilter';
import { DragOverlay } from '../components/DragOverlay';
import { MonthlyCalendar } from '../components/MonthlyCalendar';
import { ViewToggle, ViewMode } from '../components/ViewToggle';
import { ExportButton } from '../components/ExportButton';
import { WeekNavigation } from '../components/WeekNavigation';
import { useDragAndDrop } from '../hooks/useDragAndDrop';

export const Board: React.FC = () => {
  const { 
    columns, 
    loading, 
    error, 
    refetch, 
    data, 
    filteredData,
    selectedStatuses, 
    setSelectedStatuses,
    weekNavigation,
    moveCard,
    movingCards,
    overdueCards,
    showOverdueSection,
    toggleOverdueSection
  } = useKanbanBlockContext();

  const [viewMode, setViewMode] = useState<ViewMode>('weekly');

  // Hook para gerenciar drag & drop simplificado
  const {
    activeId,
    isDragging,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
  } = useDragAndDrop({
    weekNavigation,
    moveCard,
    onSuccess: (orderId, targetWeekDay) => {
      message.success({
        content: `Programação ${orderId} reprogramada com sucesso para ${targetWeekDay}!`,
        duration: 3,
        key: `move-${orderId}`, // Evita duplicar mensagens
      });
      console.log(`✅ Sucesso: Programação ${orderId} movida para ${targetWeekDay}`);
    },
    onError: (errorMessage) => {
      message.error({
        content: errorMessage,
        duration: 4,
        key: `error-${Date.now()}`, // Evita duplicar mensagens de erro
      });
    }
  });

  console.log('📋 Board - columns:', columns, 'loading:', loading, 'error:', error);

  if (loading) {
    return (
      <div className="kanban-board-loading">
        <Spin size="large" tip="Carregando programações..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="kanban-board-error">
        <Alert
          message="Erro ao carregar dados"
          description={error}
          type="error"
          showIcon
          action={
            <Button
              size="small"
              icon={<ReloadOutlined />}
              onClick={refetch}
            >
              Tentar novamente
            </Button>
          }
        />
      </div>
    );
  }

  // Renderizar visualização mensal
  if (viewMode === 'monthly') {
    return (
      <div className="kanban-board">
        <div className="kanban-board-header">
          <div className="kanban-board-title-section">
            <h2 className="kanban-board-title">Kanban de Programação</h2>
            {selectedStatuses.length > 0 && (
              <span className="kanban-board-filter-info">
                ({filteredData.length} de {data.length} programações)
              </span>
            )}
          </div>
          
          <div className="kanban-board-controls">
            <ViewToggle value={viewMode} onChange={setViewMode} />
            <StatusFilter
              data={data}
              selectedStatuses={selectedStatuses}
              onStatusChange={setSelectedStatuses}
            />
            <ExportButton
              data={data}
              filteredData={filteredData}
              selectedStatuses={selectedStatuses}
              viewMode={viewMode}
            />
            <Button
              icon={<ReloadOutlined />}
              onClick={refetch}
              type="default"
              size="small"
            >
              Atualizar
            </Button>
          </div>
        </div>
        
        <MonthlyCalendar data={filteredData} />
      </div>
    );
  }

  // Calcular total de cards em movimentação
  const movingCount = movingCards.size;

  // Renderizar visualização semanal (kanban)
  return (
    <DndContext
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className={`kanban-board ${isDragging ? 'kanban-board-dragging' : ''}`}>
        <div className="kanban-board-header">
          <div className="kanban-board-title-section">
            <h2 className="kanban-board-title">
              Kanban de Programação
              {movingCount > 0 && (
                <Badge 
                  count={movingCount} 
                  style={{ 
                    backgroundColor: '#1677ff',
                    marginLeft: 8,
                    fontSize: '10px'
                  }}
                  title={`${movingCount} programação${movingCount > 1 ? 's' : ''} sendo movida${movingCount > 1 ? 's' : ''}`}
                />
              )}
            </h2>
            {selectedStatuses.length > 0 && (
              <span className="kanban-board-filter-info">
                ({columns.reduce((total, col) => total + col.cards.length, 0)} de {data.length} programações)
              </span>
            )}
          </div>
          
          <div className="kanban-board-controls">
            <ViewToggle value={viewMode} onChange={setViewMode} />
            <StatusFilter
              data={data}
              selectedStatuses={selectedStatuses}
              onStatusChange={setSelectedStatuses}
            />
            <ExportButton
              data={data}
              filteredData={filteredData}
              selectedStatuses={selectedStatuses}
              viewMode={viewMode}
            />
            <Button
              icon={<ReloadOutlined />}
              onClick={refetch}
              type="default"
              size="small"
              title="Recarregar todos os dados"
              loading={movingCount > 0}
              disabled={movingCount > 0}
            >
              Atualizar
            </Button>
            {overdueCards.length > 0 && (
              <Button
                icon={showOverdueSection ? <UpCircleOutlined /> : <DownCircleOutlined />}
                onClick={toggleOverdueSection}
                type="default"
                size="small"
                title={showOverdueSection ? 'Ocultar Atrasadas' : 'Mostrar Atrasadas'}
                style={{ marginLeft: 8 }}
              >
                Atrasadas ({overdueCards.length})
              </Button>
            )}
          </div>
        </div>

        {/* Navegação por semanas */}
        <div className="kanban-week-navigation">
          <WeekNavigation weekNavigation={weekNavigation} />
        </div>

        {/* Indicador de atividade global */}
        {movingCount > 0 && (
          <div className="kanban-activity-indicator">
            <Spin size="small" />
            <span style={{ marginLeft: 8, fontSize: 12, color: '#1677ff' }}>
              Reprogramando {movingCount} programação{movingCount > 1 ? 's' : ''}...
            </span>
          </div>
        )}
        
        {/* Seção de Atrasados */}
        {showOverdueSection && overdueCards.length > 0 && <OverdueLane />}

        {/* Colunas dos dias da semana */}
        {columns.length === 0 && weekNavigation.isCurrentWeek && (
          <div className="kanban-empty-week">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span>
                  Não há dias para exibir na semana atual.
                  <br />
                  <small>Apenas dias atuais e futuros são exibidos.</small>
                </span>
              }
            />
            <Button
              type="primary"
              onClick={weekNavigation.goToNextWeek}
              style={{ marginTop: '16px' }}
              icon={<RightOutlined />}
            >
              Ver próxima semana
            </Button>
          </div>
        )}
        
        {columns.map((column) => (
          <div key={column.id} className="kanban-day-row">
            <Column
              key={column.id}
              columnKey={column.id}
              title={column.title}
              data={column.cards}
              backgroundColor={column.backgroundColor}
              isToday={column.isToday}
            />
          </div>
        ))}

        <DragOverlay activeId={activeId} data={data} />
      </div>
    </DndContext>
  );
}; 