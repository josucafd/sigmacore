import dayjs from 'dayjs';
import { Programacao } from '../../../KanbanBlockProvider';
import { ReportData } from '../types';
import { getAllStatusValues } from '../../../utils/statusUtils';

export const extractCardsFromResponse = (response: any): Programacao[] => {
  // console.log('🔧 extractCardsFromResponse: Iniciando extração...', response);
  
  // Função para explorar objeto recursivamente procurando por arrays
  const findArraysInObject = (obj: any, path = '', maxDepth = 3, currentDepth = 0): {path: string, array: any[]}[] => {
    if (currentDepth > maxDepth) return [];
    if (!obj || typeof obj !== 'object') return [];
    
    let results: {path: string, array: any[]}[] = [];
    
    // Se o objeto atual é um array com pelo menos um elemento e o primeiro tem id_programacao
    if (Array.isArray(obj) && obj.length > 0 && obj[0] && typeof obj[0] === 'object' && 'id_programacao' in obj[0]) {
      results.push({path, array: obj});
    }
    
    // Explorar propriedades recursivamente
    if (typeof obj === 'object' && obj !== null) {
      Object.keys(obj).forEach(key => {
        const newPath = path ? `${path}.${key}` : key;
        const nestedResults = findArraysInObject(obj[key], newPath, maxDepth, currentDepth + 1);
        results = [...results, ...nestedResults];
      });
    }
    
    return results;
  };
  
  // console.log('🔍 DEBUG DETALHADO:');
  // console.log('  - response.data:', response?.data);
  // console.log('  - response.data.data:', response?.data?.data);
  // console.log('  - Type of response.data.data:', typeof response?.data?.data);
  // console.log('  - Is response.data.data array?', Array.isArray(response?.data?.data));
  
  // Caso 1: Resposta do NocoBase com axios (response.data.data)
  if (response?.data?.data && Array.isArray(response.data.data)) {
    // console.log('✅ extractCardsFromResponse: Encontrado em response.data.data', response.data.data.length, 'items');
    return response.data.data;
  }
  
  // Caso 2: Objeto data direto (quando já é response.data)
  if (response?.data && Array.isArray(response.data)) {
    // console.log('✅ extractCardsFromResponse: Encontrado em response.data', response.data.length, 'items');
    return response.data;
  }
  
  // Caso 3: response.data.results (estrutura com results)
  if (response?.data?.results && Array.isArray(response.data.results)) {
    // console.log('✅ extractCardsFromResponse: Encontrado em response.data.results', response.data.results.length, 'items');
    return response.data.results;
  }
  
  // Caso 4: Resposta aninhada (response.data.data.data)
  if (response?.data?.data?.data && Array.isArray(response.data.data.data)) {
    // console.log('✅ extractCardsFromResponse: Encontrado em response.data.data.data', response.data.data.data.length, 'items');
    return response.data.data.data;
  }
  
  // Caso 5: response direto é array
  if (Array.isArray(response)) {
    // console.log('✅ extractCardsFromResponse: Response é array direto', response.length, 'items');
    return response;
  }
  
  // Caso 6: Buscar arrays recursivamente na estrutura
  // console.log('🔍 extractCardsFromResponse: Buscando arrays recursivamente na estrutura...');
  const foundArrays = findArraysInObject(response);
  
  if (foundArrays.length > 0) {
    // console.log('✅ extractCardsFromResponse: Arrays encontrados na exploração recursiva:', foundArrays.length);
    // foundArrays.forEach((found, index) => {
    //   console.log(`  Array #${index+1}:`, {
    //     path: found.path,
    //     length: found.array.length,
    //     sample: found.array.length > 0 ? found.array[0] : null
    //   });
    // });
    // console.log('✅ extractCardsFromResponse: Usando array do caminho:', foundArrays[0].path);
    return foundArrays[0].array;
  }
  
  // console.log('🔍 extractCardsFromResponse: Estrutura do response:', {
  //   hasData: !!response?.data,
  //   dataType: typeof response?.data,
  //   dataKeys: response?.data ? Object.keys(response.data) : null,
  //   isDataArray: Array.isArray(response?.data),
  //   dataDataExists: !!response?.data?.data,
  //   dataDataIsArray: Array.isArray(response?.data?.data),
  //   dataDataLength: Array.isArray(response?.data?.data) ? response.data.data.length : 'not array',
  //   dataDataDataExists: !!response?.data?.data?.data,
  //   dataDataDataIsArray: Array.isArray(response?.data?.data?.data),
  //   dataDataDataLength: Array.isArray(response?.data?.data?.data) ? response.data.data.data.length : 'not array',
  //   responseKeys: response ? Object.keys(response) : null,
  //   responseType: typeof response
  // });
  
  // console.log('❌ extractCardsFromResponse: Nenhum array encontrado, retornando array vazio');
  return [];
};

interface GenerateReportDataParams {
  dateRange: [dayjs.Dayjs, dayjs.Dayjs];
  includeFilters: boolean;
  filteredData: Programacao[];
  data: Programacao[];
  includeOverdue: boolean;
  overdueCards: Programacao[];
}

export const generateReportDataLogic = ({
  dateRange,
  includeFilters,
  filteredData,
  data,
  includeOverdue,
  overdueCards,
}: GenerateReportDataParams): ReportData => {
  const [startDate, endDate] = dateRange;
  const dataToExport = includeFilters ? filteredData : data;

  const filteredByDate = dataToExport.filter(programacao => {
    if (!programacao.data_termino) return false;
    try {
      const programacaoDate = dayjs(programacao.data_termino).format('YYYY-MM-DD');
      return programacaoDate >= startDate.format('YYYY-MM-DD') && programacaoDate <= endDate.format('YYYY-MM-DD');
    } catch {
      return false;
    }
  });

  const finalData = includeOverdue
    ? [...filteredByDate, ...overdueCards.filter(c => !filteredByDate.some(f => f.id_programacao === c.id_programacao))]
    : filteredByDate;

  const groupedByDate: Record<string, Programacao[]> = {};
  finalData.forEach(programacao => {
    const dateKey = dayjs(programacao.data_termino).format('YYYY-MM-DD');
    groupedByDate[dateKey] = groupedByDate[dateKey] || [];
    groupedByDate[dateKey].push(programacao);
  });

  const totalOrders = finalData.length;
  const totalQuantity = finalData.reduce((sum, p) => sum + (p.qtd_op || 0), 0);
  const statusDistribution: Record<string, number> = {};
  finalData.forEach(p => getAllStatusValues(p.setores_atuais).forEach(s => (statusDistribution[s] = (statusDistribution[s] || 0) + 1)));

  return {
    filteredByDate: finalData,
    groupedByDate,
    totalOrders,
    totalQuantity,
    statusDistribution,
    period: { start: startDate.format('DD/MM/YYYY'), end: endDate.format('DD/MM/YYYY') },
  };
}; 