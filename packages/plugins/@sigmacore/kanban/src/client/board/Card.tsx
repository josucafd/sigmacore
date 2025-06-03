import React from 'react';
import { Button, Dropdown, Spin } from 'antd';
import { MoreOutlined, EditOutlined, DeleteOutlined, EyeOutlined, DragOutlined, LoadingOutlined } from '@ant-design/icons';
import { useDraggable } from '@dnd-kit/core';
import { Programacao, useKanbanBlockContext } from '../KanbanBlockProvider';

export interface CardProps {
  data: Programacao;
}

export const Card: React.FC<CardProps> = ({ data }) => {
  const { referencia, op_interna, op_cliente, qtd_op, setores_atuais, tipo_op, foto_piloto_url, data_termino } = data;
  const { movingCards, movedCards } = useKanbanBlockContext();

  // Verificar estados visuais
  const isMoving = movingCards.has(data.id_programacao);
  const wasMoved = movedCards.has(data.id_programacao);

  // Função para extrair o dia da semana da data
  const getWeekDay = (dataTermino: string): string => {
    if (!dataTermino) return 'sem-data';
    
    try {
      const date = new Date(dataTermino);
      if (isNaN(date.getTime())) return 'sem-data';
      
      const dayOfWeek = date.getDay();
      const weekDays = [
        'domingo',
        'segunda-feira', 
        'terca-feira',
        'quarta-feira',
        'quinta-feira',
        'sexta-feira',
        'sabado'
      ];
      
      return weekDays[dayOfWeek];
    } catch {
      return 'sem-data';
    }
  };

  // Configurar como draggable
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: String(data.id_programacao),
    data: {
      weekDay: getWeekDay(data_termino),
      programacao: data,
      originalId: data.id_programacao, // Manter o ID original para debug
    },
    disabled: isMoving, // Desabilitar drag durante movimentação
  });

  // Função para extrair todos os valores de status (para arrays)
  const getAllStatusValues = (setoresAtuais: any): string[] => {
    if (Array.isArray(setoresAtuais)) {
      // Se for array, retorna todos os items
      return setoresAtuais.map(item => String(item).toLowerCase());
    }
    if (typeof setoresAtuais === 'string') {
      // Se for string direta ou JSON string
      try {
        // Tenta fazer parse se for JSON string
        const parsed = JSON.parse(setoresAtuais);
        if (Array.isArray(parsed)) {
          return parsed.map(item => String(item).toLowerCase());
        }
        return [(parsed.value || parsed.setor || setoresAtuais).toLowerCase()];
      } catch {
        // Se não ser JSON, retorna a string limpa
        return [setoresAtuais.replace(/['"]/g, '').toLowerCase()];
      }
    } else if (typeof setoresAtuais === 'object' && setoresAtuais !== null) {
      return [(setoresAtuais.value || setoresAtuais.setor || 'indefinido').toLowerCase()];
    }
    return ['indefinido'];
  };

  // Função para extrair o valor do status (mantendo compatibilidade com código existente)
  const getStatusValue = (setoresAtuais: any): string => {
    const allStatus = getAllStatusValues(setoresAtuais);
    return allStatus[0] || 'indefinido';
  };

  // Função para calcular dias restantes
  const calcularDiasPrazo = (): { emAtraso: boolean; dias: number; ehHoje: boolean } => {
    if (!data_termino) {
      return { emAtraso: false, dias: 0, ehHoje: false };
    }

    try {
      const targetDate = new Date(data_termino);
      const today = new Date();
      
      // Normaliza as datas para o início do dia
      const targetStartOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
      const todayStartOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      // Calcula a diferença em dias
      const diffTime = targetStartOfDay.getTime() - todayStartOfDay.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      const ehHoje = diffDays === 0;
      const emAtraso = diffDays < 0;
      
      return {
        emAtraso,
        dias: Math.abs(diffDays),
        ehHoje
      };
    } catch {
      return { emAtraso: false, dias: 0, ehHoje: false };
    }
  };

  const menuItems = [
    {
      key: 'view',
      icon: <EyeOutlined />,
      label: 'Visualizar',
    },
    {
      key: 'edit', 
      icon: <EditOutlined />,
      label: 'Editar',
    },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: 'Excluir',
      danger: true,
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    console.log(`Ação ${key} para programação ${referencia} (ID: ${data.id_programacao})`);
    // Aqui você pode implementar as ações
  };

  const statusValues = getAllStatusValues(setores_atuais);
  const { emAtraso, dias, ehHoje } = calcularDiasPrazo();

  // Estilo para transformação durante o drag
  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  // Classes CSS dinâmicas baseadas no estado
  const cardClasses = [
    'kanban-card-container',
    isDragging ? 'kanban-card-dragging' : '',
    isMoving ? 'kanban-card-moving' : '',
    wasMoved ? 'kanban-card-moved' : ''
  ].filter(Boolean).join(' ');

  return (
    <div 
      ref={setNodeRef}
      style={{
        ...style,
        width: '200px',
        minWidth: '200px',
        maxWidth: '200px',
        flex: '0 0 auto',
        marginRight: '10px'
      }}
      className={cardClasses}
      {...attributes}
    >
      <div className="kanban-card-adapted">
        {/* Overlay de loading quando está sendo movido */}
        {isMoving && (
          <div className="kanban-card-loading-overlay">
            <Spin 
              indicator={<LoadingOutlined style={{ fontSize: 20, color: '#1677ff' }} spin />} 
              tip="Movendo..."
            />
          </div>
        )}

        {/* Imagem do produto */}
        <div className="kanban-card-image-section">
          <div className="kanban-card-image-wrapper">
            {/* Status atual sobreposto - agora mostra todos os setores */}
            <div className="kanban-card-status-overlay">
              <div className="status-badges-stack">
                {statusValues.map((statusValue, index) => (
                  <span key={index} className="status-badge">
                    {statusValue.replace('_', ' ').toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
            
            {foto_piloto_url ? (
              <img
                src={foto_piloto_url}
                alt={referencia || 'Produto'}
                className="kanban-card-product-image"
              />
            ) : (
              <div className="kanban-card-no-image">Sem foto</div>
            )}
          </div>
        </div>
        
        {/* Informações da programação */}
        <div className="kanban-card-info-section">
          <div className="kanban-card-content-space">
            {/* Badges de status */}
            <div className="kanban-card-badges">
              <span className={`badge ${emAtraso ? 'badge-danger' : ehHoje ? 'badge-today' : 'badge-normal'}`}>
                {emAtraso
                  ? `${dias}d atraso`
                  : ehHoje
                    ? 'Hoje'
                    : `${dias}d restantes`
                }
              </span>

              <span className="badge badge-secondary">
                {tipo_op || 'PROGRAMAÇÃO'}
              </span>

              {/* Badge de sucesso quando foi movido */}
              {wasMoved && (
                <span className="badge badge-success">
                  ✓ Movido
                </span>
              )}
            </div>

            {/* Informações detalhadas - apenas campos solicitados */}
            <div className="kanban-card-details-adapted">
              <p className="detail-ref">Ref: <span className="detail-value-adapted">{referencia || `#${data.id_programacao}`}</span></p>
              <p>Op Interna: <span className="detail-value-adapted">{op_interna || '-'}</span></p>
              {op_cliente && (
                <p>Op Cliente: <span className="detail-value-adapted">{op_cliente}</span></p>
              )}
              {qtd_op && (
                <p>Qtd: <span className="detail-value-adapted">{qtd_op.toLocaleString()}</span></p>
              )}
              {tipo_op && (
                <p>Tipo: <span className="detail-value-adapted">{tipo_op}</span></p>
              )}
            </div>
          </div>

          {/* Controles do card */}
          <div className="kanban-card-controls">
            {/* Handle de drag */}
            <Button 
              type="text" 
              icon={isMoving ? <LoadingOutlined spin /> : <DragOutlined />}
              size="small"
              className="kanban-card-drag-handle"
              disabled={isMoving}
              {...listeners}
            />
          </div>
        </div>
      </div>
    </div>
  );
}; 