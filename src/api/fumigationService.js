import { 
    collection, 
    doc, 
    getDoc, 
    getDocs, 
    setDoc, 
    updateDoc, 
    query, 
    where, 
    orderBy, 
    serverTimestamp 
  } from 'firebase/firestore';
  import { db } from './firebase';
  import localStorageService from './localStorageService';
  import stockService from './stockService';
  
  /**
   * Servicio especializado para gestionar las fumigaciones
   * Extiende la funcionalidad del stockService para manejar imágenes locales
   */
  const fumigationService = {
    /**
     * Obtiene todas las fumigaciones
     * @param {Object} options - Opciones de filtrado
     * @returns {Promise<Array>} Array de fumigaciones
     */
    getAllFumigations: async (options = {}) => {
      try {
        const { status, fromDate, toDate, fieldId, cropType } = options;
        
        let fumigationsQuery = collection(db, 'fumigations');
        const filters = [];
        
        // Aplicar filtros
        if (status) {
          filters.push(where('status', '==', status));
        }
        
        if (fieldId) {
          filters.push(where('fieldId', '==', fieldId));
        }
        
        if (cropType) {
          filters.push(where('crop', '==', cropType));
        }
        
        // Aplicar filtros si existen
        if (filters.length > 0) {
          fumigationsQuery = query(fumigationsQuery, ...filters, orderBy('createdAt', 'desc'));
        } else {
          fumigationsQuery = query(fumigationsQuery, orderBy('createdAt', 'desc'));
        }
        
        const snapshot = await getDocs(fumigationsQuery);
        let fumigations = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Filtrar por fechas si se proporcionan
        if (fromDate || toDate) {
          fumigations = fumigations.filter(fumigation => {
            const fumigationDate = fumigation.date ? new Date(fumigation.date.seconds * 1000) : null;
            
            if (!fumigationDate) return true;
            
            if (fromDate && toDate) {
              return fumigationDate >= fromDate && fumigationDate <= toDate;
            } else if (fromDate) {
              return fumigationDate >= fromDate;
            } else if (toDate) {
              return fumigationDate <= toDate;
            }
            
            return true;
          });
        }
        
        return fumigations;
      } catch (error) {
        console.error('Error al obtener fumigaciones:', error);
        throw error;
      }
    },
    
    /**
     * Obtiene una fumigación por su ID
     * @param {string} fumigationId - ID de la fumigación
     * @returns {Promise<Object|null>} Datos de la fumigación o null si no existe
     */
    getFumigationById: async (fumigationId) => {
      try {
        const fumigationRef = doc(db, 'fumigations', fumigationId);
        const fumigationSnap = await getDoc(fumigationRef);
        
        if (fumigationSnap.exists()) {
          return {
            id: fumigationSnap.id,
            ...fumigationSnap.data()
          };
        }
        return null;
      } catch (error) {
        console.error(`Error al obtener fumigación ${fumigationId}:`, error);
        throw error;
      }
    },
    
    /**
     * Crea una nueva fumigación
     * @param {Object} fumigationData - Datos de la fumigación
     * @param {File} imageFile - Archivo de imagen (opcional)
     * @returns {Promise<string>} ID de la fumigación creada
     */
    createFumigation: async (fumigationData, imageFile = null) => {
      try {
        // Usamos el método del stockService para crear la fumigación
        const fumigationId = await stockService.createFumigation(fumigationData);
        
        // Si se proporcionó una imagen, la guardamos localmente
        if (imageFile) {
          try {
            // Guardar la imagen en el sistema de archivos local
            const imagePath = await localStorageService.saveFumigationImage(imageFile, fumigationId);
            
            // Actualizar la fumigación con la ruta de la imagen
            const fumigationRef = doc(db, 'fumigations', fumigationId);
            await updateDoc(fumigationRef, {
              imagePath: imagePath,
              updatedAt: serverTimestamp()
            });
          } catch (imageError) {
            console.error('Error al guardar imagen de fumigación:', imageError);
            // No lanzamos error para que la fumigación se cree aunque falle la imagen
          }
        }
        
        return fumigationId;
      } catch (error) {
        console.error('Error al crear fumigación:', error);
        throw error;
      }
    },
    
    /**
     * Actualiza una fumigación existente
     * @param {string} fumigationId - ID de la fumigación
     * @param {Object} fumigationData - Datos actualizados
     * @param {File} imageFile - Archivo de imagen (opcional)
     * @returns {Promise<void>}
     */
    updateFumigation: async (fumigationId, fumigationData, imageFile = null) => {
      try {
        const fumigationRef = doc(db, 'fumigations', fumigationId);
        const fumigationSnap = await getDoc(fumigationRef);
        
        if (!fumigationSnap.exists()) {
          throw new Error(`La fumigación ${fumigationId} no existe`);
        }
        
        // Actualizar la fumigación con los nuevos datos
        await updateDoc(fumigationRef, {
          ...fumigationData,
          updatedAt: serverTimestamp()
        });
        
        // Si se proporcionó una nueva imagen
        if (imageFile) {
          try {
            // Obtener fumigación actualizada para verificar si ya tenía una imagen
            const updatedFumigation = await fumigationService.getFumigationById(fumigationId);
            
            // Si ya había una imagen, eliminarla
            if (updatedFumigation.imagePath) {
              await localStorageService.deleteFumigationImage(updatedFumigation.imagePath);
            }
            
            // Guardar la nueva imagen
            const imagePath = await localStorageService.saveFumigationImage(imageFile, fumigationId);
            
            // Actualizar la fumigación con la nueva ruta de imagen
            await updateDoc(fumigationRef, {
              imagePath: imagePath,
              updatedAt: serverTimestamp()
            });
          } catch (imageError) {
            console.error('Error al actualizar imagen de fumigación:', imageError);
            // No lanzamos error para que la fumigación se actualice aunque falle la imagen
          }
        }
      } catch (error) {
        console.error(`Error al actualizar fumigación ${fumigationId}:`, error);
        throw error;
      }
    },
    
    /**
     * Actualiza el estado de una fumigación
     * @param {string} fumigationId - ID de la fumigación
     * @param {string} newStatus - Nuevo estado ('pending', 'completed', 'cancelled')
     * @param {Object} completionData - Datos adicionales para completar la fumigación
     * @param {File} imageFile - Archivo de imagen (opcional)
     * @returns {Promise<void>}
     */
    updateFumigationStatus: async (fumigationId, newStatus, completionData = {}, imageFile = null) => {
      try {
        // Si hay una imagen y se está completando la fumigación, primero la guardamos
        if (imageFile && newStatus === 'completed') {
          try {
            // Obtener fumigación para verificar si ya tenía una imagen
            const fumigation = await fumigationService.getFumigationById(fumigationId);
            
            // Si ya había una imagen, eliminarla
            if (fumigation.imagePath) {
              await localStorageService.deleteFumigationImage(fumigation.imagePath);
            }
            
            // Guardar la nueva imagen
            const imagePath = await localStorageService.saveFumigationImage(imageFile, fumigationId);
            
            // Añadir la ruta de la imagen a los datos de finalización
            completionData.imagePath = imagePath;
          } catch (imageError) {
            console.error('Error al guardar imagen de fumigación:', imageError);
            // No lanzamos error para que la actualización de estado continúe
          }
        }
        
        // Actualizar el estado usando el método del stockService
        await stockService.updateFumigationStatus(fumigationId, newStatus, completionData);
      } catch (error) {
        console.error(`Error al actualizar estado de fumigación ${fumigationId}:`, error);
        throw error;
      }
    },
    
    /**
     * Obtiene la imagen de una fumigación
     * @param {string} fumigationId - ID de la fumigación
     * @returns {Promise<Blob|null>} Imagen como Blob o null si no existe
     */
    getFumigationImage: async (fumigationId) => {
      try {
        // Obtener la fumigación para conseguir la ruta de la imagen
        const fumigation = await fumigationService.getFumigationById(fumigationId);
        
        if (!fumigation || !fumigation.imagePath) {
          return null;
        }
        
        // Obtener la imagen desde el almacenamiento local
        return await localStorageService.getFumigationImage(fumigation.imagePath);
      } catch (error) {
        console.error(`Error al obtener imagen de fumigación ${fumigationId}:`, error);
        return null;
      }
    },
    
    /**
     * Elimina una fumigación
     * @param {string} fumigationId - ID de la fumigación
     * @returns {Promise<boolean>} true si la eliminación fue exitosa
     */
    deleteFumigation: async (fumigationId) => {
      try {
        // Obtener la fumigación para verificar si tiene una imagen
        const fumigation = await fumigationService.getFumigationById(fumigationId);
        
        if (!fumigation) {
          throw new Error(`La fumigación ${fumigationId} no existe`);
        }
        
        // Si tiene una imagen, eliminarla primero
        if (fumigation.imagePath) {
          await localStorageService.deleteFumigationImage(fumigation.imagePath);
        }
        
        // Eliminar la fumigación de la base de datos
        const fumigationRef = doc(db, 'fumigations', fumigationId);
        await deleteDoc(fumigationRef);
        
        return true;
      } catch (error) {
        console.error(`Error al eliminar fumigación ${fumigationId}:`, error);
        throw error;
      }
    },
    
    /**
     * Genera un PDF con el reporte de una fumigación
     * @param {string} fumigationId - ID de la fumigación
     * @returns {Promise<Blob>} PDF como Blob
     */
    generateFumigationReport: async (fumigationId) => {
      try {
        // Obtener todos los datos necesarios
        const fumigation = await fumigationService.getFumigationById(fumigationId);
        
        if (!fumigation) {
          throw new Error(`La fumigación ${fumigationId} no existe`);
        }
        
        // Información adicional necesaria para el reporte
        let imageBlob = null;
        if (fumigation.imagePath) {
          imageBlob = await localStorageService.getFumigationImage(fumigation.imagePath);
        }
        
        // Obtener nombres de productos para el reporte
        const products = await stockService.getAllProducts();
        const productsMap = products.reduce((map, product) => {
          map[product.id] = product.name;
          return map;
        }, {});
        
        // Obtener nombres de almacenes para el reporte
        const warehouses = await stockService.getAllWarehouses();
        const warehousesMap = warehouses.reduce((map, warehouse) => {
          map[warehouse.id] = warehouse.name;
          return map;
        }, {});
        
        // Crear contexto para la generación del PDF
        const context = {
          fumigation: {
            ...fumigation,
            date: fumigation.date ? new Date(fumigation.date.seconds * 1000).toLocaleDateString('es-ES') : 'Sin fecha',
            scheduledDate: fumigation.scheduledDate ? new Date(fumigation.scheduledDate.seconds * 1000).toLocaleDateString('es-ES') : 'Sin fecha',
            completionDate: fumigation.completionDate ? new Date(fumigation.completionDate.seconds * 1000).toLocaleDateString('es-ES') : 'Sin fecha',
            products: fumigation.products.map(product => ({
              ...product,
              name: productsMap[product.productId] || 'Producto desconocido',
              warehouseName: warehousesMap[product.warehouseId] || 'Almacén desconocido'
            }))
          },
          imageBlob,
          dateGenerated: new Date().toLocaleDateString('es-ES')
        };
        
        // Generar el PDF usando la función interna
        const pdfBlob = await generatePDF(context);
        
        return pdfBlob;
      } catch (error) {
        console.error(`Error al generar reporte de fumigación ${fumigationId}:`, error);
        throw error;
      }
    },
    
    /**
     * Exporta un reporte de fumigación a PDF
     * @param {string} fumigationId - ID de la fumigación
     * @returns {Promise<string>} Ruta donde se guardó el archivo
     */
    exportFumigationReport: async (fumigationId) => {
      try {
        // Generar el PDF
        const pdfBlob = await fumigationService.generateFumigationReport(fumigationId);
        
        // Obtener información de la fumigación para el nombre del archivo
        const fumigation = await fumigationService.getFumigationById(fumigationId);
        const fileName = `Fumigacion_${fumigation.orderNumber || fumigationId}.pdf`;
        
        // Exportar el archivo
        const filePath = await localStorageService.exportFile(pdfBlob, fileName);
        
        return filePath;
      } catch (error) {
        console.error(`Error al exportar reporte de fumigación ${fumigationId}:`, error);
        throw error;
      }
    }
  };
  
  /**
   * Función interna para generar un PDF con los datos de la fumigación
   * @param {Object} context - Datos para el PDF
   * @returns {Promise<Blob>} PDF como Blob
   */
  async function generatePDF(context) {
    try {
      // Aquí utilizaríamos una librería para generar el PDF
      // Como pdfmake, jsPDF o similar
      // Por ahora, simulamos la generación
      
      // Simulación - en la implementación real, esto generaría el PDF con la librería elegida
      return new Blob(['PDF simulado'], { type: 'application/pdf' });
      
      // Ejemplo de implementación con jsPDF:
      /*
      const { jsPDF } = require('jspdf');
      const doc = new jsPDF();
      
      // Configurar documento
      doc.setFont('helvetica');
      doc.setFontSize(18);
      
      // Título
      doc.text('Reporte de Fumigación', 105, 20, { align: 'center' });
      
      // Información básica
      doc.setFontSize(12);
      doc.text(`Orden: ${context.fumigation.orderNumber}`, 20, 40);
      doc.text(`Fecha: ${context.fumigation.date}`, 20, 50);
      doc.text(`Estado: ${context.fumigation.status}`, 20, 60);
      doc.text(`Establecimiento: ${context.fumigation.establishment}`, 20, 70);
      doc.text(`Aplicador: ${context.fumigation.applicator}`, 20, 80);
      
      // Más información...
      
      // Si hay imagen, agregarla
      if (context.imageBlob) {
        const imageUrl = URL.createObjectURL(context.imageBlob);
        doc.addImage(imageUrl, 'JPEG', 20, 100, 170, 100);
        URL.revokeObjectURL(imageUrl);
      }
      
      // Devolver como Blob
      const pdfBlob = doc.output('blob');
      return pdfBlob;
      */
    } catch (error) {
      console.error('Error al generar PDF:', error);
      throw error;
    }
  }
  
  export default fumigationService;