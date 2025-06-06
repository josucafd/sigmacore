import React, { useState } from 'react';
import { Button, Modal, Checkbox, message } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { useCollection_deprecated, useAPIClient } from '@nocobase/client';

export interface ActionExportProps {
  collection: string;
  title?: string;
  icon?: React.ReactNode;
  filter?: Record<string, any>;
  onFinish?: () => void;
  onError?: (error: Error) => void;
}

export const ActionExport: React.FC<ActionExportProps> = (props) => {
  const {
    collection,
    title = 'Export SIGMA',
    icon = <DownloadOutlined />,
    filter = {},
    onFinish,
    onError,
  } = props;

  const [visible, setVisible] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [columns, setColumns] = useState<{ dataIndex: string[]; title: string; defaultTitle: string }[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  
  const { fields } = useCollection_deprecated();
  const api = useAPIClient();
  
  const showModal = () => {
    // Load columns from collection
    if (fields) {
      const collectionColumns = Object.values(fields)
        .filter((field) => !field.hidden && field.interface && !field.target)
        .map((field) => ({
          dataIndex: [field.name],
          title: field.title || field.name,
          defaultTitle: field.title || field.name,
        }));

      setColumns(collectionColumns);
      
      // Load saved selection or select all by default
      const savedColumns = localStorage.getItem(`export-cols-${collection}`);
      if (savedColumns) {
        try {
          setSelectedColumns(JSON.parse(savedColumns));
        } catch (e) {
          setSelectedColumns(collectionColumns.map((col) => col.dataIndex[0]));
        }
      } else {
        setSelectedColumns(collectionColumns.map((col) => col.dataIndex[0]));
      }
    }
    
    setVisible(true);
  };

  const handleCancel = () => {
    setVisible(false);
  };

  const handleExport = async () => {
    if (!selectedColumns.length) {
      message.warning('Selecione pelo menos uma coluna para exportar');
      return;
    }

    try {
      setConfirmLoading(true);
      
      // Save selection for future use
      localStorage.setItem(`export-cols-${collection}`, JSON.stringify(selectedColumns));
      
      // Prepare columns data in the format expected by the server
      const columnsData = columns
        .filter(col => selectedColumns.includes(col.dataIndex[0]))
        .map(col => ({
          dataIndex: col.dataIndex,
          title: col.title,
          defaultTitle: col.defaultTitle
        }));
      
      // Call the export action
      const response = await api.request({
        url: `${collection}:export`,
        method: 'POST',
        data: { 
          columns: columnsData 
        },
        params: { 
          filter,
          title: collection.toUpperCase().replace(/_/g, ' ')
        },
        responseType: 'blob',
      });
      
      // Create a download link
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${collection}-export.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      message.success('Exportação concluída com sucesso!');
      setVisible(false);
      
      if (onFinish) {
        onFinish();
      }
    } catch (error) {
      console.error('Erro ao exportar:', error);
      message.error('Erro ao exportar. Tente novamente.');
      
      if (onError) {
        onError(error);
      }
    } finally {
      setConfirmLoading(false);
    }
  };

  const toggleAllColumns = (checked: boolean) => {
    setSelectedColumns(checked ? columns.map((col) => col.dataIndex[0]) : []);
  };

  const toggleColumn = (field: string, checked: boolean) => {
    setSelectedColumns((prev) => {
      if (checked) {
        return [...prev, field];
      } else {
        return prev.filter((col) => col !== field);
      }
    });
  };

  return (
    <>
      <Button 
        onClick={showModal} 
        icon={icon} 
        type="default"
      >
        {title}
      </Button>
      
      <Modal
        title="Selecione as colunas para exportação"
        open={visible}
        onCancel={handleCancel}
        onOk={handleExport}
        width={500}
        confirmLoading={confirmLoading}
        okText="Exportar"
        cancelText="Cancelar"
      >
        <div style={{ marginBottom: 16 }}>
          <Checkbox
            checked={selectedColumns.length === columns.length}
            indeterminate={selectedColumns.length > 0 && selectedColumns.length < columns.length}
            onChange={(e) => toggleAllColumns(e.target.checked)}
          >
            Selecionar todos
          </Checkbox>
        </div>
        <div style={{ maxHeight: '50vh', overflow: 'auto' }}>
          {columns.map((col) => (
            <div key={col.dataIndex[0]} style={{ marginBottom: 8 }}>
              <Checkbox
                checked={selectedColumns.includes(col.dataIndex[0])}
                onChange={(e) => toggleColumn(col.dataIndex[0], e.target.checked)}
              >
                {col.title}
              </Checkbox>
            </div>
          ))}
        </div>
      </Modal>
    </>
  );
}; 