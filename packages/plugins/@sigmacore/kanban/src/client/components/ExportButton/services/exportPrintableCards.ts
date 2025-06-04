import { message } from 'antd';
import { Programacao } from '../../../KanbanBlockProvider';

interface ExportPrintableCardsParams {
  cards: Programacao[];
  api: any;
  refreshPendingCount?: () => Promise<void>;
  setPrinting?: (v: boolean) => void;
}

interface PrintableCardOptions {
  showOPInterna?: boolean;
  showOPCliente?: boolean;
  showQuantidade?: boolean;
  showTipo?: boolean;
}

export async function exportPrintableCardsService({
  cards,
  api,
  refreshPendingCount,
  setPrinting,
  options = {
    showOPInterna: true,
    showOPCliente: true,
    showQuantidade: true,
    showTipo: false
  }
}: ExportPrintableCardsParams & { options?: PrintableCardOptions }) {
  if (setPrinting) setPrinting(true);
  try {
    if (!cards.length) {
      message.info('Nenhum card pendente para impressão.');
      if (setPrinting) setPrinting(false);
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      const errorMessage = 'Não foi possível abrir a janela de impressão. Verifique se os pop-ups estão permitidos.';
      console.error('❌', errorMessage);
      message.error(errorMessage);
      if (setPrinting) setPrinting(false);
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Cards para Impressão</title>
        <meta charset="utf-8">
        <style>
          @media print {
            @page { size: portrait; margin: 0.5cm; }
            body { margin: 0; padding: 0; background: white; }
            .print-page { page-break-after: always; page-break-inside: avoid; }
            .print-card { page-break-inside: avoid; }
            .print-controls, .print-header, .print-footer { display: none; }
          }
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: white; }
          .print-container { max-width: 100%; margin: 0 auto; }
          .print-page { display: grid; grid-template-columns: repeat(3, 1fr); grid-template-rows: repeat(3, 1fr); gap: 10px; margin-bottom: 30px; }
          .print-card { width: 200px; border: 1px solid #e2e8f0; border-radius: 8px; background: white; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); margin: 0 auto; }
          .print-card-image-section { padding: 8px 8px 0; }
          .print-card-image-wrapper { aspect-ratio: 1; border-radius: 6px; border: 1px solid #e2e8f0; background: #f8fafc; display: flex; align-items: center; justify-content: center; }
          .print-card-product-image { height: 100%; width: 100%; object-fit: contain; }
          .print-card-no-image { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 12px; color: #64748b; }
          .print-card-info-section { padding: 12px; }
          .print-card-details-adapted { font-size: 16px; color: #64748b; line-height: 1.2; }
          .print-card-details-adapted > p { margin: 0 0 2px; }
          .detail-value-adapted { font-weight: 500; color: #1e293b; float: right; }
          .print-card-details-adapted p.detail-ref { font-size: 16px; font-weight: 500; color: #374151; margin-bottom: 4px; }
          .print-card-details-adapted p.detail-ref .detail-value-adapted { font-weight: 600; float: none; }
          .print-card-details-adapted p:not(.detail-ref) { display: flex; margin: 3px 0; line-height: 1.3; }
          .print-controls { position: fixed; top: 20px; right: 20px; background: #1890ff; color: white; padding: 10px 20px; border-radius: 4px; cursor: pointer; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2); z-index: 1000; }
          .print-controls:hover { background: #096dd9; }
          .print-header { margin-bottom: 20px; text-align: center; }
          .print-footer { margin-top: 20px; text-align: center; font-size: 12px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="print-container">
          <div class="print-header">
            <h1>Cards para Impressão</h1>
            <p>Total: ${cards.length} cards</p>
          </div>
          <div class="print-controls" onclick="window.print()">Imprimir</div>
    `);

    const cardsPerPage = 9;
    for (let i = 0; i < cards.length; i += cardsPerPage) {
      const pageCards = cards.slice(i, i + cardsPerPage);
      printWindow.document.write(`<div class="print-page">`);
      pageCards.forEach(card => {
        printWindow.document.write(`
          <div class="print-card">
            <div class="print-card-image-section">
              <div class="print-card-image-wrapper">
                ${card.foto_piloto_url
                  ? `<img src="${card.foto_piloto_url}" alt="${card.referencia || 'Produto'}" class="print-card-product-image" onerror="this.parentNode.innerHTML='<div class=\\'print-card-no-image\\'>Sem foto</div>';">`
                  : `<div class="print-card-no-image">Sem foto</div>`
                }
              </div>
            </div>
            <div class="print-card-info-section">
              <div class="print-card-details-adapted">
                <p class="detail-ref">Ref: <span class="detail-value-adapted">${card.referencia || `#${card.id_programacao}`}</span></p>
                ${options.showOPInterna ? `<p>Op Interna: <span class="detail-value-adapted">${card.op_interna || '-'}</span></p>` : ''}
                ${options.showOPCliente && card.op_cliente ? `<p>Op Cliente: <span class="detail-value-adapted">${card.op_cliente}</span></p>` : ''}
                ${options.showQuantidade && card.qtd_op ? `<p>Qtd: <span class="detail-value-adapted">${card.qtd_op.toLocaleString()}</span></p>` : ''}
                ${options.showTipo && card.tipo_op ? `<p>Tipo: <span class="detail-value-adapted">${card.tipo_op}</span></p>` : ''}
              </div>
            </div>
          </div>
        `);
      });
      printWindow.document.write(`</div>`);
    }

    printWindow.document.write(`
          <div class="print-footer">
            Gerado em: ${new Date().toLocaleString()}
          </div>
        </div>
        <script>
          // Botões para controlar a impressão
          const printControls = document.querySelector('.print-controls');
          if (printControls) {
            const previewButton = document.createElement('button');
            previewButton.innerText = 'Visualizar';
            previewButton.style.marginRight = '10px';
            previewButton.style.background = '#1890ff';
            previewButton.style.color = 'white';
            previewButton.style.border = 'none';
            previewButton.style.padding = '10px 20px';
            previewButton.style.borderRadius = '4px';
            previewButton.style.cursor = 'pointer';
            previewButton.onclick = () => {
              document.querySelectorAll('.print-header, .print-footer').forEach(el => {
                el.style.display = el.style.display === 'none' ? 'block' : 'none';
              });
            };
            
            printControls.prepend(previewButton);
          }
          
          setTimeout(() => document.querySelector('.print-controls')?.scrollIntoView(), 100);
          // Não imprimir automaticamente para permitir visualização
          // setTimeout(() => window.print(), 1000);
          window.addEventListener('error', e => {
            if (e.target.tagName === 'IMG') {
              console.error('Erro ao carregar imagem:', e.target.src);
              e.target.parentNode.innerHTML = '<div class="print-card-no-image">Erro ao carregar imagem</div>';
            }
          }, true);
        </script>
      </body>
      </html>
    `);

    printWindow.document.close();

    try {
      const ids = cards.map(c => c.id_programacao);
      await api.request({ 
        url: 'programacoes:marcarImpresso', 
        method: 'POST', 
        data: { ids } 
      });
      message.success(`${cards.length} cards marcados como impressos!`);
      if (refreshPendingCount) {
        await refreshPendingCount();
      }
    } catch (apiError) {
      console.error('❌ Erro ao marcar cards como impressos:', apiError);
      message.warning('Os cards foram impressos, mas não puderam ser marcados como impressos no sistema.');
    }
  } catch (err: any) {
    console.error('❌ Erro geral ao exportar para impressão:', err);
    message.error(`Erro ao exportar para impressão: ${err.message || 'Erro desconhecido'}`);
  } finally {
    if (setPrinting) setPrinting(false);
  }
} 