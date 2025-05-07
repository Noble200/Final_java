import React, { useState, useEffect } from 'react';
import ProductsPanelView from '../components/panels/ProductsPanelView';
import { useStock } from '../contexts/StockContext';
import { useAuth } from '../contexts/AuthContext';

// Categorías de productos
export const PRODUCT_CATEGORIES = [
  'Insumo',
  'Herramienta',
  'Semilla',
  'Fertilizante',
  'Insecticida',
  'Fungicida',
  'Herbicida',
  'Otro'
];

// Unidades de medida
export const UNITS_OF_MEASURE = [
  'kg',
  'g',
  'l',
  'ml',
  'unidad',
  'caja',
  'paquete',
  'bulto',
  'saco',
  'bolsa'
];

/**
 * Controlador principal para el Panel de Productos.
 * Maneja toda la lógica y estado, delegando la presentación a ProductsPanelView.
 */
const ProductsPanel = () => {
  const { 
    products, 
    warehouses, 
    loading, 
    error, 
    loadProducts, 
    addProduct, 
    updateProduct,
    deleteProduct,
  } = useStock();
  
  const { hasPermission } = useAuth();
  
  // Estados para el filtrado y búsqueda
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);
  
  // Estados para el formulario de producto
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDeleteDialogOpen, setConfirmDeleteDialogOpen] = useState(false);
  const [confirmCloseDialogOpen, setConfirmCloseDialogOpen] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProduct, setCurrentProduct] = useState({
    name: '',
    category: '',
    quantity: 0,
    unitOfMeasure: 'unidad',
    minStock: 0,
    warehouseStock: {},
    expiryDate: null,
    lotNumber: '',
    notes: '',
    selectedWarehouse: '',
    addQuantity: ''
  });
  
  // Estados para mensajes y errores
  const [formError, setFormError] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // Estado para seguimiento de cambios
  const [productChanged, setProductChanged] = useState(false);
  const [dialogAction, setDialogAction] = useState('');

  // Calcular estadísticas
  const calculateStats = () => {
    if (!products || products.length === 0) return null;
    
    const totalProducts = products.length;
    const lowStockCount = products.filter(product => {
      const totalStock = calculateTotalStock(product);
      return totalStock <= (product.minStock || 0) && product.minStock > 0;
    }).length;
    
    const expiringCount = products.filter(product => {
      if (!product.expiryDate) return false;
      const expiryDate = product.expiryDate.seconds ? 
        new Date(product.expiryDate.seconds * 1000) : 
        product.expiryDate;
      const today = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(today.getDate() + 30);
      return expiryDate > today && expiryDate < thirtyDaysFromNow;
    }).length;
    
    const warehouseCount = warehouses.length;
    
    return {
      totalProducts,
      lowStockCount,
      expiringCount,
      warehouseCount
    };
  };

  // Cargar productos con los filtros aplicados
  useEffect(() => {
    if (loading) return;
    
    filterProducts();
  }, [products, searchTerm, categoryFilter, showLowStock, loading]);

  // Cargar datos iniciales
  useEffect(() => {
    loadProducts().catch(err => {
      console.error("Error al cargar datos iniciales:", err);
      setSnackbar({
        open: true,
        message: "Error al cargar datos: " + err.message,
        severity: 'error'
      });
    });
  }, [loadProducts]);

  // Función para aplicar filtros a los productos
  const filterProducts = () => {
    if (!products || products.length === 0) {
      setFilteredProducts([]);
      return;
    }
    
    let result = [...products];
    
    // Filtrar por término de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(product => 
        product.name?.toLowerCase().includes(term) || 
        product.id?.toLowerCase().includes(term) ||
        (product.lotNumber && product.lotNumber.toLowerCase().includes(term))
      );
    }
    
    // Filtrar por categoría
    if (categoryFilter) {
      result = result.filter(product => product.category === categoryFilter);
    }

    // Filtrar por almacén
    if (warehouseFilter) {
      result = result.filter(product => {
        // Verificar si tiene stock en este almacén
        const warehouseStock = product.warehouseStock || {};
        
        // Depuración para entender la estructura de datos
        console.log(`Producto ${product.name}:`, product.warehouseStock);
        
        // Comprobar explícitamente si el ID de almacén existe como clave
        const hasStock = warehouseStock.hasOwnProperty(warehouseFilter);
        const stockAmount = warehouseStock[warehouseFilter] || 0;
        
        // Un producto debe mostrase si tiene entrada para este almacén Y cantidad > 0
        return hasStock && stockAmount > 0;
      });
    }
    
    // Filtrar por stock bajo
    if (showLowStock) {
      result = result.filter(product => {
        const totalStock = calculateTotalStock(product);
        return totalStock <= (product.minStock || 0);
      });
    }
    
    setFilteredProducts(result);
  };

  // Manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentProduct(prev => ({
      ...prev,
      [name]: (name === 'quantity' || name === 'minStock') ? 
        (value === '' ? '' : Number(value)) : 
        value
    }));
    
    // Solo marcar como cambiado si realmente hubo un cambio de valor
    if (!productChanged) {
      setProductChanged(true);
    }
  };

  // Manejar cambio de fecha de vencimiento
  const handleExpiryDateChange = (date) => {
    setCurrentProduct(prev => ({
      ...prev,
      expiryDate: date ? date.toDate() : null
    }));
    setProductChanged(true);
  };

  // Manejar cambio de almacén para stock
  const handleWarehouseStockChange = (warehouseId, value) => {
    const numValue = value === '' ? '' : Number(value);
    
    setCurrentProduct(prev => ({
      ...prev,
      warehouseStock: {
        ...prev.warehouseStock,
        [warehouseId]: numValue
      }
    }));
    setProductChanged(true);
  };

  // Abrir diálogo para añadir producto
  const handleOpenAddDialog = () => {
    setCurrentProduct({
      name: '',
      category: '',
      quantity: 0,
      unitOfMeasure: 'unidad',
      minStock: 0,
      warehouseStock: {},
      expiryDate: null,
      lotNumber: '',
      notes: ''
    });
    setIsEditing(false);
    setFormError('');
    setProductChanged(false);
    setDialogAction('add');
    setOpenDialog(true);
  };

  // Abrir diálogo para editar producto
  const handleOpenEditDialog = (product) => {
    // Convertir la fecha de a objeto Date
    let expiryDate = null;
    if (product.expiryDate && product.expiryDate.seconds) {
      expiryDate = new Date(product.expiryDate.seconds * 1000);
    } else if (product.expiryDate instanceof Date) {
      expiryDate = product.expiryDate;
    }
    
    setCurrentProduct({
      ...product,
      expiryDate
    });
    
    setIsEditing(true);
    setFormError('');
    setProductChanged(false);
    setDialogAction('edit');
    setOpenDialog(true);
  };

  // Cerrar diálogo
  const handleCloseDialog = () => {
    if (productChanged && dialogAction !== '') {
      setConfirmCloseDialogOpen(true);
    } else {
      setOpenDialog(false);
      setDialogAction('');
    }
  };

  // Función para confirmar cierre
  const confirmClose = () => {
    setOpenDialog(false);
    setDialogAction('');
    setProductChanged(false);
    setConfirmCloseDialogOpen(false);
  };
  

  // Función para cancelar cierre
  const cancelClose = () => {
    setConfirmCloseDialogOpen(false);
  };

  // Calcular stock total del producto
  const calculateTotalStock = (product) => {
    if (!product || !product.warehouseStock) return 0;
    
    return Object.values(product.warehouseStock).reduce(
      (sum, stock) => sum + (isNaN(stock) ? 0 : Number(stock)), 
      0
    );
  };

  // Guardar producto (añadir o actualizar)
  const handleSaveProduct = async () => {
    try {
      // Validaciones básicas
      if (!currentProduct.name) {
        setFormError('El nombre del producto es obligatorio');
        return;
      }
      
      // Para productos nuevos, asegurarnos de tener una categoría y un almacén
      if (!isEditing) {
        if (!currentProduct.category) {
          setFormError('La categoría es obligatoria');
          return;
        }
        
        if (!currentProduct.selectedWarehouse) {
          setFormError('Debes seleccionar un almacén destino');
          return;
        }
      }
      
      // Validar que los valores numéricos sean números válidos
      if (
        (currentProduct.minStock !== '' && isNaN(currentProduct.minStock)) ||
        (currentProduct.quantity !== '' && isNaN(currentProduct.quantity)) ||
        Object.values(currentProduct.warehouseStock || {}).some(value => 
          value !== '' && isNaN(value)
        )
      ) {
        setFormError('Los valores numéricos deben ser números válidos');
        return;
      }
      
      // Activar indicador de carga
      setFormSubmitting(true);
      setFormError('');
      
      // Preparar datos para guardar
      const productData = { ...currentProduct };
      
      // Esto es crítico para que el stock bajo se detecte correctamente
      if (isEditing) {
        // En edición, quantity debe ser la suma del stock en todos los almacenes
        const totalStockInWarehouses = Object.values(productData.warehouseStock).reduce(
          (sum, stock) => sum + (isNaN(stock) ? 0 : Number(stock)), 
          0
        );
        productData.quantity = totalStockInWarehouses;
        productData.quantity = calculateTotalStock(productData);

        // Registra para depuración
        console.log('Stock actualizado:', {
          stockPorAlmacen: productData.warehouseStock,
          cantidadTotal: productData.quantity,
          stockMinimo: productData.minStock
        });
      }
      
      // Convertir valores vacíos a 0
      if (productData.minStock === '') productData.minStock = 0;
      if (productData.quantity === '') productData.quantity = 0;
      
      // Si es un producto nuevo, asignar la cantidad total al almacén seleccionado
      if (!isEditing) {
        productData.warehouseStock = {
          [productData.selectedWarehouse]: productData.quantity
        };
        
        // Eliminar la propiedad selectedWarehouse antes de guardar
        delete productData.selectedWarehouse;
      } else {
        // Para edición, mantener la lógica actual
        Object.keys(productData.warehouseStock || {}).forEach(key => {
          if (productData.warehouseStock[key] === '') {
            productData.warehouseStock[key] = 0;
          }
        });
        
        // Si hay un almacén seleccionado para añadir stock en modo edición
        if (productData.selectedWarehouse && productData.quantity > 0) {
          const selectedWarehouseId = productData.selectedWarehouse;
          const currentStock = productData.warehouseStock[selectedWarehouseId] || 0;
          productData.warehouseStock[selectedWarehouseId] = currentStock + productData.quantity;
          
          // Recalcular el stock total después de actualizar un almacén
          productData.quantity = Object.values(productData.warehouseStock).reduce(
            (sum, stock) => sum + (isNaN(stock) ? 0 : Number(stock)), 
            0
          );
          
          // Eliminar la propiedad selectedWarehouse antes de guardar
          delete productData.selectedWarehouse;
        }
      }
      
      console.log('Saving product data:', productData); // Debug
      
      // Si es un producto nuevo, crear
      if (!isEditing) {
        await addProduct(productData);
        
        // Mostrar notificación de éxito
        setSnackbar({
          open: true,
          message: 'Producto añadido correctamente',
          severity: 'success'
        });
      } else {
        // Si es edición, actualizar
        const { id, ...updateData } = productData;
        await updateProduct(id, updateData);
        
        // Mostrar notificación de éxito
        setSnackbar({
          open: true,
          message: 'Producto actualizado correctamente',
          severity: 'success'
        });
      }
      
      // Cerrar ventana automáticamente tras éxito
      setOpenDialog(false);
      setDialogAction('');
      setProductChanged(false);
      
      // Recargar productos - ASEGÚRATE DE QUE ESTO SE EJECUTE
      await loadProducts();
      
    } catch (error) {
      console.error('Error al guardar producto:', error);
      setFormError(`Error al guardar: ${error.message}`);
    } finally {
      // Desactivar indicador de carga independientemente del resultado
      setFormSubmitting(false);
    }
  };

  // Eliminar un producto
  const handleDeleteProduct = (productId) => {
    // En lugar de usar window.confirm, guardamos el ID y abrimos nuestro diálogo
    setProductToDelete(productId);
    setConfirmDeleteDialogOpen(true);
  };
  
  const confirmDelete = async () => {
    try {
      if (!productToDelete) return;

      // Añadir indicador de carga
      setIsDeleting(true);
      
      await deleteProduct(productToDelete);
      
      setSnackbar({
        open: true,
        message: 'Producto eliminado correctamente',
        severity: 'success'
      });
      
      // Cerrar el diálogo y limpiar el estado
      setConfirmDeleteDialogOpen(false);
      setProductToDelete(null);
      
      // Recargar productos
      await loadProducts();
    } catch (error) {
      console.error(`Error al eliminar producto ${productToDelete}:`, error);
      setSnackbar({
        open: true,
        message: `Error al eliminar producto: ${error.message}`,
        severity: 'error'
      });
    
    } finally {
      setIsDeleting(false);
      setConfirmDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  };
  
  // En cancelDelete
  const cancelDelete = () => {
    // Cambia esto para usar confirmDeleteDialogOpen
    setConfirmDeleteDialogOpen(false);
    setProductToDelete(null);
  };
  

  // Cerrar snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Recargar datos
  const handleRefresh = async () => {
    try {
      await loadProducts();
      setSnackbar({
        open: true,
        message: 'Datos actualizados correctamente',
        severity: 'success'
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Error al actualizar datos: ' + err.message,
        severity: 'error'
      });
    }
  };

  // Limpiar filtros
  const handleClearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setWarehouseFilter('');
    setShowLowStock(false);
  };

  // Manejar cambio de filtro de almacén
  const handleWarehouseFilterChange = (e) => {
    setWarehouseFilter(e.target.value);
  };

  // Verificar permisos
  const canModifyProducts = hasPermission('products');

  return (
    <ProductsPanelView 
      // Datos
      products={filteredProducts}
      warehouses={warehouses}
      stats={calculateStats()}
      
      // Estados
      loading={loading}
      error={error}
      openDialog={openDialog}
      isEditing={isEditing}
      currentProduct={currentProduct}
      formError={formError}
      snackbar={snackbar}
      searchTerm={searchTerm}
      categoryFilter={categoryFilter}
      showLowStock={showLowStock}
      
      // Permisos
      canModifyProducts={canModifyProducts}
      
      // Funciones utilitarias
      calculateTotalStock={calculateTotalStock}
      
      // Manejadores de eventos
      confirmCloseDialogOpen={confirmCloseDialogOpen}
      confirmDialogOpen={confirmDeleteDialogOpen}
      onConfirmClose={confirmClose}
      onCancelClose={cancelClose}
      onInputChange={handleInputChange}
      onExpiryDateChange={handleExpiryDateChange}
      onWarehouseStockChange={handleWarehouseStockChange}
      onOpenAddDialog={handleOpenAddDialog}
      onOpenEditDialog={handleOpenEditDialog}
      onCloseDialog={handleCloseDialog}
      onSaveProduct={handleSaveProduct}
      onCloseSnackbar={handleCloseSnackbar}
      onRefresh={handleRefresh}
      warehouseFilter={warehouseFilter}
      onWarehouseFilterChange={handleWarehouseFilterChange}
      formSubmitting={formSubmitting}
      isDeleting={isDeleting}
      onClearFilters={handleClearFilters}
      onDeleteProduct={handleDeleteProduct}
      productToDelete={productToDelete}
      onConfirmDelete={confirmDelete}
      onCancelDelete={cancelDelete}
      onSearchChange={(e) => setSearchTerm(e.target.value)}
      onCategoryChange={(e) => setCategoryFilter(e.target.value)}
      onLowStockToggle={() => setShowLowStock(!showLowStock)}
      
      // Constantes
      productCategories={PRODUCT_CATEGORIES}
      unitsOfMeasure={UNITS_OF_MEASURE}
    />
  );
};

export default ProductsPanel;