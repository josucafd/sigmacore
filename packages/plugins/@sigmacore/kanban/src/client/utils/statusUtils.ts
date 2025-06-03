/**
 * Utilitários para trabalhar com status/setores das programações
 */

/**
 * Extrai todos os valores de status dos setores_atuais
 */
export const getAllStatusValues = (setoresAtuais: any): string[] => {
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

/**
 * Extrai o primeiro valor de status (para compatibilidade com código existente)
 */
export const getStatusValue = (setoresAtuais: any): string => {
  const allStatus = getAllStatusValues(setoresAtuais);
  return allStatus[0] || 'indefinido';
};

/**
 * Mapeia status/setores para cores
 */
export const getStatusColor = (status: string): string => {
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

/**
 * Formata o label do status para exibição
 */
export const formatStatusLabel = (status: string): string => {
  return status.replace(/_/g, ' ')
               .split(' ')
               .map(word => word.charAt(0).toUpperCase() + word.slice(1))
               .join(' ');
}; 