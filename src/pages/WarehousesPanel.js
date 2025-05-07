import React, { useState, useEffect, useCallback } from 'react';
import WarehousesPanelView from '../components/panels/WarehousesPanelView';
import { useStock } from '../contexts/StockContext';
import { useAuth } from '../contexts/AuthContext';

// Definición de constantes
export const WAREHOUSE_TYPES = [
  'Principal',
  'Secundario',
  'Temporal',
  'Distribuidor',
  'Depósito',
  'Otro'
];

export const STORAGE_CONDITIONS = [
  'Normal',
  'Acondicionado',
  'Frigorífico',
  'Almacenamiento en seco',
  'Alta seguridad',
  'Otro'
];

export const CAPACITY_UNITS = [
    'kg',
    'toneladas',
    'm²',
    'm³',
    'litros',
    'unidades',
    'pallets',
    'estanterías',
    'contenedores',
    'otro'
  ];

/**
 * Controlador principal para el Panel de Almacenes.
 * Maneja toda la lógica y estado, delegando la presentación a WarehousesPanelView.
 */
const WarehousesPanel = () => {
  const { 
    warehouses, 
    fields,
    loading, 
    error, 
    addWarehouse, 
    updateWarehouse,
    deleteWarehouse,
    loadWarehouses
  } = useStock();
  
  const { hasPermission } = useAuth();
  
  // Estados para el filtrado y búsqueda
  const [filteredWarehouses, setFilteredWarehouses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDeleteDialogOpen, setConfirmDeleteDialogOpen] = useState(false);
  const [fieldFilter, setFieldFilter] = useState('');
  const [conditionFilter, setConditionFilter] = useState('');
  
  // Estados para el formulario de almacén
  const [openDialog, setOpenDialog] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [warehouseToDelete, setWarehouseToDelete] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentWarehouse, setCurrentWarehouse] = useState({
    name: '',
    location: '',
    type: 'Principal',
    fieldId: '',
    storageCondition: 'Normal',
    capacity: '',
    supervisor: '',
    notes: '',
    status: 'active'
  });
  
  // Estados para mensajes y errores
  const [formError, setFormError] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // Estado para seguimiento de cambios
  const [warehouseChanged, setWarehouseChanged] = useState(false);
  const [dialogAction, setDialogAction] = useState('');

  // Calcular estadísticas
  const calculateStats = () => {
    if (!warehouses || warehouses.length === 0) return null;
    
    const totalWarehouses = warehouses.length;
    
    // Calcular distribución por tipo
    const typeDistribution = warehouses.reduce((acc, warehouse) => {
      const type = warehouse.type || 'No especificado';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    
    // Calcular distribución por condición de almacenamiento
    const conditionDistribution = warehouses.reduce((acc, warehouse) => {
      const condition = warehouse.storageCondition || 'No especificado';
      acc[condition] = (acc[condition] || 0) + 1;
      return acc;
    }, {});
    
    return {
      totalWarehouses,
      typeDistribution,
      conditionDistribution
    };
  };

  // Cargar almacenes con los filtros aplicados
  useEffect(() => {
    if (loading) return;
    
    filterWarehouses();
  }, [warehouses, searchTerm, typeFilter, fieldFilter, conditionFilter, loading]);

  // Función para aplicar filtros a los almacenes
  const filterWarehouses = () => {
    if (!warehouses || warehouses.length === 0) {
      setFilteredWarehouses([]);
      return;
    }
    
    let result = [...warehouses];
    
    // Filtrar por término de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(warehouse => 
        warehouse.name?.toLowerCase().includes(term) || 
        warehouse.id?.toLowerCase().includes(term) ||
        warehouse.location?.toLowerCase().includes(term) ||
        warehouse.supervisor?.toLowerCase().includes(term)
      );
    }
    
    // Filtrar por tipo
    if (typeFilter) {
      result = result.filter(warehouse => warehouse.type === typeFilter);
    }
    
    // Filtrar por campo
    if (fieldFilter) {
      result = result.filter(warehouse => warehouse.fieldId === fieldFilter);
    }
    
    // Filtrar por condición de almacenamiento
    if (conditionFilter) {
      result = result.filter(warehouse => warehouse.storageCondition === conditionFilter);
    }
    
    setFilteredWarehouses(result);
  };

  // Manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentWarehouse(prev => ({
      ...prev,
      [name]: name === 'capacity' ? 
        (value === '' ? '' : Number(value)) : 
        value
    }));
    
    // Solo marcar como cambiado si realmente hubo un cambio de valor
    if (!warehouseChanged) {
      setWarehouseChanged(true);
    }
  };

  // Abrir diálogo para añadir almacén
  const handleOpenAddDialog = () => {
    setCurrentWarehouse({
      name: '',
      location: '',
      type: 'Principal',
      fieldId: '',
      storageCondition: 'Normal',
      capacity: '',
      capacityUnit: 'm³',
      supervisor: '',
      notes: '',
      status: 'active'
    });
    setIsEditing(false);
    setFormError('');
    setWarehouseChanged(false);
    setDialogAction('add');
    setOpenDialog(true);
  };

  // Abrir diálogo para editar almacén
  const handleOpenEditDialog = (warehouse) => {
    setCurrentWarehouse({
      ...warehouse,
      capacity: warehouse.capacity || '',
      capacityUnit: warehouse.capacityUnit || 'm³'
    });
    
    setIsEditing(true);
    setFormError('');
    setWarehouseChanged(false);
    setDialogAction('edit');
    setOpenDialog(true);
  };

  // Cerrar diálogo
  const handleCloseDialog = () => {
    // Confirmar si hay cambios sin guardar
    if (warehouseChanged) {
      const confirm = window.confirm('Hay cambios sin guardar. ¿Seguro que desea cerrar?');
      if (confirm) {
        setOpenDialog(false);
        setDialogAction('');
        setWarehouseChanged(false);
      }
    } else {
      setOpenDialog(false);
      setDialogAction('');
    }
  };

  // Eliminar un almacén
  const handleDeleteWarehouse = (warehouseId) => {
    setWarehouseToDelete(warehouseId);
    setConfirmDeleteDialogOpen(true);
  };

  // Guardar almacén (añadir o actualizar)
  const handleSaveWarehouse = async () => {
    try {
      // Validaciones básicas
      if (!currentWarehouse.name) {
        setFormError('El nombre del almacén es obligatorio');
        return;
      }
      
      // Validar que los valores numéricos sean números válidos
      if (currentWarehouse.capacity !== '' && isNaN(currentWarehouse.capacity)) {
        setFormError('La capacidad debe ser un número válido');
        return;
      }
      
      // Activar indicador de carga
      setFormSubmitting(true);
      setFormError('');
      
      // Preparar datos para guardar
      const warehouseData = { ...currentWarehouse };
      
      // Convertir valores vacíos a valores adecuados
      if (warehouseData.capacity === '') warehouseData.capacity = null;
      if (!warehouseData.fieldId) warehouseData.fieldId = null;
      
      // Si es un almacén nuevo, crear
      if (!isEditing) {
        await addWarehouse(warehouseData);
        setSnackbar({
          open: true,
          message: 'Almacén añadido correctamente',
          severity: 'success'
        });
      } else {
        // Si es edición, actualizar
        const { id, ...updateData } = warehouseData;
        await updateWarehouse(id, updateData);
        setSnackbar({
          open: true,
          message: 'Almacén actualizado correctamente',
          severity: 'success'
        });
      }
      
      // Cerrar ventana automáticamente tras éxito
      setOpenDialog(false);
      setDialogAction('');
      setWarehouseChanged(false);
      
      // Importante: Resetear el estado de cambio antes de cerrar el diálogo
      setWarehouseChanged(false);
      
    } catch (error) {
      console.error('Error al guardar almacén:', error);
      setFormError(`Error al guardar: ${error.message}`);
    } finally {
      // Desactivar indicador de carga independientemente del resultado
      setFormSubmitting(false);
    }
  };

  // Función para confirmar eliminación
  const confirmDelete = async () => {
    try {
      if (!warehouseToDelete) return;
      
      // Activar indicador de carga
      setIsDeleting(true);
      
      // Llamar a la función de eliminación
      await deleteWarehouse(warehouseToDelete);
      
      // Mostrar notificación de éxito
      setSnackbar({
        open: true,
        message: 'Almacén eliminado correctamente',
        severity: 'success'
      });
      
      // Cerrar el diálogo y limpiar el estado
      setConfirmDeleteDialogOpen(false);
      setWarehouseToDelete(null);
      
    } catch (error) {
      console.error(`Error al eliminar almacén ${warehouseToDelete}:`, error);
      // Mostrar error en un snackbar
      setSnackbar({
        open: true,
        message: `Error al eliminar almacén: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setIsDeleting(false);
      setConfirmDeleteDialogOpen(false);
      setWarehouseToDelete(null);
    }
  };
  
  const cancelDelete = () => {
    setConfirmDeleteDialogOpen(false);
    setWarehouseToDelete(null);
  };

  // Cerrar snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Recargar datos
  const handleRefresh = async () => {
    try {
      await loadWarehouses();
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
    setTypeFilter('');
    setFieldFilter('');
    setConditionFilter('');
  };

  // Obtener nombre del campo
  const getFieldName = (fieldId) => {
    if (!fieldId || !fields) return 'No asignado';
    const field = fields.find(f => f.id === fieldId);
    return field ? field.name : 'No encontrado';
  };

  // Verificar permisos
  const canModifyWarehouses = hasPermission('warehouses');

  return (
    <WarehousesPanelView 
      // Datos
      warehouses={filteredWarehouses}
      fields={fields}
      stats={calculateStats()}
      
      // Estados
      loading={loading}
      error={error}
      openDialog={openDialog}
      isEditing={isEditing}
      currentWarehouse={currentWarehouse}
      formError={formError}
      snackbar={snackbar}
      searchTerm={searchTerm}
      typeFilter={typeFilter}
      fieldFilter={fieldFilter}
      conditionFilter={conditionFilter}
      confirmDialogOpen={confirmDeleteDialogOpen}
      warehouseToDelete={warehouseToDelete}
      formSubmitting={formSubmitting}
      isDeleting={isDeleting}
      
      // Permisos
      canModifyWarehouses={canModifyWarehouses}
      
      // Funciones utilitarias
      getFieldName={getFieldName}
      
      // Manejadores de eventos
      onInputChange={handleInputChange}
      onOpenAddDialog={handleOpenAddDialog}
      onOpenEditDialog={handleOpenEditDialog}
      onCloseDialog={handleCloseDialog}
      onSaveWarehouse={handleSaveWarehouse}
      onDeleteWarehouse={handleDeleteWarehouse}
      onCloseSnackbar={handleCloseSnackbar}
      onRefresh={handleRefresh}
      onClearFilters={handleClearFilters}
      onConfirmDelete={confirmDelete}
      onCancelDelete={cancelDelete}
      onSearchChange={(e) => setSearchTerm(e.target.value)}
      onTypeChange={(e) => setTypeFilter(e.target.value)}
      onFieldChange={(e) => setFieldFilter(e.target.value)}
      onConditionChange={(e) => setConditionFilter(e.target.value)}
      
      // Constantes
      warehouseTypes={WAREHOUSE_TYPES}
      storageConditions={STORAGE_CONDITIONS}
      capacityUnits={CAPACITY_UNITS}
    />
  );
};

export default WarehousesPanel;