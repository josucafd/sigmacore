import React, { useState } from 'react';
import { ExportColumnsModal } from './ExportColumnsModal';

interface ActionExportButtonProps {
  columns: { name: string; title: string }[];
  resource: string;
  filters?: any;
}

export const ActionExportButton: React.FC<ActionExportButtonProps> = ({ 
  columns, 
  resource, 
  filters 
}) => {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Carregar seleção salva do localStorage (opcional)
  const saved = localStorage.getItem(`export-cols-${resource}`);
  const initialSelected = saved ? JSON.parse(saved) : columns.map((c) => c.name);

  const handleExport = async (selectedCols: string[]) => {
    setLoading(true);
    try {
      // Salvar seleção para uso futuro
      localStorage.setItem(`export-cols-${resource}`, JSON.stringify(selectedCols));
      
      // Chamar endpoint de exportação da tabela
      const res = await fetch(`/api/${resource}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ columns: selectedCols, filters }),
      });

      if (!res.ok) {
        throw new Error('Erro na exportação');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${resource}-export.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      setShowModal(false);
    } catch (error) {
      console.error('Erro ao exportar:', error);
      alert('Erro ao exportar dados');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button onClick={() => setShowModal(true)} disabled={loading}>
        {loading ? 'Exportando...' : 'Exportar Excel'}
      </button>
      {showModal && (
        <ExportColumnsModal
          columns={columns}
          initialSelected={initialSelected}
          onConfirm={handleExport}
          onCancel={() => setShowModal(false)}
        />
      )}
    </>
  );
}; 