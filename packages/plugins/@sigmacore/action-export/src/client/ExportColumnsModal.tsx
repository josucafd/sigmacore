import React, { useState } from 'react';

interface ExportColumnsModalProps {
  columns: { name: string; title: string }[];
  initialSelected: string[];
  onConfirm: (selected: string[]) => void;
  onCancel: () => void;
}

export const ExportColumnsModal: React.FC<ExportColumnsModalProps> = ({ columns, initialSelected, onConfirm, onCancel }) => {
  const [selected, setSelected] = useState<string[]>(initialSelected);

  const toggleColumn = (name: string) => {
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((col) => col !== name) : [...prev, name]
    );
  };

  return (
    <div className="export-columns-modal">
      <h3>Selecione as colunas para exportação</h3>
      <ul>
        {columns.map((col) => (
          <li key={col.name}>
            <label>
              <input
                type="checkbox"
                checked={selected.includes(col.name)}
                onChange={() => toggleColumn(col.name)}
              />
              {col.title}
            </label>
          </li>
        ))}
      </ul>
      <div style={{ marginTop: 16 }}>
        <button onClick={() => onConfirm(selected)}>Exportar</button>
        <button onClick={onCancel} style={{ marginLeft: 8 }}>Cancelar</button>
      </div>
    </div>
  );
}; 