import React, { useMemo, useState } from 'react';
import { Calendar, Badge, Modal, List, Tag, Button, Descriptions } from 'antd';
import { LeftOutlined, RightOutlined, EyeOutlined } from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { ProductionOrder } from '../KanbanBlockProvider';
import { getAllStatusValues, getStatusColor, formatStatusLabel } from '../utils/statusUtils';

export interface MonthlyCalendarProps {
  data: ProductionOrder[];
}

export const MonthlyCalendar: React.FC<MonthlyCalendarProps> = ({ data }) => {
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(null);
  const [currentMonth, setCurrentMonth] = useState(dayjs());

  // Agrupar dados por data
  const dataByDate = useMemo(() => {
    const grouped: Record<string, ProductionOrder[]> = {};
    
    data.forEach(order => {
      if (order.weekDay) {
        const dateKey = dayjs(order.weekDay).format('YYYY-MM-DD');
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(order);
      }
    });
    
    return grouped;
  }, [data]);

  // Função para renderizar o conteúdo de cada célula do calendário
  const cellRender = (current: Dayjs, info: any) => {
    if (info.type === 'month') {
      // Para a visualização de mês, não fazemos customização adicional aqui, apenas retornamos o nó original
      return info.originNode;
    }

    // Se for 'date', aplicamos a lógica anterior de dateCellRender
    const dateKey = current.format('YYYY-MM-DD');
    const ordersForDate = dataByDate[dateKey] || [];
    
    if (ordersForDate.length === 0) {
      // Retorna o nó original da célula se não houver ordens, 
      // para manter o comportamento padrão da célula (número do dia, etc.)
      return info.originNode; 
    }

    // Calcular estatísticas do dia
    const totalOrders = ordersForDate.length;
    const totalQuantity = ordersForDate.reduce((sum, order) => sum + (order.qtd || 0), 0);
    
    // Contar status únicos
    const statusCount: Record<string, number> = {};
    ordersForDate.forEach(order => {
      const statuses = getAllStatusValues(order.status);
      statuses.forEach(status => {
        statusCount[status] = (statusCount[status] || 0) + 1;
      });
    });

    // Determinar cor do badge baseado na carga
    let badgeStatus: 'success' | 'processing' | 'error' | 'warning' | 'default' = 'default';
    if (totalOrders >= 8) badgeStatus = 'error';
    else if (totalOrders >= 5) badgeStatus = 'warning';
    else if (totalOrders >= 3) badgeStatus = 'processing';
    else if (totalOrders >= 1) badgeStatus = 'success';

    return (
      <div className="calendar-cell-content">
        <Badge 
          status={badgeStatus} 
          text={`${totalOrders} programações`}
          className="calendar-cell-badge"
        />
        
        {totalQuantity > 0 && (
          <div className="calendar-cell-quantity">
            {totalQuantity.toLocaleString()} pçs
          </div>
        )}
        
        <div className="calendar-cell-status">
          {Object.entries(statusCount).slice(0, 2).map(([status, count]) => (
            <Tag 
              key={status} 
              color={getStatusColor(status)} 
              className="calendar-status-tag"
            >
              {count}
            </Tag>
          ))}
          {Object.keys(statusCount).length > 2 && (
            <Tag className="calendar-status-more">
              +{Object.keys(statusCount).length - 2}
            </Tag>
          )}
        </div>
      </div>
    );
  };

  // Função para lidar com clique em uma data - CORRIGIDO
  const onDateSelect = (value: Dayjs) => {
    const dateKey = value.format('YYYY-MM-DD');
    const ordersForDate = dataByDate[dateKey] || [];
    
    // Só abrir modal se houver ordens E se foi realmente um clique do usuário
    if (ordersForDate.length > 0) {
      setSelectedDate(value);
      setModalVisible(true);
    }
  };

  // Função para navegar entre meses - CORRIGIDO
  const onPanelChange = (value: Dayjs, mode: 'month' | 'year') => {
    setCurrentMonth(value);
    // Fechar modal se estiver aberto para evitar inconsistências
    if (modalVisible) {
      setModalVisible(false);
      setSelectedDate(null);
    }
  };

  // Função para visualizar detalhes de uma ordem
  const handleViewOrder = (order: ProductionOrder) => {
    setSelectedOrder(order);
    setDetailModalVisible(true);
  };

  // Dados das ordens para a data selecionada
  const selectedDateOrders = selectedDate 
    ? dataByDate[selectedDate.format('YYYY-MM-DD')] || []
    : [];

  return (
    <div className="monthly-calendar">
      <div className="monthly-calendar-header">
        <h3 className="monthly-calendar-title">
          Visualização Mensal - {currentMonth.format('MMMM YYYY')}
        </h3>
        <div className="monthly-calendar-legend">
          <Badge status="success" text="1-2 programações" />
          <Badge status="processing" text="3-4 programações" />
          <Badge status="warning" text="5-7 programações" />
          <Badge status="error" text="8+ programações" />
        </div>
      </div>

      <Calendar
        value={currentMonth}
        onPanelChange={onPanelChange}
        onSelect={onDateSelect}
        cellRender={cellRender}
        headerRender={({ value, type, onChange, onTypeChange }) => (
          <div className="calendar-header">
            <div className="calendar-header-controls">
              <Button 
                icon={<LeftOutlined />} 
                onClick={() => onChange(value.subtract(1, 'month'))}
                size="small"
              />
              <span className="calendar-header-title">
                {value.format('MMMM YYYY')}
              </span>
              <Button 
                icon={<RightOutlined />} 
                onClick={() => onChange(value.add(1, 'month'))}
                size="small"
              />
            </div>
            <Button 
              onClick={() => onChange(dayjs())}
              size="small"
              type="primary"
              ghost
            >
              Hoje
            </Button>
          </div>
        )}
      />

      {/* Modal com lista de programações do dia selecionado */}
      <Modal
        title={
          <div className="modal-title">
            <span>Programações para {selectedDate?.format('DD/MM/YYYY')}</span>
            <Badge count={selectedDateOrders.length} showZero />
          </div>
        }
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setSelectedDate(null);
        }}
        footer={null}
        width={600}
        className="calendar-orders-modal"
      >
        <List
          dataSource={selectedDateOrders}
          renderItem={(order) => {
            const statuses = getAllStatusValues(order.status);
            return (
              <List.Item
                actions={[
                  <Button 
                    key="view" 
                    icon={<EyeOutlined />} 
                    size="small"
                    onClick={() => handleViewOrder(order)}
                    title="Ver detalhes completos da programação"
                  >
                    Ver
                  </Button>
                ]}
              >
                <List.Item.Meta
                  title={
                    <div className="order-title">
                      <span>{order.ref || `#${order.id}`}</span>
                      <div className="order-status-tags">
                        {statuses.map((status, index) => (
                          <Tag 
                            key={index} 
                            color={getStatusColor(status)}
                          >
                            {formatStatusLabel(status)}
                          </Tag>
                        ))}
                      </div>
                    </div>
                  }
                  description={
                    <div className="order-details">
                      <div>Op Interna: {order.opInterna || '-'}</div>
                      {order.opCliente && <div>Op Cliente: {order.opCliente}</div>}
                      {order.qtd && <div>Quantidade: {order.qtd.toLocaleString()} pçs</div>}
                      {order.produto && <div>Produto: {order.produto}</div>}
                    </div>
                  }
                />
              </List.Item>
            );
          }}
        />
      </Modal>

      {/* Modal de detalhes completos da programação */}
      <Modal
        title={`Detalhes da Programação ${selectedOrder?.ref || selectedOrder?.id}`}
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
          setSelectedOrder(null);
        }}
        footer={null}
        width={700}
      >
        {selectedOrder && (
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="Referência" span={2}>
              {selectedOrder.ref || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="OP Interna">
              {selectedOrder.opInterna || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="OP Cliente">
              {selectedOrder.opCliente || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Quantidade">
              {selectedOrder.qtd ? `${selectedOrder.qtd.toLocaleString()} pçs` : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Prioridade">
              <Tag color={
                selectedOrder.priority === 'high' ? 'red' :
                selectedOrder.priority === 'normal' ? 'green' : 'blue'
              }>
                {selectedOrder.priority || 'normal'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Produto" span={2}>
              {selectedOrder.produto || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Data Programada" span={2}>
              {selectedOrder.weekDay ? dayjs(selectedOrder.weekDay).format('DD/MM/YYYY') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Status" span={2}>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {getAllStatusValues(selectedOrder.status).map((status, index) => (
                  <Tag key={index} color={getStatusColor(status)}>
                    {formatStatusLabel(status)}
                  </Tag>
                ))}
              </div>
            </Descriptions.Item>
            {selectedOrder.imageUrl && (
              <Descriptions.Item label="Imagem" span={2}>
                <img 
                  src={selectedOrder.imageUrl} 
                  alt="Produto" 
                  style={{ maxWidth: '200px', maxHeight: '150px', objectFit: 'contain' }}
                />
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Criado em">
              {selectedOrder.createdAt ? dayjs(selectedOrder.createdAt).format('DD/MM/YYYY HH:mm') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Atualizado em">
              {selectedOrder.updatedAt ? dayjs(selectedOrder.updatedAt).format('DD/MM/YYYY HH:mm') : '-'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}; 