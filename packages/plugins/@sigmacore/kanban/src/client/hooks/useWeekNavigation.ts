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
      
      // Criar uma nova data usando as partes de data
      // Usamos os getUTC* para evitar problemas de fuso horário
      // O formato ISO "2025-06-03" será sempre interpretado como UTC
      // Então precisamos criar uma nova data local
      const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
      const [year, month, day] = dateStr.split('-').map(Number);
      
      // Garantir que estamos criando uma data local no dia correto
      const localDate = new Date(year, month - 1, day, 12, 0, 0);
      
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
      
      // Logging para debug
      console.log(`🗓️ Conversão de data: ${dateStr} => ${localDate.toISOString().split('T')[0]} => ${weekDays[dayOfWeek]}`);
      
      return weekDays[dayOfWeek];
    } catch (e) {
      console.error('❌ Erro ao calcular dia da semana:', e, date);
      return 'sem-data';
    }
  };

  // Função para verificar se uma data está na semana atual sendo exibida
  const isDateInCurrentDisplayWeek = (date: string | Date): boolean => {
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return false;
      
      // Usar o mesmo método que getWeekDayFromDate para garantir consistência
      const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
      const [year, month, day] = dateStr.split('-').map(Number);
      const localDate = new Date(year, month - 1, day, 12, 0, 0);
      
      // Verificar se a data é válida antes de prosseguir
      if (isNaN(localDate.getTime())) {
        console.error('❌ Data inválida após parsing:', dateStr, year, month, day);
        return false;
      }
      
      // Obter o início da semana para esta data
      const dateWeekStart = getWeekStart(localDate);
      
      // Verificar se dateWeekStart é uma data válida
      if (isNaN(dateWeekStart.getTime())) {
        console.error('❌ Início de semana inválido:', localDate);
        return false;
      }
      
      // Função helper segura para formatar data
      const safeISOString = (d: Date): string => {
        try {
          return d.toISOString().split('T')[0];
        } catch (e) {
          console.error('❌ Erro ao converter para ISO:', d, e);
          return 'invalid-date';
        }
      };
      
      const result = dateWeekStart.getTime() === currentWeekStart.getTime();
      console.log(`📅 Verificação de semana: ${dateStr} => Início da semana: ${safeISOString(dateWeekStart)} vs ${safeISOString(currentWeekStart)} = ${result}`);
      
      return result;
    } catch (e) {
      console.error('❌ Erro ao verificar semana:', e, date);
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