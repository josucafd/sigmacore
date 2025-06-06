import { Plugin } from '@nocobase/server';
import { Workbook } from 'exceljs';
import _ from 'lodash';

export class ActionExportServer extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {
    // Register the action
    this.app.resourcer.registerActionHandler('export', async (ctx, next) => {
      try {
        const { filterByTk, filter = {}, values = {} } = ctx.action.params;
        const { columns } = values || ctx.request.body || {};
        
        if (!columns || !Array.isArray(columns) || columns.length === 0) {
          ctx.status = 400;
          ctx.body = { errors: [{ message: 'Colunas não especificadas' }] };
          return;
        }

        // Get collection repository
        const repo = ctx.app.db.getRepository(ctx.action.resourceName);
        
        // Process columns format - handle both simple strings and complex objects
        const processedColumns = columns.map(column => {
          if (typeof column === 'string') {
            return { dataIndex: [column], title: column };
          } else if (column.dataIndex && Array.isArray(column.dataIndex)) {
            return {
              dataIndex: column.dataIndex,
              title: column.title || column.defaultTitle || column.dataIndex.join('.')
            };
          } else {
            return { dataIndex: [String(column)], title: String(column) };
          }
        });

        // Prepare query options
        const options: any = {
          filter: { ...filter },
          limit: 10000
        };
        
        if (filterByTk) {
          options.filterByTk = filterByTk;
        }
        
        // Add requested associations if needed
        const associations = [];
        for (const column of processedColumns) {
          const fieldPath = column.dataIndex.join('.');
          if (fieldPath.includes('.')) {
            const [association] = fieldPath.split('.');
            if (!associations.includes(association)) {
              associations.push(association);
            }
          }
        }
        
        if (associations.length > 0) {
          options.appends = associations;
        }
        
        // Fetch data
        const collection = ctx.app.db.getCollection(ctx.action.resourceName);
        const records = await repo.find(options);
        
        // Create Excel workbook
        const workbook = new Workbook();
        const sheet = workbook.addWorksheet('Export');
        
        // Get field titles (from collection fields or columns config)
        const headerRow = [];
        for (const column of processedColumns) {
          let title = column.title;
          
          // Try to get a better title from collection field
          if (collection && column.dataIndex.length === 1) {
            const field = collection.getField(column.dataIndex[0]);
            if (field && field.options.title) {
              title = field.options.title;
            }
          }
          
          headerRow.push(title);
        }
        
        // Add header row
        sheet.addRow(headerRow);
        
        // Format header row
        const headerRowObj = sheet.getRow(1);
        headerRowObj.font = { bold: true };
        headerRowObj.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' }
        };
        
        // Add data rows
        for (const record of records) {
          const rowData = [];
          
          for (const column of processedColumns) {
            const fieldPath = column.dataIndex.join('.');
            
            // Handle nested properties
            if (fieldPath.includes('.')) {
              const parts = fieldPath.split('.');
              let value = record;
              for (const part of parts) {
                value = value ? value[part] : null;
                if (value === null || value === undefined) break;
              }
              rowData.push(value);
            } else {
              rowData.push(record[fieldPath]);
            }
          }
          
          sheet.addRow(rowData);
        }
        
        // Auto fit columns
        sheet.columns.forEach(column => {
          let maxLength = 0;
          column.eachCell({ includeEmpty: true }, cell => {
            const length = cell.value ? cell.value.toString().length : 10;
            if (length > maxLength) {
              maxLength = length;
            }
          });
          column.width = Math.min(maxLength + 2, 50);
        });
        
        // Generate buffer
        const buffer = await workbook.xlsx.writeBuffer();
        
        // Set response headers and body
        ctx.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        ctx.set('Content-Disposition', `attachment; filename="${ctx.action.resourceName}-export.xlsx"`);
        ctx.body = Buffer.from(buffer);
      } catch (error) {
        ctx.status = 500;
        ctx.body = { 
          errors: [{ message: `Erro ao exportar: ${error.message}` }]
        };
        this.app.logger.error(error);
      }
    });
  }

  async install() {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default ActionExportServer;
