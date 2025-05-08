import React, { useState, useEffect, useCallback } from 'react';
import FumigationsPanelView from '../components/panels/FumigationsPanelView';
import { useStock } from '../contexts/StockContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../api/supabase';
import { v4 as uuidv4 } from 'uuid';
import FumigationReportGenerator from '../utils/FumigationReportGenerator';

// Constantes para el panel de fumigaciones
export const FUMIGATION_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

export const CROP_TYPES = [
  'Soja',
  'Maíz',
  'Trigo',
  'Girasol',
  'Sorgo',
  'Cebada',
  'Alfalfa',
  'Otro'
];

export const DOSE_UNITS = [
  'cc/ha',
  'ml/ha',
  'l/ha',
  'g/ha',
  'kg/ha',
  'u/ha'
];

export const PRODUCT_UNITS = [
  'Lts',
  'ml',
  'cc',
  'Kg',
  'g',
  'u'
];

/**
 * Controlador principal para el Panel de Fumigaciones.
 * Maneja toda la lógica y estado, delegando la presentación a FumigationsPanelView.
 */
const FumigationsPanel = () => {
  const { 
    products, 
    warehouses, 
    loading: stockLoading,
    loadProducts
  } = useStock();
  
  const { currentUser, hasPermission } = useAuth();
  
  // Estados principales
  const [fumigations, setFumigations] = useState([]);
  const [filteredFumigations, setFilteredFumigations] = useState([]);
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Estados para el filtrado y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState(null);
  const [fieldFilter, setFieldFilter] = useState('');
  const [cropFilter, setCropFilter] = useState('');
  
  // Estados para el formulario de fumigación
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [currentFumigation, setCurrentFumigation] = useState({
    order_number: '',
    date: new Date(),
    establishment: '',
    applicator: '',
    crop: '',
    lot: '',
    surface: '',
    products: [],
    observations: '',
    status: FUMIGATION_STATUS.PENDING,
    image_file: null,
    image_preview: null
  });
  
  // Estado para agregar productos
  const [currentProduct, setCurrentProduct] = useState({
    product_id: '',
    warehouse_id: '',
    warehouseFilter: '', // Nuevo campo para filtrar por almacén
    dose_per_ha: '',
    dose_unit: 'cc/ha',
    total_quantity: '',
    total_unit: 'Lts'
  });
  
  // Estados para mensajes y errores
  const [formError, setFormError] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // Estados para diálogos de confirmación
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmDialogAction, setConfirmDialogAction] = useState('');
  const [fumigationToAction, setFumigationToAction] = useState(null);
  const [isPerformingAction, setIsPerformingAction] = useState(false);
  
  // Estados para visualización de PDF
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const [currentPdfUrl, setCurrentPdfUrl] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  
  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData();
  }, []);
  
  // Filtrar fumigaciones cuando cambien los filtros
  useEffect(() => {
    if (loading) return;
    filterFumigations();
  }, [fumigations, searchTerm, statusFilter, dateFilter, fieldFilter, cropFilter]);
  
  // Cargar campos y lotes
  const loadFields = async () => {
    try {
      const { data: fieldsData, error: fieldsError } = await supabase
        .from('fields')
        .select('*')
        .order('name');
      
      if (fieldsError) throw fieldsError;
      
      // Formatear para mantener compatibilidad
      const formattedFields = fieldsData.map(field => ({
        id: field.id,
        name: field.name,
        location: field.location,
        lots: field.lots || []
      }));
      
      setFields(formattedFields);
      return formattedFields;
    } catch (error) {
      console.error('Error al cargar campos:', error);
      setError('Error al cargar campos: ' + error.message);
      return [];
    }
  };
  
  // Cargar todas las fumigaciones
  const loadFumigations = async () => {
    try {
      setLoading(true);
      
      // Obtener todas las fumigaciones
      const { data: fumigationsData, error: fumigationsError } = await supabase
        .from('fumigations')
        .select('*')
        .order('date', { ascending: false });
      
      if (fumigationsError) throw fumigationsError;
      
      // Obtener productos para todas las fumigaciones
      const { data: productsData, error: productsError } = await supabase
        .from('fumigation_products')
        .select('*');
      
      if (productsError) throw productsError;
      
      // Combinar fumigaciones con sus productos
      const fumigationsWithProducts = fumigationsData.map(fumigation => {
        const fumigationProducts = productsData.filter(
          product => product.fumigation_id === fumigation.id
        );
        
        // Convertir fechas a formato compatible
        return {
          id: fumigation.id,
          order_number: fumigation.order_number,
          date: fumigation.date,
          establishment: fumigation.establishment,
          applicator: fumigation.applicator,
          crop: fumigation.crop,
          lot: fumigation.lot,
          surface: fumigation.surface,
          observations: fumigation.observations,
          status: fumigation.status,
          image_path: fumigation.image_path,
          products: fumigationProducts,
          start_datetime: fumigation.start_datetime,
          end_datetime: fumigation.end_datetime,
          created_at: fumigation.created_at,
          updated_at: fumigation.updated_at
        };
      });
      
      setFumigations(fumigationsWithProducts);
      return fumigationsWithProducts;
    } catch (error) {
      console.error('Error al cargar fumigaciones:', error);
      setError('Error al cargar fumigaciones: ' + error.message);
      return [];
    } finally {
      setLoading(false);
    }
  };
  
  // Cargar todos los datos iniciales
  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Cargar campos y fumigaciones
      await Promise.all([
        loadProducts(),
        loadFields(),
        loadFumigations()
      ]);
      
    } catch (error) {
      console.error('Error al cargar datos iniciales:', error);
      setError('Error al cargar datos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Filtrar fumigaciones según los criterios
  const filterFumigations = () => {
    if (!fumigations || fumigations.length === 0) {
      setFilteredFumigations([]);
      return;
    }
    
    let result = [...fumigations];
    
    // Filtrar por término de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(fumigation => 
        fumigation.establishment?.toLowerCase().includes(term) || 
        fumigation.applicator?.toLowerCase().includes(term) ||
        fumigation.crop?.toLowerCase().includes(term) ||
        fumigation.lot?.toLowerCase().includes(term) ||
        fumigation.order_number?.toString().includes(term)
      );
    }
    
    // Filtrar por estado
    if (statusFilter) {
      result = result.filter(fumigation => fumigation.status === statusFilter);
    }
    
    // Filtrar por fecha
    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      result = result.filter(fumigation => {
        const fumigationDate = new Date(fumigation.date);
        return (
          fumigationDate.getDate() === filterDate.getDate() &&
          fumigationDate.getMonth() === filterDate.getMonth() &&
          fumigationDate.getFullYear() === filterDate.getFullYear()
        );
      });
    }
    
    // Filtrar por campo
    if (fieldFilter) {
      result = result.filter(fumigation => 
        fumigation.establishment === fieldFilter
      );
    }
    
    // Filtrar por cultivo
    if (cropFilter) {
      result = result.filter(fumigation => fumigation.crop === cropFilter);
    }
    
    setFilteredFumigations(result);
  };
  
  // Obtener el siguiente número de orden
  const getNextOrderNumber = async () => {
    try {
      const { data, error } = await supabase
        .from('fumigations')
        .select('order_number')
        .order('order_number', { ascending: false })
        .limit(1);
      
      if (error) throw error;
      
      if (data && data.length > 0 && data[0].order_number) {
        return data[0].order_number + 1;
      }
      
      return 1; // Primer número de orden si no hay fumigaciones existentes
    } catch (error) {
      console.error('Error al obtener próximo número de orden:', error);
      return 1;
    }
  };
  
  // Abrir diálogo para añadir fumigación
  const handleOpenAddDialog = async () => {
    try {
      const nextOrderNumber = await getNextOrderNumber();
      
      setCurrentFumigation({
        order_number: nextOrderNumber,
        date: new Date(),
        establishment: '',
        applicator: '',
        crop: '',
        lot: '',
        surface: '',
        products: [],
        observations: '',
        status: FUMIGATION_STATUS.PENDING,
        image_file: null,
        image_preview: null
      });
      
      resetCurrentProduct();
      setIsEditing(false);
      setFormError('');
      setOpenDialog(true);
    } catch (error) {
      console.error('Error al abrir diálogo de añadir:', error);
      setSnackbar({
        open: true,
        message: 'Error al preparar el formulario: ' + error.message,
        severity: 'error'
      });
    }
  };
  
  // Abrir diálogo para editar fumigación
  const handleOpenEditDialog = async (fumigation) => {
    try {
      // Cargar imagen si existe
      let imagePreview = null;
      if (fumigation.image_path) {
        try {
          const { data, error } = await supabase.storage
            .from('fumigation-images')
            .getPublicUrl(fumigation.image_path);
          
          if (!error) {
            imagePreview = data.publicUrl;
          }
        } catch (err) {
          console.error('Error al obtener imagen:', err);
        }
      }
      
      setCurrentFumigation({
        ...fumigation,
        date: new Date(fumigation.date),
        image_file: null,
        image_preview: imagePreview
      });
      
      resetCurrentProduct();
      setIsEditing(true);
      setFormError('');
      setOpenDialog(true);
    } catch (error) {
      console.error('Error al abrir diálogo de editar:', error);
      setSnackbar({
        open: true,
        message: 'Error al cargar datos para editar: ' + error.message,
        severity: 'error'
      });
    }
  };
  
  // Cerrar diálogo
  const handleCloseDialog = () => {
    // Verificar si hay cambios sin guardar
    if (formSubmitting) return;
    
    setOpenDialog(false);
    resetCurrentProduct();
  };
  
  // Resetear producto actual
  const resetCurrentProduct = () => {
    setCurrentProduct({
      product_id: '',
      warehouse_id: '',
      warehouseFilter: currentProduct.warehouseFilter,
      dose_per_ha: '',
      dose_unit: 'cc/ha',
      total_quantity: '',
      total_unit: 'Lts'
    });
    };
  
  // Manejar cambios en el formulario principal
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentFumigation(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Manejar cambios en la fecha
  const handleDateChange = (date) => {
    setCurrentFumigation(prev => ({
      ...prev,
      date: date
    }));
  };
  
  // Manejar cambios en el producto actual
  const handleProductInputChange = (e) => {
    const { name, value } = e.target;
    
    // Si cambia el filtro de almacén, limpiar producto y almacén seleccionados
    if (name === 'warehouseFilter') {
      setCurrentProduct(prev => ({
        ...prev,
        warehouseFilter: value,
        product_id: '',  // Limpiar producto seleccionado
        dose_per_ha: '',
        total_quantity: ''
      }));
      return;
    }
    
    // Para otros campos, actualizar normalmente
    setCurrentProduct(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Calcular cantidad total si cambia dosis
    if (name === 'dose_per_ha' && value && currentFumigation.surface) {
      calculateTotalQuantity(null, value);
    }
  };
  
  // Calcular cantidad total en base a dosis y superficie
  const calculateTotalQuantity = (surfaceValue, doseValue) => {
    const surface = surfaceValue || currentFumigation.surface;
    const dose = doseValue || currentProduct.dose_per_ha;
    
    if (surface && dose && !isNaN(surface) && !isNaN(dose)) {
      let total = parseFloat(surface) * parseFloat(dose);
      let unit = currentProduct.dose_unit;
      
      // Convertir según la unidad
      // Si la dosis está en cc/ha y queremos el total en Lts
      if (unit === 'cc/ha') {
        total = total / 1000; // cc a litros
        unit = 'Lts';
      }
      // Si la dosis está en g/ha y queremos el total en Kg
      else if (unit === 'g/ha') {
        total = total / 1000; // g a kg
        unit = 'Kg';
      }
      
      setCurrentProduct(prev => ({
        ...prev,
        total_quantity: total.toFixed(2),
        total_unit: unit
      }));
    }
  };
  
  // Recalcular cantidades totales cuando cambia la superficie
  const handleSurfaceChange = (e) => {
    const surface = e.target.value;
    setCurrentFumigation(prev => ({
      ...prev,
      surface
    }));
    
    // Actualizar cantidad total del producto actual si hay dosis
    if (currentProduct.dose_per_ha && !isNaN(currentProduct.dose_per_ha)) {
      calculateTotalQuantity(surface);
    }
    
    // Actualizar cantidades totales de todos los productos ya agregados
    if (currentFumigation.products.length > 0) {
      const updatedProducts = currentFumigation.products.map(product => {
        const total = parseFloat(surface) * parseFloat(product.dose_per_ha);
        return {
          ...product,
          total_quantity: total.toFixed(2)
        };
      });
      
      setCurrentFumigation(prev => ({
        ...prev,
        products: updatedProducts
      }));
    }
  };
  
  // Agregar producto a la lista
  const handleAddProduct = () => {
    // Validaciones
    if (!currentProduct.product_id) {
      setFormError('Seleccione un producto');
      return;
    }
    
    if (!currentProduct.dose_per_ha || isNaN(currentProduct.dose_per_ha)) {
      setFormError('Ingrese una dosis válida');
      return;
    }
    
    if (!currentProduct.total_quantity || isNaN(currentProduct.total_quantity)) {
      setFormError('La cantidad total debe ser un número válido');
      return;
    }
    
    // Verificar disponibilidad en stock
    const selectedProduct = products.find(p => p.id === currentProduct.product_id);
    
    if (selectedProduct) {
      // Si hay un warehouse_id seleccionado, verificar stock de ese almacén
      if (currentProduct.warehouse_id) {
        const warehouseStock = selectedProduct.warehouseStock?.[currentProduct.warehouse_id] || 0;
        
        if (parseFloat(currentProduct.total_quantity) > warehouseStock) {
          setFormError(`Stock insuficiente de ${selectedProduct.name} en el almacén seleccionado. Disponible: ${warehouseStock} ${selectedProduct.unitOfMeasure}`);
          return;
        }
        
        const warehouse = warehouses.find(w => w.id === currentProduct.warehouse_id);
        
        // Agregar producto con almacén específico
        const productToAdd = {
          ...currentProduct,
          id: uuidv4(), // ID temporal para el formulario
          product_name: selectedProduct.name,
          warehouse_name: warehouse ? warehouse.name : 'No especificado'
        };
        
        setCurrentFumigation(prev => ({
          ...prev,
          products: [...prev.products, productToAdd]
        }));
        
      } else {
        // Si no hay almacén seleccionado, usar el stock total
        const totalStock = Object.values(selectedProduct.warehouseStock || {}).reduce(
          (sum, qty) => sum + qty, 0
        );
        
        if (parseFloat(currentProduct.total_quantity) > totalStock) {
          setFormError(`Stock insuficiente de ${selectedProduct.name}. Disponible total: ${totalStock} ${selectedProduct.unitOfMeasure}`);
          return;
        }
        
        // Agregar producto sin almacén específico
        const productToAdd = {
          ...currentProduct,
          id: uuidv4(), // ID temporal para el formulario
          product_name: selectedProduct.name,
          warehouse_name: 'No especificado' // Opcional, puedes eliminarlo si prefieres
        };
        
        setCurrentFumigation(prev => ({
          ...prev,
          products: [...prev.products, productToAdd]
        }));
      }
      
      // Limpiar formulario de producto
      resetCurrentProduct();
      setFormError('');
    }
  };
  
  // Eliminar producto de la lista
  const handleRemoveProduct = (productId) => {
    setCurrentFumigation(prev => ({
      ...prev,
      products: prev.products.filter(p => p.id !== productId)
    }));
  };
  
  // Manejar cambio de imagen
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Verificar tipo de archivo
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setFormError('El archivo debe ser una imagen (JPG, PNG o GIF)');
      return;
    }
    
    // Verificar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setFormError('La imagen no debe superar los 5MB');
      return;
    }
    
    // Crear vista previa
    const reader = new FileReader();
    reader.onload = () => {
      setCurrentFumigation(prev => ({
        ...prev,
        image_file: file,
        image_preview: reader.result
      }));
    };
    reader.readAsDataURL(file);
    
    setFormError('');
  };
  
  // Eliminar imagen
  const handleRemoveImage = () => {
    setCurrentFumigation(prev => ({
      ...prev,
      image_file: null,
      image_preview: null
    }));
  };
  
  // Guardar fumigación
  const handleSaveFumigation = async () => {
    try {
      // Validaciones básicas
      if (!currentFumigation.establishment) {
        setFormError('El establecimiento es obligatorio');
        return;
      }
      
      if (!currentFumigation.applicator) {
        setFormError('El aplicador es obligatorio');
        return;
      }
      
      if (!currentFumigation.crop) {
        setFormError('El cultivo es obligatorio');
        return;
      }
      
      if (!currentFumigation.lot) {
        setFormError('El lote es obligatorio');
        return;
      }
      
      if (!currentFumigation.surface || isNaN(currentFumigation.surface)) {
        setFormError('La superficie debe ser un número válido');
        return;
      }
      
      if (currentFumigation.products.length === 0) {
        setFormError('Debe agregar al menos un producto');
        return;
      }
      
      // Activar indicador de carga
      setFormSubmitting(true);
      setFormError('');
      
      // Preparar datos para guardar
      const fumigationData = {
        order_number: currentFumigation.order_number,
        date: currentFumigation.date,
        establishment: currentFumigation.establishment,
        applicator: currentFumigation.applicator,
        crop: currentFumigation.crop,
        lot: currentFumigation.lot,
        surface: parseFloat(currentFumigation.surface),
        observations: currentFumigation.observations,
        status: currentFumigation.status
      };
      
      let fumigationId;
      let imagePath = currentFumigation.image_path;
      
      // Si es edición, actualizar la fumigación existente
      if (isEditing) {
        fumigationId = currentFumigation.id;
        
        const { error: updateError } = await supabase
          .from('fumigations')
          .update({
            ...fumigationData,
            updated_at: new Date()
          })
          .eq('id', fumigationId);
        
        if (updateError) throw updateError;
        
        // Eliminar productos anteriores
        const { error: deleteProductsError } = await supabase
          .from('fumigation_products')
          .delete()
          .eq('fumigation_id', fumigationId);
        
        if (deleteProductsError) throw deleteProductsError;
      } else {
        // Si es nueva, crear la fumigación
        const { data, error: insertError } = await supabase
          .from('fumigations')
          .insert({
            ...fumigationData,
            created_at: new Date(),
            updated_at: new Date()
          })
          .select();
        
        if (insertError) throw insertError;
        
        fumigationId = data[0].id;
      }
      
      // Subir nueva imagen si existe
      if (currentFumigation.image_file) {
        // Si había una imagen anterior, eliminarla
        if (imagePath) {
          await supabase.storage
            .from('fumigation-images')
            .remove([imagePath]);
        }
        
        // Generar nombre único para la imagen
        const fileExt = currentFumigation.image_file.name.split('.').pop();
        const fileName = `fumigation_${fumigationId}_${Date.now()}.${fileExt}`;
        imagePath = `${fumigationId}/${fileName}`;
        
        // Subir la imagen
        const { error: uploadError } = await supabase.storage
          .from('fumigation-images')
          .upload(imagePath, currentFumigation.image_file);
        
        if (uploadError) throw uploadError;
        
        // Actualizar la ruta de la imagen en la fumigación
        const { error: updateImageError } = await supabase
          .from('fumigations')
          .update({ image_path: imagePath })
          .eq('id', fumigationId);
        
        if (updateImageError) throw updateImageError;
      }
      
      // Insertar productos
      const productsToInsert = currentFumigation.products.map(product => ({
        fumigation_id: fumigationId,
        product_id: product.product_id,
        warehouse_id: product.warehouse_id || null,
        dose_per_ha: parseFloat(product.dose_per_ha),
        dose_unit: product.dose_unit,
        total_quantity: parseFloat(product.total_quantity),
        total_unit: product.total_unit
      }));
      
      const { error: insertProductsError } = await supabase
        .from('fumigation_products')
        .insert(productsToInsert);
      
      if (insertProductsError) throw insertProductsError;
      
      // Si el estado es "completado", descontar del stock
      if (currentFumigation.status === FUMIGATION_STATUS.COMPLETED) {
        for (const product of currentFumigation.products) {
          await updateProductStock(product.product_id, product.warehouse_id, product.total_quantity);
        }
      }
      
      // Mostrar notificación de éxito
      setSnackbar({
        open: true,
        message: isEditing ? 'Fumigación actualizada correctamente' : 'Fumigación creada correctamente',
        severity: 'success'
      });
      
      // Cerrar diálogo y recargar datos
      setOpenDialog(false);
      await loadFumigations();
      
    } catch (error) {
      console.error('Error al guardar fumigación:', error);
      setFormError(`Error al guardar: ${error.message}`);
    } finally {
      setFormSubmitting(false);
    }
  };
  
  // Actualizar el stock de un producto
  const updateProductStock = async (productId, warehouseId, quantity) => {
    try {
      // Obtener stock actual
      const { data: stockData, error: stockError } = await supabase
        .from('warehouse_stock')
        .select('quantity')
        .eq('product_id', productId)
        .eq('warehouse_id', warehouseId)
        .single();
      
      if (stockError && stockError.code !== 'PGRST116') throw stockError;
      
      const currentStock = stockData?.quantity || 0;
      const newStock = Math.max(0, currentStock - parseFloat(quantity));
      
      if (stockData) {
        // Actualizar stock existente
        const { error: updateError } = await supabase
          .from('warehouse_stock')
          .update({ quantity: newStock })
          .eq('product_id', productId)
          .eq('warehouse_id', warehouseId);
        
        if (updateError) throw updateError;
      } else {
        // Crear registro de stock (no debería ocurrir, pero por si acaso)
        const { error: insertError } = await supabase
          .from('warehouse_stock')
          .insert({
            product_id: productId,
            warehouse_id: warehouseId,
            quantity: newStock
          });
        
        if (insertError) throw insertError;
      }
      
      // Actualizar cantidad total del producto
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('quantity')
        .eq('id', productId)
        .single();
      
      if (productError) throw productError;
      
      const totalQuantity = Math.max(0, productData.quantity - parseFloat(quantity));
      
      const { error: updateProductError } = await supabase
        .from('products')
        .update({ 
          quantity: totalQuantity,
          updated_at: new Date()
        })
        .eq('id', productId);
      
      if (updateProductError) throw updateProductError;
      
      // Registrar en historial de stock
      const { error: historyError } = await supabase
        .from('stock_history')
        .insert({
          product_id: productId,
          type: 'fumigation',
          previous_quantity: currentStock,
          new_quantity: newStock,
          warehouse_id: warehouseId,
          fumigation_id: currentFumigation.id,
          notes: `Producto utilizado en fumigación #${currentFumigation.order_number}`
        });
      
      if (historyError) throw historyError;
      
      return true;
    } catch (error) {
      console.error(`Error al actualizar stock para producto ${productId}:`, error);
      throw error;
    }
  };
  
  // Abrir diálogo de confirmación para cambiar estado
  const handleUpdateStatus = (fumigationId, newStatus) => {
    setFumigationToAction(fumigationId);
    setConfirmDialogAction(newStatus);
    
    let message = '';
    switch (newStatus) {
      case FUMIGATION_STATUS.IN_PROGRESS:
        message = 'iniciar';
        break;
      case FUMIGATION_STATUS.COMPLETED:
        message = 'completar';
        break;
      case FUMIGATION_STATUS.CANCELLED:
        message = 'cancelar';
        break;
      default:
        message = 'actualizar';
    }
    
    setConfirmDialogOpen(true);
  };
  
  // Confirmar cambio de estado
  const handleConfirmStatusUpdate = async () => {
    try {
      setIsPerformingAction(true);
      
      const fumigationId = fumigationToAction;
      const newStatus = confirmDialogAction;
      
      if (!fumigationId || !newStatus) return;
      
      // Obtener la fumigación actual
      const fumigation = fumigations.find(f => f.id === fumigationId);
      if (!fumigation) throw new Error('Fumigación no encontrada');
      
      // Verificar transición de estado válida
      const validTransitions = {
        [FUMIGATION_STATUS.PENDING]: [FUMIGATION_STATUS.IN_PROGRESS, FUMIGATION_STATUS.CANCELLED],
        [FUMIGATION_STATUS.IN_PROGRESS]: [FUMIGATION_STATUS.COMPLETED, FUMIGATION_STATUS.CANCELLED],
        [FUMIGATION_STATUS.COMPLETED]: [],
        [FUMIGATION_STATUS.CANCELLED]: []
      };
      
      if (!validTransitions[fumigation.status].includes(newStatus)) {
        throw new Error(`No se puede cambiar el estado de ${fumigation.status} a ${newStatus}`);
      }
      
      const updateData = { status: newStatus };
      
      // Si se está iniciando, registrar fecha y hora de inicio
      if (newStatus === FUMIGATION_STATUS.IN_PROGRESS) {
        updateData.start_datetime = new Date();
      }
      
      // Si se está completando, registrar fecha y hora de finalización
      if (newStatus === FUMIGATION_STATUS.COMPLETED) {
        updateData.end_datetime = new Date();
        
        // Descontar productos del stock
        for (const product of fumigation.products) {
          await updateProductStock(product.product_id, product.warehouse_id, product.total_quantity);
        }
      }
      
      // Actualizar estado de la fumigación
      const { error: updateError } = await supabase
        .from('fumigations')
        .update({
          ...updateData,
          updated_at: new Date()
        })
        .eq('id', fumigationId);
      
      if (updateError) throw updateError;
      
      // Mostrar notificación de éxito
      setSnackbar({
        open: true,
        message: `Fumigación ${
          newStatus === FUMIGATION_STATUS.IN_PROGRESS ? 'iniciada' :
          newStatus === FUMIGATION_STATUS.COMPLETED ? 'completada' :
          newStatus === FUMIGATION_STATUS.CANCELLED ? 'cancelada' : 'actualizada'
        } correctamente`,
        severity: 'success'
      });
      
      // Recargar fumigaciones
      await loadFumigations();
      
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      setSnackbar({
        open: true,
        message: `Error al actualizar estado: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setIsPerformingAction(false);
      setConfirmDialogOpen(false);
      setFumigationToAction(null);
      setConfirmDialogAction('');
    }
  };
  
  // Cancelar acción
  const handleCancelAction = () => {
    setConfirmDialogOpen(false);
    setFumigationToAction(null);
    setConfirmDialogAction('');
  };
  
  // Generar PDF de fumigación
  const handleGeneratePdf = async (fumigationId) => {
    try {
      setPdfLoading(true);
      
      // Obtener fumigación completa con productos
      const fumigation = fumigations.find(f => f.id === fumigationId);
      if (!fumigation) throw new Error('Fumigación no encontrada');
      
      // Obtener URL de la imagen si existe
      let imageUrl = null;
      if (fumigation.image_path) {
        const { data } = await supabase.storage
          .from('fumigation-images')
          .getPublicUrl(fumigation.image_path);
        
        imageUrl = data.publicUrl;
      }
      
      // Obtener nombres completos de productos
      const productsWithNames = fumigation.products.map(product => {
        const productInfo = products.find(p => p.id === product.product_id);
        const warehouseInfo = warehouses.find(w => w.id === product.warehouse_id);
        
        return {
          ...product,
          product_name: productInfo?.name || 'Producto desconocido',
          warehouse_name: warehouseInfo?.name || 'Almacén desconocido'
        };
      });
      
      // Crear objeto con todos los datos para el PDF
      const pdfData = {
        order_number: fumigation.order_number,
        date: new Date(fumigation.date).toLocaleDateString('es-ES'),
        establishment: fumigation.establishment,
        applicator: fumigation.applicator,
        crop: fumigation.crop,
        lot: fumigation.lot,
        surface: fumigation.surface,
        products: productsWithNames,
        observations: fumigation.observations,
        status: fumigation.status,
        start_datetime: fumigation.start_datetime ? new Date(fumigation.start_datetime).toLocaleString('es-ES') : '',
        end_datetime: fumigation.end_datetime ? new Date(fumigation.end_datetime).toLocaleString('es-ES') : '',
      };
      
      // Generar PDF usando nuestro generador
      const pdfBlob = await FumigationReportGenerator.generatePDF(pdfData, imageUrl);

      // Crear URL para mostrar el PDF en el diálogo
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      // Abrir diálogo con PDF
      setCurrentPdfUrl(pdfUrl);
      setPdfDialogOpen(true);
      
    } catch (error) {
      console.error('Error al generar PDF:', error);
      setSnackbar({
        open: true,
        message: `Error al generar PDF: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setPdfLoading(false);
    }
  };
  
  // Descargar PDF
  const handleDownloadPdf = async (fumigationId) => {
    try {
      setPdfLoading(true);
      
      // Obtener fumigación completa con productos
      const fumigation = fumigations.find(f => f.id === fumigationId);
      if (!fumigation) throw new Error('Fumigación no encontrada');
      
      // Obtener URL de la imagen si existe
      let imageUrl = null;
      if (fumigation.image_path) {
        const { data } = await supabase.storage
          .from('fumigation-images')
          .getPublicUrl(fumigation.image_path);
        
        imageUrl = data.publicUrl;
      }
      
      // Obtener nombres completos de productos
      const productsWithNames = fumigation.products.map(product => {
        const productInfo = products.find(p => p.id === product.product_id);
        const warehouseInfo = warehouses.find(w => w.id === product.warehouse_id);
        
        return {
          ...product,
          product_name: productInfo?.name || 'Producto desconocido',
          warehouse_name: warehouseInfo?.name || 'Almacén desconocido'
        };
      });
      
      // Crear objeto con todos los datos para el PDF
      const pdfData = {
        order_number: fumigation.order_number,
        date: new Date(fumigation.date).toLocaleDateString('es-ES'),
        establishment: fumigation.establishment,
        applicator: fumigation.applicator,
        crop: fumigation.crop,
        lot: fumigation.lot,
        surface: fumigation.surface,
        products: productsWithNames,
        observations: fumigation.observations,
        status: fumigation.status,
        start_datetime: fumigation.start_datetime ? new Date(fumigation.start_datetime).toLocaleString('es-ES') : '',
        end_datetime: fumigation.end_datetime ? new Date(fumigation.end_datetime).toLocaleString('es-ES') : '',
      };
      
      // Generar PDF usando nuestro generador
      const pdfBlob = await FumigationReportGenerator.generatePDF(pdfData, imageUrl);
      
      // Crear elemento para descargar
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Fumigacion_${fumigation.order_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setSnackbar({
        open: true,
        message: 'PDF descargado correctamente',
        severity: 'success'
      });
      
    } catch (error) {
      console.error('Error al descargar PDF:', error);
      setSnackbar({
        open: true,
        message: `Error al descargar PDF: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setPdfLoading(false);
    }
  };
  
  // Cerrar diálogo de PDF
  const handleClosePdfDialog = () => {
    setPdfDialogOpen(false);
    setCurrentPdfUrl(null);
  };
  
  // Cerrar snackbar
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };
  
  // Recargar datos
  const handleRefresh = async () => {
    try {
      await loadInitialData();
      setSnackbar({
        open: true,
        message: 'Datos actualizados correctamente',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error al recargar datos:', error);
      setSnackbar({
        open: true,
        message: `Error al recargar datos: ${error.message}`,
        severity: 'error'
      });
    }
  };
  
  // Limpiar filtros
  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setDateFilter(null);
    setFieldFilter('');
    setCropFilter('');
  };
  
  // Verificar permisos
  const canModifyFumigations = hasPermission('fumigations');
  
  // Obtener nombres de establecimientos únicos para filtro
  const getUniqueEstablishments = () => {
    if (!fumigations || fumigations.length === 0) return [];
    
    const establishments = fumigations.map(f => f.establishment);
    return [...new Set(establishments)].filter(Boolean).sort();
  };
  
  // Obtener nombres de cultivos únicos para filtro
  const getUniqueCrops = () => {
    if (!fumigations || fumigations.length === 0) return CROP_TYPES;
    
    const crops = fumigations.map(f => f.crop);
    return [...new Set(crops)].filter(Boolean).sort();
  };
  
  // Formatear estado para mostrar
  const getStatusLabel = (status) => {
    switch (status) {
      case FUMIGATION_STATUS.PENDING:
        return 'Pendiente';
      case FUMIGATION_STATUS.IN_PROGRESS:
        return 'En Proceso';
      case FUMIGATION_STATUS.COMPLETED:
        return 'Completada';
      case FUMIGATION_STATUS.CANCELLED:
        return 'Cancelada';
      default:
        return status;
    }
  };
  
  // Obtener color según estado
  const getStatusColor = (status) => {
    switch (status) {
      case FUMIGATION_STATUS.PENDING:
        return 'warning';
      case FUMIGATION_STATUS.IN_PROGRESS:
        return 'info';
      case FUMIGATION_STATUS.COMPLETED:
        return 'success';
      case FUMIGATION_STATUS.CANCELLED:
        return 'error';
      default:
        return 'default';
    }
  };
  
  return (
    <FumigationsPanelView 
      // Datos
      fumigations={filteredFumigations}
      products={products}
      warehouses={warehouses}
      fields={fields}
      
      // Estados
      loading={loading}
      error={error}
      openDialog={openDialog}
      isEditing={isEditing}
      currentFumigation={currentFumigation}
      currentProduct={currentProduct}
      formError={formError}
      snackbar={snackbar}
      searchTerm={searchTerm}
      statusFilter={statusFilter}
      dateFilter={dateFilter}
      fieldFilter={fieldFilter}
      cropFilter={cropFilter}
      confirmDialogOpen={confirmDialogOpen}
      confirmDialogAction={confirmDialogAction}
      isPerformingAction={isPerformingAction}
      formSubmitting={formSubmitting}
      pdfDialogOpen={pdfDialogOpen}
      currentPdfUrl={currentPdfUrl}
      pdfLoading={pdfLoading}
      
      // Permisos
      canModifyFumigations={canModifyFumigations}
      
      // Funciones utilitarias
      getUniqueEstablishments={getUniqueEstablishments}
      getUniqueCrops={getUniqueCrops}
      getStatusLabel={getStatusLabel}
      getStatusColor={getStatusColor}
      calculateTotalQuantity={calculateTotalQuantity}
      
      // Manejadores de eventos
      onInputChange={handleInputChange}
      onDateChange={handleDateChange}
      onSurfaceChange={handleSurfaceChange}
      onProductInputChange={handleProductInputChange}
      onAddProduct={handleAddProduct}
      onRemoveProduct={handleRemoveProduct}
      onImageChange={handleImageChange}
      onRemoveImage={handleRemoveImage}
      onOpenAddDialog={handleOpenAddDialog}
      onOpenEditDialog={handleOpenEditDialog}
      onCloseDialog={handleCloseDialog}
      onSaveFumigation={handleSaveFumigation}
      onUpdateStatus={handleUpdateStatus}
      onConfirmStatusUpdate={handleConfirmStatusUpdate}
      onCancelAction={handleCancelAction}
      onGeneratePdf={handleGeneratePdf}
      onDownloadPdf={handleDownloadPdf}
      onClosePdfDialog={handleClosePdfDialog}
      onCloseSnackbar={handleCloseSnackbar}
      onRefresh={handleRefresh}
      onClearFilters={handleClearFilters}
      onSearchChange={(e) => setSearchTerm(e.target.value)}
      onStatusChange={(e) => setStatusFilter(e.target.value)}
      onDateFilterChange={(date) => setDateFilter(date)}
      onFieldChange={(e) => setFieldFilter(e.target.value)}
      onCropChange={(e) => setCropFilter(e.target.value)}
      
      // Constantes
      fumigationStatus={FUMIGATION_STATUS}
      cropTypes={CROP_TYPES}
      doseUnits={DOSE_UNITS}
      productUnits={PRODUCT_UNITS}
    />
  );
};

export default FumigationsPanel;