import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

/**
 * Clase para generar reportes PDF de fumigaciones
 */
class FumigationReportGenerator {
  /**
   * Genera un PDF para una orden de fumigación
   * @param {Object} fumigationData - Datos de la fumigación
   * @param {string} imageUrl - URL de la imagen (opcional)
   * @returns {Promise<Blob>} PDF como Blob
   */
  static async generatePDF(fumigationData, imageUrl = null) {
    try {
      // Crear documento
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Configurar fuentes
      doc.setFont('helvetica');
      
      // Añadir cabecera
      this.addHeader(doc, fumigationData);
      
      // Añadir información general
      this.addGeneralInfo(doc, fumigationData);
      
      // Añadir tabla de productos
      this.addProductsTable(doc, fumigationData.products);
      
      // Añadir fechas y observaciones
      this.addDatesAndObservations(doc, fumigationData);
      
      // Añadir imagen si existe
      if (imageUrl) {
        await this.addImage(doc, imageUrl);
      }
      
      // Devolver como Blob
      const pdfBlob = doc.output('blob');
      return pdfBlob;
      
    } catch (error) {
      console.error('Error al generar PDF:', error);
      throw error;
    }
  }
  
  /**
   * Añade la cabecera al documento
   * @param {jsPDF} doc - Documento PDF
   * @param {Object} data - Datos de la fumigación
   */
  static addHeader(doc, data) {
    // Título principal
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('ORDEN DE APLICACIÓN', 105, 15, { align: 'center' });
    
    // Número de orden
    doc.text(`N° ${data.order_number}`, 105, 22, { align: 'center' });
    
    // Tabla de información básica
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    // Crear tabla de información básica
    const headers = [['FECHA:', 'ESTABLECIMIENTO:', 'APLICADOR:']];
    const body = [[data.date, data.establishment, data.applicator]];
    
    doc.autoTable({
      startY: 30,
      head: headers,
      body: body,
      theme: 'grid',
      styles: {
        cellPadding: 3,
        fontSize: 10,
        halign: 'left',
        valign: 'middle',
        lineWidth: 0.1
      },
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 80 },
        2: { cellWidth: 70 }
      }
    });
  }
  
  /**
   * Añade información general al documento
   * @param {jsPDF} doc - Documento PDF
   * @param {Object} data - Datos de la fumigación
   */
  static addGeneralInfo(doc, data) {
    // Tabla de cultivo y lote
    const headers = [['CULTIVO', 'LOTE', 'SUPERFICIE', 'PRODUCTO', 'DOSIS / HA', 'TOTAL PRODUCTO']];
    
    // Crear filas para cada producto
    const rows = data.products.map(product => [
      data.crop,
      data.lot,
      `${data.surface} ha`,
      product.product_name,
      `${product.dose_per_ha} ${product.dose_unit}`,
      `${product.total_quantity} ${product.total_unit}`
    ]);
    
    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 10,
      head: headers,
      body: rows,
      theme: 'grid',
      styles: {
        cellPadding: 3,
        fontSize: 10,
        halign: 'left',
        valign: 'middle',
        lineWidth: 0.1
      },
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontStyle: 'bold'
      }
    });
  }
  
  /**
   * Añade la tabla de productos al documento
   * @param {jsPDF} doc - Documento PDF
   * @param {Array} products - Lista de productos
   */
  static addProductsTable(doc, products) {
    // Ya añadida en la información general
  }
  
  /**
   * Añade fechas y observaciones al documento
   * @param {jsPDF} doc - Documento PDF
   * @param {Object} data - Datos de la fumigación
   */
  static addDatesAndObservations(doc, data) {
    // Tabla de fechas de inicio y fin
    const headers = [['FECHA Y HORA DE INICIO', 'FECHA Y HORA DE FIN']];
    const body = [[
      data.start_datetime || '',
      data.end_datetime || ''
    ]];
    
    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 10,
      head: headers,
      body: body,
      theme: 'grid',
      styles: {
        cellPadding: 3,
        fontSize: 10,
        halign: 'center',
        valign: 'middle',
        lineWidth: 0.1
      },
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontStyle: 'bold'
      }
    });
    
    // Observaciones
    if (data.observations) {
      const obsHeaders = [['OBSERVACIONES:']];
      const obsBody = [[data.observations]];
      
      doc.autoTable({
        startY: doc.lastAutoTable.finalY + 5,
        head: obsHeaders,
        body: obsBody,
        theme: 'grid',
        styles: {
          cellPadding: 3,
          fontSize: 10,
          halign: 'left',
          valign: 'top',
          lineWidth: 0.1
        },
        headStyles: {
          fillColor: [240, 240, 240],
          textColor: [0, 0, 0],
          fontStyle: 'bold'
        }
      });
    }
  }
  
  /**
   * Añade una imagen al documento
   * @param {jsPDF} doc - Documento PDF
   * @param {string} imageUrl - URL de la imagen
   * @returns {Promise<void>}
   */
  static async addImage(doc, imageUrl) {
    return new Promise((resolve, reject) => {
      try {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        
        img.onload = () => {
          try {
            const startY = doc.lastAutoTable.finalY + 10;
            
            // Calcular dimensiones manteniendo proporción
            const pageWidth = doc.internal.pageSize.getWidth() - 20;
            const pageHeight = doc.internal.pageSize.getHeight() - startY - 10;
            
            let imgWidth = pageWidth;
            let imgHeight = (img.height * imgWidth) / img.width;
            
            // Si la altura es mayor al espacio disponible, ajustar
            if (imgHeight > pageHeight) {
              imgHeight = pageHeight;
              imgWidth = (img.width * imgHeight) / img.height;
            }
            
            // Centrar imagen
            const imgX = (doc.internal.pageSize.getWidth() - imgWidth) / 2;
            
            // Añadir la imagen
            doc.addImage(img, 'JPEG', imgX, startY, imgWidth, imgHeight);
            
            resolve();
          } catch (err) {
            reject(err);
          }
        };
        
        img.onerror = (err) => {
          reject(new Error('Error al cargar la imagen'));
        };
        
        img.src = imageUrl;
        
      } catch (error) {
        reject(error);
      }
    });
  }
}

export default FumigationReportGenerator;