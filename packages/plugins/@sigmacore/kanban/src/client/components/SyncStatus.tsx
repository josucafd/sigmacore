import React from 'react';
import { Tooltip, Badge, Typography } from 'antd';
import { CheckCircleOutlined, SyncOutlined, ClockCircleOutlined, WifiOutlined } from '@ant-design/icons';

const { Text } = Typography;

export interface SyncStatusProps {
  /** Se está sincronizando no momento */
  isSyncing: boolean;
  /** Data da última sincronização */
  lastSync: Date | null;
  /** Tempo desde a última sincronização em segundos */
  timeSinceLastSync: number | null;
  /** Se o polling está ativo */
  isPolling?: boolean;
  /** Se a aba está ativa */
  isTabActive?: boolean;
  /** Estilo de exibição */
  variant?: 'badge' | 'text' | 'full';
  /** Tamanho */
  size?: 'small' | 'default';
}

export const SyncStatus: React.FC<SyncStatusProps> = ({
  isSyncing,
  lastSync,
  timeSinceLastSync,
  isPolling = false,
  isTabActive = true,
  variant = 'badge',
  size = 'default'
}) => {
  // Função para formatar o tempo da última sincronização
  const formatLastSync = () => {
    if (!lastSync) return 'Nunca sincronizado';
    
    const diffInMs = Date.now() - lastSync.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Agora mesmo';
    if (diffInMinutes < 60) return `${diffInMinutes}min atrás`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h atrás`;
    
    return lastSync.toLocaleDateString('pt-BR');
  };

  // Determinar status e cor
  const getStatus = () => {
    if (isSyncing) {
      return {
        status: 'processing' as const,
        color: '#1677ff',
        icon: <SyncOutlined spin />,
        text: 'Sincronizando...',
        description: 'Atualizando dados em tempo real'
      };
    }

    if (!lastSync) {
      return {
        status: 'default' as const,
        color: '#8c8c8c',
        icon: <ClockCircleOutlined />,
        text: 'Não sincronizado',
        description: 'Nenhuma sincronização realizada ainda'
      };
    }

    const isRecent = timeSinceLastSync ? timeSinceLastSync < 300 : false; // Últimos 5 minutos

    if (isRecent) {
      return {
        status: 'success' as const,
        color: '#52c41a',
        icon: <CheckCircleOutlined />,
        text: 'Sincronizado',
        description: `Última sincronização: ${formatLastSync()}`
      };
    }

    return {
      status: 'warning' as const,
      color: '#faad14',
      icon: <ClockCircleOutlined />,
      text: 'Desatualizado',
      description: `Última sincronização: ${formatLastSync()}`
    };
  };

  const statusInfo = getStatus();

  // Tooltip com informações detalhadas
  const tooltipContent = (
    <div style={{ maxWidth: 200 }}>
      <div><strong>Status:</strong> {statusInfo.text}</div>
      <div><strong>Última sincronização:</strong> {formatLastSync()}</div>
      {isPolling && (
        <div><strong>Sincronização automática:</strong> Ativa</div>
      )}
      <div><strong>Aba ativa:</strong> {isTabActive ? 'Sim' : 'Não'}</div>
      {timeSinceLastSync !== null && (
        <div><strong>Última atualização:</strong> {timeSinceLastSync}s atrás</div>
      )}
    </div>
  );

  // Renderização baseada na variante
  switch (variant) {
    case 'badge':
      return (
        <Tooltip title={tooltipContent} placement="bottom">
          <Badge
            status={statusInfo.status}
            text={
              <span style={{ 
                fontSize: size === 'small' ? '11px' : '12px',
                color: statusInfo.color 
              }}>
                {statusInfo.icon} {statusInfo.text}
              </span>
            }
          />
        </Tooltip>
      );

    case 'text':
      return (
        <Tooltip title={tooltipContent} placement="bottom">
          <Text 
            style={{ 
              fontSize: size === 'small' ? '11px' : '12px',
              color: statusInfo.color,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            {statusInfo.icon} {statusInfo.text}
          </Text>
        </Tooltip>
      );

    case 'full':
      return (
        <div 
          className="sync-status-full"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 8px',
            background: `${statusInfo.color}15`,
            border: `1px solid ${statusInfo.color}40`,
            borderRadius: '6px',
            fontSize: size === 'small' ? '11px' : '12px'
          }}
        >
          <span style={{ color: statusInfo.color }}>
            {statusInfo.icon}
          </span>
          <div>
            <div style={{ fontWeight: 500, color: statusInfo.color }}>
              {statusInfo.text}
            </div>
            <div style={{ fontSize: '10px', color: '#666', marginTop: '1px' }}>
              {formatLastSync()}
            </div>
          </div>
          {isPolling && isTabActive && (
            <Tooltip title="Sincronização automática ativa">
              <WifiOutlined style={{ color: '#52c41a', fontSize: '10px' }} />
            </Tooltip>
          )}
        </div>
      );

    default:
      return null;
  }
}; 