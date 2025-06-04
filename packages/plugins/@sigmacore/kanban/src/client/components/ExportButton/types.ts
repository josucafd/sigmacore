import { Programacao } from '../../KanbanBlockProvider';

export interface ReportData {
  filteredByDate: Programacao[];
  groupedByDate: Record<string, Programacao[]>;
  totalOrders: number;
  totalQuantity: number;
  statusDistribution: Record<string, number>;
  period: { start: string; end: string };
} 