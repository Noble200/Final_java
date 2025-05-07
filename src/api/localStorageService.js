import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';

const localStorageService = {
  initializeStorage: async () => {
    try {
      // Verificar si los buckets existen
      const { data: buckets, error } = await supabase.storage.listBuckets();
      
      if (error) throw error;
      
      // Crear buckets necesarios si no existen
      const requiredBuckets = [
        'fumigation-images',
        'reports',
        'temp'
      ];
      
      for (const bucketName of requiredBuckets) {
        if (!buckets.find(b => b.name === bucketName)) {
          const { error: createError } = await supabase.storage.createBucket(bucketName, {
            public: false
          });
          
          if (createError) throw createError;
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error al inicializar almacenamiento:', error);
      return false;
    }
  },
  
  saveFumigationImage: async (imageFile, fumigationId) => {
    try {
      // Generar un nombre único para el archivo
      const fileExtension = imageFile.name?.split('.').pop() || 'jpg';
      const fileName = `fumigation_${fumigationId}_${uuidv4()}.${fileExtension}`;
      const filePath = `${fumigationId}/${fileName}`;
      
      // Subir la imagen a Supabase Storage
      const { error } = await supabase.storage
        .from('fumigation-images')
        .upload(filePath, imageFile);
      
      if (error) throw error;
      
      return filePath;
    } catch (error) {
      console.error('Error al guardar imagen de fumigación:', error);
      throw error;
    }
  },
  
  getFumigationImage: async (relativePath) => {
    try {
      if (!relativePath) {
        throw new Error('Ruta de imagen no especificada');
      }
      
      // Obtener la URL pública de la imagen
      const { data, error } = await supabase.storage
        .from('fumigation-images')
        .download(relativePath);
      
      if (error) throw error;
      
      return data; // Blob de la imagen
    } catch (error) {
      console.error('Error al leer imagen de fumigación:', error);
      throw error;
    }
  },
  
  deleteFumigationImage: async (relativePath) => {
    try {
      if (!relativePath) return false;
      
      // Eliminar la imagen de Supabase Storage
      const { error } = await supabase.storage
        .from('fumigation-images')
        .remove([relativePath]);
      
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error al eliminar imagen de fumigación:', error);
      return false;
    }
  },
  
  saveReport: async (pdfBlob, reportName) => {
    try {
      // Generar un nombre para el archivo
      const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
      const sanitizedName = reportName.replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `${sanitizedName}_${dateStr}.pdf`;
      
      // Subir el PDF a Supabase Storage
      const { data, error } = await supabase.storage
        .from('reports')
        .upload(fileName, pdfBlob);
      
      if (error) throw error;
      
      // Obtener la URL del archivo
      const { data: urlData } = await supabase.storage
        .from('reports')
        .getPublicUrl(fileName);
      
      return urlData.publicUrl;
    } catch (error) {
      console.error('Error al guardar reporte:', error);
      throw error;
    }
  },
  
  exportFile: async (fileBlob, defaultName) => {
    try {
      // En un entorno web, descargar el archivo directamente
      const url = URL.createObjectURL(fileBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = defaultName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      return defaultName;
    } catch (error) {
      console.error('Error al exportar archivo:', error);
      throw error;
    }
  },
  
  cleanTempFiles: async () => {
    try {
      // Listar todos los archivos en la carpeta temp
      const { data, error } = await supabase.storage
        .from('temp')
        .list();
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        // Eliminar todos los archivos encontrados
        const filesToDelete = data.map(file => file.name);
        const { error: deleteError } = await supabase.storage
          .from('temp')
          .remove(filesToDelete);
        
        if (deleteError) throw deleteError;
      }
      
      return true;
    } catch (error) {
      console.error('Error al limpiar archivos temporales:', error);
      return false;
    }
  }
};

export default localStorageService;