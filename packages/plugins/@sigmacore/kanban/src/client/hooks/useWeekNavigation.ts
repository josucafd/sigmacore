import { useState, useMemo } from 'react';

export interface WeekNavigationState {
  currentWeekStart: Date;
  weekDays: Array<{
    date: Date;
    weekDay: string;
    label: string;
    isToday: boolean;
  }>;
  isCurrentWeek: boolean;
}

export const useWeekNavigation = () => {
  // Estado para controlar qual semana está sendo exibida
  const [weekOffset, setWeekOffset] = useState(0); // 0 = semana atual

  // Função para obter o início da semana (segunda-feira) no fuso horário local
  const getWeekStart = (date: Date): Date => {
    const newDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const day = newDate.getDay();
    const diff = newDate.getDate() - day + (day === 0 ? -6 : 1); // Ajusta para segunda-feira
    newDate.setDate(diff);
    return newDate;
  };

  // Calcular a semana atual baseado no offset
  const currentWeekStart = useMemo(() => {
    const today = new Date();
    const weekStart = getWeekStart(today);
    weekStart.setDate(weekStart.getDate() + (weekOffset * 7));
    return weekStart;
  }, [weekOffset]);

  // Gerar os dias da semana (segunda a sexta), incluindo apenas dias atuais e futuros
  const weekDays = useMemo(() => {
    const days = [];
    const weekDayNames = [
      'segunda-feira',
      'terca-feira', 
      'quarta-feira',
      'quinta-feira',
      'sexta-feira'
    ];

    const weekDayLabels = {
      'segunda-feira': 'Segunda',
      'terca-feira': 'Terça',
      'quarta-feira': 'Quarta',
      'quinta-feira': 'Quinta',
      'sexta-feira': 'Sexta'
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    for (let i = 0; i < 5; i++) { // Segunda a sexta
      const date = new Date(currentWeekStart);
      date.setDate(currentWeekStart.getDate() + i);
      
      // Se estamos na semana atual (offset = 0) e a data é anterior à data atual, não incluir
      if (weekOffset === 0 && date < todayLocal) {
        continue; // Pula dias passados na semana atual
      }
      
      const isToday = date.getTime() === todayLocal.getTime();

      days.push({
        date,
        weekDay: weekDayNames[i],
        label: weekDayLabels[weekDayNames[i]],
        isToday
      });
    }

    return days;
  }, [currentWeekStart, weekOffset]);

  // Verificar se é a semana atual
  const isCurrentWeek = weekOffset === 0;

  // Verificar se é possível navegar para a semana anterior
  const canGoToPreviousWeek = useMemo(() => {
    // Só pode ir para a anterior se não estivermos já na semana atual (offset 0) ou em semanas futuras (offset > 0)
    // Basicamente, não pode ir para o passado além da semana atual.
    return weekOffset > 0;
  }, [weekOffset]);

  // Função para navegar para a semana anterior
  const goToPreviousWeek = () => {
    // Não permite ir para um offset negativo (passado em relação à semana de hoje)
    setWeekOffset(prev => (prev > 0 ? prev - 1 : 0));
  };

  // Função para navegar para a próxima semana
  const goToNextWeek = () => {
    setWeekOffset(prev => prev + 1);
  };

  // Função para voltar à semana atual
  const goToCurrentWeek = () => {
    setWeekOffset(0);
  };

  // Função para obter o dia da semana de uma data
  const getWeekDayFromDate = (date: string | Date): string => {
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return 'sem-data';
      
      // Converter para data local para evitar problemas de fuso horário
      const localDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const dayOfWeek = localDate.getDay();
      
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

  // Função para verificar se uma data está na semana atual sendo exibida
  const isDateInCurrentDisplayWeek = (date: string | Date): boolean => {
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return false;
      
      // Converter para data local para comparação
      const localDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const dateWeekStart = getWeekStart(localDate);
      
      return dateWeekStart.getTime() === currentWeekStart.getTime();
    } catch {
      return false;
    }
  };

  return {
    currentWeekStart,
    weekDays,
    isCurrentWeek,
    goToPreviousWeek,
    goToNextWeek,
    goToCurrentWeek,
    getWeekDayFromDate,
    isDateInCurrentDisplayWeek,
    weekOffset,
    canGoToPreviousWeek
  };
}; 