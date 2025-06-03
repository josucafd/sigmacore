import React, { useMemo } from 'react';
import { Select, Tag } from 'antd';
import { FilterOutlined } from '@ant-design/icons';
import { Programacao } from '../KanbanBlockProvider';

export interface StatusFilterProps {
  data: Programacao[];
  selectedStatuses: string[];
  onStatusChange: (statuses: string[]) => void;
}

export const StatusFilter: React.FC<StatusFilterProps> = ({
  data,
  selectedStatuses,
  onStatusChange
}) => {
  // Extrair todos os status únicos dos dados
  const uniqueStatuses = useMemo(() => {
    const statusSet = new Set<string>();
    
    data.forEach(programacao => {
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

      const statusValues = getAllStatusValues(programacao.setores_atuais);
      statusValues.forEach(status => statusSet.add(status));
    });

    return Array.from(statusSet).sort();
  }, [data]);

  // Função para mapear status para cores
  const getStatusColor = (status: string): string => {
    const statusColorMap: Record<string, string> = {
      // Setores de produção típicos
      'corte': '#fa8c16',
      'costura': '#1677ff',
      'bordado': '#722ed1',
      'estampa': '#52c41a',
      'acabamento': '#13c2c2',
      'qualidade': '#faad14',
      'expedição': '#52c41a',
      'embalagem': '#13c2c2',
      
      // Status tradicionais mantidos para compatibilidade
      'aguardando': '#fa8c16',
      'em_producao': '#1677ff',
      'em_produção': '#1677ff',
      'producao': '#1677ff',
      'produção': '#1677ff',
      'concluido': '#52c41a',
      'concluído': '#52c41a',
      'entregue': '#13c2c2',
      'pausado': '#faad14',
      'cancelado': '#ff4d4f',
      'indefinido': '#8c8c8c',
      'pendente': '#722ed1'
    };

    return statusColorMap[status] || '#d9d9d9';
  };

  // Função para formatar o label do status
  const formatStatusLabel = (status: string): string => {
    return status.replace(/_/g, ' ')
                 .split(' ')
                 .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                 .join(' ');
  };

  // Contar quantos itens há para cada status
  const getStatusCount = (status: string): number => {
    return data.filter(programacao => {
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

      const statusValues = getAllStatusValues(programacao.setores_atuais);
      return statusValues.includes(status);
    }).length;
  };

  // Opções para o Select
  const selectOptions = uniqueStatuses.map(status => ({
    label: (
      <div className="status-option">
        <Tag color={getStatusColor(status)} style={{ margin: 0 }}>
          {formatStatusLabel(status)}
        </Tag>
        <span className="status-count">({getStatusCount(status)})</span>
      </div>
    ),
    value: status
  }));

  return (
    <div className="status-filter">
      <Select
        mode="multiple"
        placeholder="Filtrar por status"
        value={selectedStatuses}
        onChange={onStatusChange}
        options={selectOptions}
        style={{ minWidth: 250 }}
        maxTagCount="responsive"
        suffixIcon={<FilterOutlined />}
        allowClear
        showSearch={false}
        tagRender={(props) => {
          const { label, value } = props;
          return (
            <Tag
              color={getStatusColor(value as string)}
              closable
              onClose={props.onClose}
              style={{ marginRight: 4 }}
            >
              {formatStatusLabel(value as string)}
            </Tag>
          );
        }}
      />
    </div>
  );
}; 