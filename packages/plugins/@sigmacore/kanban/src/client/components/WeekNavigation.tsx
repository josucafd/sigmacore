import React from 'react';
import { Button, Space, Typography, Tooltip } from 'antd';
import { LeftOutlined, RightOutlined, CalendarOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useWeekNavigation } from '../hooks/useWeekNavigation';

const { Text } = Typography;

export interface WeekNavigationProps {
  weekNavigation: ReturnType<typeof useWeekNavigation>;
}

export const WeekNavigation: React.FC<WeekNavigationProps> = ({ weekNavigation }) => {
  const {
    currentWeekStart,
    isCurrentWeek,
    goToPreviousWeek,
    goToNextWeek,
    goToCurrentWeek,
    weekOffset,
    canGoToPreviousWeek,
    weekDays
  } = weekNavigation;

  // Formatar a data da semana para exibição
  const formatWeekRange = (): string => {
    if (weekDays.length === 0) {
      return "Sem dias a exibir";
    }
    
    const firstDay = weekDays[0];
    const lastDay = weekDays[weekDays.length - 1];
    
    const firstDate = firstDay.date;
    const lastDate = lastDay.date;

    const options: Intl.DateTimeFormatOptions = { 
      day: '2-digit', 
      month: '2-digit',
      year: 'numeric'
    };

    const startStr = firstDate.toLocaleDateString('pt-BR', options);
    const endStr = lastDate.toLocaleDateString('pt-BR', options);

    return `${startStr} - ${endStr}`;
  };

  const getWeekTitle = (): string => {
    if (weekOffset === 0) {
      return weekDays.length < 5 
        ? `Dias restantes desta semana` 
        : `Semana Atual`;
    }
    if (weekOffset === 1) return "Próxima Semana";
    if (weekOffset > 1) return `${weekOffset} semanas à frente`;
    return ""; // Não deve ocorrer já que não permitimos semanas no passado
  };

  return (
    <div className="week-navigation">
      <Space align="center" size="middle">
        <Button
          type="text"
          icon={<LeftOutlined />}
          onClick={goToPreviousWeek}
          size="small"
          title="Semana anterior"
          disabled={!canGoToPreviousWeek}
        />
        
        <div className="week-info">
          <Text strong style={{ fontSize: '14px' }}>
            {getWeekTitle()}
            {isCurrentWeek && weekDays.length < 5 && (
              <Tooltip title="Apenas dias atuais e futuros são exibidos">
                <InfoCircleOutlined style={{ marginLeft: '8px', color: '#1677ff' }} />
              </Tooltip>
            )}
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {formatWeekRange()}
          </Text>
        </div>

        <Button
          type="text"
          icon={<RightOutlined />}
          onClick={goToNextWeek}
          size="small"
          title="Próxima semana"
        />

        {!isCurrentWeek && (
          <Button
            type="primary"
            icon={<CalendarOutlined />}
            onClick={goToCurrentWeek}
            size="small"
            title="Voltar à semana atual"
          >
            Semana Atual
          </Button>
        )}
      </Space>
    </div>
  );
}; 