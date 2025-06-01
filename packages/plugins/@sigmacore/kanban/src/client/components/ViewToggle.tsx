import React from 'react';
import { Segmented } from 'antd';
import { CalendarOutlined, UnorderedListOutlined } from '@ant-design/icons';

export type ViewMode = 'weekly' | 'monthly';

export interface ViewToggleProps {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
}

export const ViewToggle: React.FC<ViewToggleProps> = ({ value, onChange }) => {
  const options = [
    {
      label: 'Semanal',
      value: 'weekly' as ViewMode,
      icon: <UnorderedListOutlined />,
    },
    {
      label: 'Mensal',
      value: 'monthly' as ViewMode,
      icon: <CalendarOutlined />,
    },
  ];

  return (
    <Segmented
      value={value}
      onChange={onChange}
      options={options}
      className="view-toggle"
    />
  );
}; 