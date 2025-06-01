/**
 * Utilitários para manipulação de status
 */

/**
 * Extrai todos os valores de status de um campo status (que pode ser string, array ou objeto)
 */
export const getAllStatusValues = (status: any): string[] => {
  if (Array.isArray(status)) {
    return status.map(item => String(item).toLowerCase());
  }
  if (typeof status === 'string') {
    try {
      const parsed = JSON.parse(status);
      if (Array.isArray(parsed)) {
        return parsed.map(item => String(item).toLowerCase());
      }
      return [(parsed.value || parsed.status || status).toLowerCase()];
    } catch {
      return [status.replace(/['"]/g, '').toLowerCase()];
    }
  } else if (typeof status === 'object' && status !== null) {
    return [(status.value || status.status || 'indefinido').toLowerCase()];
  }
  return ['indefinido'];
};

/**
 * Extrai o primeiro valor de status (para compatibilidade com código existente)
 */
export const getStatusValue = (status: any): string => {
  const allStatus = getAllStatusValues(status);
  return allStatus[0] || 'indefinido';
};

/**
 * Mapeia status para cores
 */
export const getStatusColor = (status: string): string => {
  const statusColorMap: Record<string, string> = {
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

/**
 * Formata o label do status para exibição
 */
export const formatStatusLabel = (status: string): string => {
  return status.replace(/_/g, ' ')
               .split(' ')
               .map(word => word.charAt(0).toUpperCase() + word.slice(1))
               .join(' ');
}; 