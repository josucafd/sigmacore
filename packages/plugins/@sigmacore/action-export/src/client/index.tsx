import { Plugin, SchemaComponentOptions } from '@nocobase/client';
import React from 'react';
import { ActionExport } from './ActionExport';

export { ActionExport } from './ActionExport';

export class ActionExportClient extends Plugin {
  async load() {
    // Register our component so it can be used in NocoBase schemas
    this.app.use(SchemaComponentOptions, {
      components: {
        ActionExport,
      },
    });
  }
}

export default ActionExportClient; 