import React from 'react';
import { Modal, Select, DatePicker, ButtonProps } from 'antd';
import type { Dayjs } from 'dayjs';
import { Programacao } from '../../../KanbanBlockProvider';
import { formatStatusLabel } from '../../../utils/statusUtils';

interface ExportSettingsModalProps {
  visible: boolean;
  onCancel: () => void;
  onOk: () => void;
  exportFormat: 'pdf' | 'excel';
  dateRange: [Dayjs, Dayjs];
  setDateRange: (dates: [Dayjs, Dayjs]) => void;
  includeFilters: boolean;
  setIncludeFilters: (value: boolean) => void;
  includeOverdue: boolean;
  setIncludeOverdue: (value: boolean) => void;
  data: Programacao[];
  filteredData: Programacao[];
  overdueCards: Programacao[];
  selectedStatuses: string[];
  okButtonProps?: ButtonProps;
}

export const ExportSettingsModal: React.FC<ExportSettingsModalProps> = ({
  visible,
  onCancel,
  onOk,
  exportFormat,
  dateRange,
  setDateRange,
  includeFilters,
  setIncludeFilters,
  includeOverdue,
  setIncludeOverdue,
  data,
  filteredData,
  overdueCards,
  selectedStatuses,
  okButtonProps,
}) => {
  return (
    <Modal
      title={`Exportar ${exportFormat.toUpperCase()}`}
      open={visible}
      onCancel={onCancel}
      onOk={onOk}
      okText="Exportar"
      cancelText="Cancelar"
      width={500}
      okButtonProps={okButtonProps}
    >
      <div className="export-modal-content" style={{ padding: '16px' }}>
        <div style={{ marginBottom: 16, padding: 8, background: '#f0f2ff', borderRadius: 4 }}>
          <p style={{ margin: 0 }}>
            Selecione o período e os dados que deseja exportar. O relatório incluirá todas as programações dentro do período selecionado.
          </p>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8 }}>Período:</label>
          <DatePicker.RangePicker
            value={dateRange}
            onChange={(dates) => dates && setDateRange(dates as [Dayjs, Dayjs])}
            format="DD/MM/YYYY"
            style={{ width: '100%' }}
            placeholder={['Data inicial', 'Data final']}
            allowClear={false}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8 }}>Dados:</label>
          <Select
            value={includeFilters ? 'filtered' : 'all'}
            onChange={(value) => setIncludeFilters(value === 'filtered')}
            style={{ width: '100%' }}
            options={[
              { value: 'all', label: `Todos os dados (${data.length} programações)` },
              { value: 'filtered', label: `Dados filtrados (${filteredData.length} programações)` },
            ]}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8 }}>Incluir programações em atraso:</label>
          <Select
            value={includeOverdue ? 'yes' : 'no'}
            onChange={(value) => setIncludeOverdue(value === 'yes')}
            style={{ width: '100%' }}
            options={[
              { value: 'yes', label: `Sim (${overdueCards.length} programações)` },
              { value: 'no', label: 'Não' },
            ]}
          />
        </div>
        {includeFilters && selectedStatuses.length > 0 && (
          <div style={{ padding: 8, background: '#e6f7ff', borderRadius: 4 }}>
            <strong>Filtros aplicados:</strong> {selectedStatuses.map(s => formatStatusLabel(s)).join(', ')}
          </div>
        )}
      </div>
    </Modal>
  );
}; 