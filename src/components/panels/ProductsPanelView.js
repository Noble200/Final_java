import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  FormHelperText,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  Snackbar,
  Divider,
  InputAdornment,
  Tooltip,
  Card,
  CardContent
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  FilterList as FilterListIcon,
  Search as SearchIcon,
  WarningAmber as WarningIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  CalendarMonth as CalendarIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

/**
 * Componente de vista para el Panel de Productos.
 * Maneja solo la presentación, recibiendo datos y funciones del componente controlador.
 */
const ProductsPanelView = ({
  // Datos
  products,
  warehouses,
  stats,
  
  // Estados
  loading,
  error,
  openDialog,
  isEditing,
  currentProduct,
  formError,
  snackbar,
  searchTerm,
  categoryFilter,
  showLowStock,
  confirmCloseDialogOpen,
  
  // Permisos
  canModifyProducts,
  
  // Funciones utilitarias
  calculateTotalStock,
  
  // Manejadores de eventos
  onInputChange,
  onExpiryDateChange,
  onWarehouseStockChange,
  onOpenAddDialog,
  onOpenEditDialog,
  onCloseDialog,
  onSaveProduct,
  onCloseSnackbar,
  onRefresh,
  onClearFilters,
  warehouseFilter,
  formSubmitting,
  isDeleting,
  confirmDialogOpen,
  onWarehouseFilterChange,
  onSearchChange,
  onCategoryChange,
  onLowStockToggle,
  onDeleteProduct,
  onConfirmDelete,
  onCancelDelete,
  onConfirmClose,
  onCancelClose,
  
  // Constantes
  productCategories,
  unitsOfMeasure
}) => {
  // Renderizar estadísticas del panel
  const renderStats = () => {
    if (!stats) return null;
    
    return (
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" fontWeight="bold" color="primary">
                {stats.totalProducts}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Productos en stock
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" fontWeight="bold" color="error">
                {stats.lowStockCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Productos con stock bajo
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" fontWeight="bold" color="warning.main">
                {stats.expiringCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Productos por vencer
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" fontWeight="bold" color="success.main">
                {stats.warehouseCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Almacenes activos
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  // Columnas para la tabla de productos
  const columns = [
    { 
      field: 'id', 
      headerName: 'ID', 
      width: 90,
      renderCell: (params) => (
        <Typography variant="body2" noWrap>
          {params.value}
        </Typography>
      )
    },
    { 
      field: 'name', 
      headerName: 'Nombre', 
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" fontWeight="medium">
            {params.value}
          </Typography>
          {params.row.lotNumber && (
            <Typography variant="caption" color="text.secondary">
              Lote: {params.row.lotNumber}
            </Typography>
          )}
        </Box>
      )
    },
    { 
      field: 'category', 
      headerName: 'Categoría', 
      width: 150,
      renderCell: (params) => (
        <Chip 
          label={params.value || 'Sin categoría'} 
          size="small"
          color={params.value ? 'primary' : 'default'}
          variant="outlined"
        />
      )
    },
    { 
      field: 'stock', 
      headerName: 'Stock', 
      type: 'number',
      width: 120,
      valueGetter: (params) => calculateTotalStock(params.row),
      renderCell: (params) => {
        const totalStock = params.value;
        const minStock = params.row.minStock || 0;
        const isLowStock = totalStock <= minStock && minStock > 0;
        
        return (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography 
              variant="body2" 
              fontWeight={isLowStock ? 'bold' : 'regular'}
              color={isLowStock ? 'error.main' : 'inherit'}
            >
              {totalStock}
            </Typography>
            {isLowStock && (
              <Tooltip title="Stock bajo mínimo">
                <WarningIcon color="error" fontSize="small" sx={{ ml: 0.5 }} />
              </Tooltip>
            )}
          </Box>
        );
      }
    },
    { 
      field: 'unitOfMeasure', 
      headerName: 'Unidad', 
      width: 100,
      renderCell: (params) => (
        <Typography variant="body2">
          {params.value || 'unidad'}
        </Typography>
      )
    },
    { 
      field: 'minStock', 
      headerName: 'Stock Mín.', 
      type: 'number',
      width: 110,
      renderCell: (params) => (
        <Typography variant="body2">
          {params.value || 0}
        </Typography>
      )
    },
    { 
      field: 'expiryDate', 
      headerName: 'Vencimiento', 
      width: 130,
      valueGetter: (params) => {
        if (!params.row.expiryDate) return null;
        return params.row.expiryDate.seconds ? 
          new Date(params.row.expiryDate.seconds * 1000) : 
          params.row.expiryDate;
      },
      renderCell: (params) => {
        const date = params.value;
        if (!date) return <Typography variant="body2">-</Typography>;
        
        const formattedDate = date.toLocaleDateString('es-ES');
        const today = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(today.getDate() + 30);
        
        const isExpired = date < today;
        const isExpiringSoon = !isExpired && date < thirtyDaysFromNow;
        
        return (
          <Typography 
            variant="body2" 
            color={isExpired ? 'error.main' : isExpiringSoon ? 'warning.main' : 'inherit'}
            fontWeight={isExpired || isExpiringSoon ? 'bold' : 'regular'}
          >
            {formattedDate}
          </Typography>
        );
      }
    },
    {
      field: 'actions',
      headerName: 'Acciones',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <Tooltip title="Ver/Editar">
            <IconButton 
              size="small" 
              onClick={() => onOpenEditDialog(params.row)}
              disabled={!canModifyProducts}
              color="primary"
            >
              <EditIcon fontSize="small" />
            </IconButton>
            </Tooltip>
            <Tooltip title="Eliminar">
            <IconButton 
              size="small"
              onClick={() => onDeleteProduct(params.row.id)}
              disabled={!canModifyProducts}
              color="error"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ];
  
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Cabecera */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Productos
        </Typography>
        
        <Box>
          <Tooltip title="Actualizar datos">
            <IconButton onClick={onRefresh} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          
          {canModifyProducts && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={onOpenAddDialog}
              sx={{ ml: 1 }}
            >
              Añadir Producto
            </Button>
          )}
        </Box>
      </Box>
      
      {/* Mensajes de error */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {/* Estadísticas rápidas */}
      {renderStats()}
      
      {/* Filtros */}
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              label="Buscar productos"
              variant="outlined"
              fullWidth
              size="small"
              value={searchTerm}
              onChange={onSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => onSearchChange({ target: { value: '' } })}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={3}>
            {/* Corregido: Se agregó sx={{ mt: 0 }} al InputLabel para evitar superposición */}
            <FormControl fullWidth size="small">
              <InputLabel id="category-filter-label" sx={{ mt: 0, backgroundColor: 'white', px: 0.5 }}>
                Categoría
              </InputLabel>
              <Select
                labelId="category-filter-label"
                value={categoryFilter}
                label="Categoría"
                onChange={onCategoryChange}
                displayEmpty
              >
                <MenuItem value="">Todas</MenuItem>
                {productCategories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel id="warehouse-filter-label" sx={{ mt: 0, backgroundColor: 'white', px: 0.5 }}>
                Almacén
              </InputLabel>
              <Select
                labelId="warehouse-filter-label"
                value={warehouseFilter}
                label="Almacén"
                onChange={onWarehouseFilterChange}
                displayEmpty
             >
                <MenuItem value="">Todos</MenuItem>
                {warehouses.map((warehouse) => (
                  <MenuItem key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <Button
              variant={showLowStock ? "contained" : "outlined"}
              color={showLowStock ? "warning" : "primary"}
              startIcon={<WarningIcon />}
              onClick={onLowStockToggle}
              fullWidth
            >
              Stock Bajo
            </Button>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <Button
              variant="outlined"
              startIcon={<FilterListIcon />}
              onClick={onClearFilters}
              fullWidth
              disabled={!searchTerm && !categoryFilter && !showLowStock}
            >
              Limpiar
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Tabla de productos */}
      <Paper elevation={3} sx={{ flexGrow: 1, width: '100%', overflow: 'hidden' }}>
        <DataGrid
          rows={products}
          columns={columns}
          loading={loading}
          initialState={{
            pagination: {
              paginationModel: {
                pageSize: 25,
              },
            },
            sorting: {
              sortModel: [{ field: 'name', sort: 'asc' }],
            },
          }}
          pageSizeOptions={[25, 50, 100]}
          checkboxSelection={false}
          disableRowSelectionOnClick
          localeText={{
            noRowsLabel: 'No hay productos',
            footerRowSelected: (count) => `${count} producto${count !== 1 ? 's' : ''} seleccionado${count !== 1 ? 's' : ''}`,
            noResultsOverlayLabel: 'No se encontraron resultados.',
            toolbarColumns: 'Columnas',
            toolbarFilters: 'Filtros',
            toolbarDensity: 'Densidad',
            columnsPanelTextFieldLabel: 'Buscar columna',
            columnsPanelShowAllButton: 'Mostrar todo',
            columnsPanelHideAllButton: 'Ocultar todo',
            toolbarExport: 'Exportar',
            toolbarExportCSV: 'Descargar como CSV',
          }}
          getRowClassName={(params) => {
            const totalStock = calculateTotalStock(params.row);
            const minStock = params.row.minStock || 0;
            
            // Clases para diferentes estados
            if (totalStock <= minStock && minStock > 0) {
              return 'low-stock-row';
            }
            
            const expiryDate = params.row.expiryDate?.seconds ? 
              new Date(params.row.expiryDate.seconds * 1000) : 
              params.row.expiryDate;
            
            if (expiryDate) {
              const today = new Date();
              const thirtyDaysFromNow = new Date();
              thirtyDaysFromNow.setDate(today.getDate() + 30);
              
              if (expiryDate < today) {
                return 'expired-row';
              } else if (expiryDate < thirtyDaysFromNow) {
                return 'expiring-soon-row';
              }
            }
            
            return '';
          }}
          sx={{
            '& .low-stock-row': {
              bgcolor: 'rgba(255, 152, 0, 0.08)'
            },
            '& .expired-row': {
              bgcolor: 'rgba(244, 67, 54, 0.08)'
            },
            '& .expiring-soon-row': {
              bgcolor: 'rgba(255, 193, 7, 0.08)'
            },
            '& .MuiDataGrid-cell:focus-within, & .MuiDataGrid-cell:focus': {
              outline: 'none',
            },
            '& .MuiDataGrid-columnHeader:focus-within, & .MuiDataGrid-columnHeader:focus': {
              outline: 'none',
            }
          }}
        />
      </Paper>
      
      {/* Diálogo para añadir/editar producto */}
      <Dialog 
        open={openDialog} 
        onClose={onCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {isEditing ? 'Editar Producto' : 'Añadir Nuevo Producto'}
        </DialogTitle>
        
        <DialogContent>
          {formError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formError}
            </Alert>
          )}
          
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={8}>
              <TextField
                name="name"
                label="Nombre del Producto"
                variant="outlined"
                fullWidth
                required
                value={currentProduct.name || ''}
                onChange={onInputChange}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <FormControl fullWidth required>
                <InputLabel sx={{ backgroundColor: 'white', px: 0.5 }}>
                  Categoría
                </InputLabel>
                <Select
                  name="category"
                  value={currentProduct.category || ''}
                  label="Categoría"
                  onChange={onInputChange}
                >
                  {productCategories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                name="lotNumber"
                label="Número de Lote"
                variant="outlined"
                fullWidth
                value={currentProduct.lotNumber || ''}
                onChange={onInputChange}
              />
            </Grid>
            
            {/* Corrección: Agregado campo de Cantidad Total */}
            <Grid item xs={12} md={4}>
              <TextField
                name="quantity"
                label="Cantidad Total"
                type="number"
                variant="outlined"
                fullWidth
                value={currentProduct.quantity === 0 ? '' : currentProduct.quantity || ''}  
                onChange={onInputChange}
                inputProps={{ min: 0 }}
                required
                helperText="Cantidad inicial del producto"
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                name="minStock"
                label="Stock Mínimo"
                type="number"
                variant="outlined"
                fullWidth
                value={currentProduct.minStock}
                onChange={onInputChange}
                inputProps={{ min: 0 }}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel sx={{ backgroundColor: 'white', px: 0.5 }}>
                  Unidad de Medida
                </InputLabel>
                <Select
                  name="unitOfMeasure"
                  value={currentProduct.unitOfMeasure || 'unidad'}
                  label="Unidad de Medida"
                  onChange={onInputChange}
                >
                  {unitsOfMeasure.map((unit) => (
                    <MenuItem key={unit} value={unit}>
                      {unit}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <DatePicker
                label="Fecha de Vencimiento"
                value={currentProduct.expiryDate ? dayjs(currentProduct.expiryDate) : null}
                onChange={onExpiryDateChange}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    variant: 'outlined',
                    InputProps: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <CalendarIcon color="action" />
                        </InputAdornment>
                      ),
                    }
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Divider textAlign="left" sx={{ mt: 2, mb: 2 }}>
                <Typography variant="subtitle2" color="primary">
                  Asignación de Stock
                </Typography>
              </Divider>
            </Grid>

            {/* Selector de almacén destino - Solo visible en modo añadir */}
            {!isEditing && (
              <>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required>
                    <InputLabel sx={{ backgroundColor: 'white', px: 0.5 }}>
                      Almacén Destino
                    </InputLabel>
                    <Select
                      name="selectedWarehouse"
                      value={currentProduct.selectedWarehouse || ''}
                      label="Almacén Destino"
                      onChange={onInputChange}
                    >
                      <MenuItem value="" disabled>
                        Seleccione un almacén
                      </MenuItem>
                      {warehouses.map((warehouse) => (
                        <MenuItem key={warehouse.id} value={warehouse.id}>
                          {warehouse.name}
                        </MenuItem>
                      ))}
                    </Select>
                    <FormHelperText>
                      El stock inicial se asignará a este almacén
                    </FormHelperText>
                  </FormControl>
                </Grid>
              </>
            )}

            {/* Vista de stock por almacén - Solo visible en modo edición */}
            {isEditing && (
              <>
                <Grid item xs={12} md={12}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Stock actual por almacén
                  </Typography>
                  {warehouses.length > 0 ? (
                    <Grid container spacing={2}>
                      {warehouses.map((warehouse) => (
                        <Grid item xs={12} md={4} key={warehouse.id}>
                          <TextField
                            label={`Stock en ${warehouse.name}`}
                            type="text"
                            variant="outlined"
                            fullWidth
                            value={currentProduct.warehouseStock?.[warehouse.id] || 0}
                            onChange={(e) => {
                              // Uso explícito del valor numérico
                              const newValue = e.target.value === '' ? '' : Number(e.target.value);
                              onWarehouseStockChange(warehouse.id, newValue);

                              // Opcionalmente: calcular total inmediatamente
                              const newWarehouseStock = {
                                ...currentProduct.warehouseStock,
                                [warehouse.id]: newValue
                              };

                              // Esto sería útil si quieres mostrar el total actualizado en tiempo real
                              const totalStock = Object.values(newWarehouseStock).reduce(
                                (sum, val) => sum + (val === '' ? 0 : Number(val)), 
                                0
                              );

                              console.log(`Nuevo stock total: ${totalStock}`);
                            }}
                            inputProps={{ min: 0 }}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  ) : (
                    <Alert severity="info">
                      No hay almacenes disponibles. Añade almacenes para gestionar el stock.
                    </Alert>
                  )}
                </Grid>
              </>
            )}

            {isEditing && (
              <Grid item xs={12} md={12} sx={{ mt: 2 }}>
                <Divider sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="primary">
                    Añadir stock a otro almacén
                  </Typography>
                </Divider>
                
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={5}>
                    <FormControl fullWidth>
                      <InputLabel>Almacén destino</InputLabel>
                      <Select
                        name="selectedWarehouse"
                        value={currentProduct.selectedWarehouse || ''}
                        label="Almacén destino"
                        onChange={onInputChange}
                      >
                        <MenuItem value="" disabled>
                          Seleccione un almacén
                        </MenuItem>
                        {warehouses.map((warehouse) => (
                          <MenuItem key={warehouse.id} value={warehouse.id}>
                            {warehouse.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <TextField
                      name="addQuantity"
                      label="Cantidad a añadir"
                      type="number"
                      variant="outlined"
                      fullWidth
                      value={currentProduct.addQuantity || ''}
                      onChange={onInputChange}
                      inputProps={{ min: 1 }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={3}>
                    <Button
                      variant="contained"
                      color="secondary"
                      fullWidth
                      startIcon={<AddIcon />}
                      onClick={() => {
                        // Verificar que se haya seleccionado un almacén y una cantidad
                        if (!currentProduct.selectedWarehouse || !currentProduct.addQuantity) {
                          return;
                        }
                        
                        // Obtener el stock actual de ese almacén
                        const currentStock = currentProduct.warehouseStock?.[currentProduct.selectedWarehouse] || 0;
                        
                        // Añadir la cantidad especificada
                        const newQuantity = currentStock + Number(currentProduct.addQuantity);
                        
                        // Actualizar el stock
                        onWarehouseStockChange(currentProduct.selectedWarehouse, newQuantity);
                        
                        // Opcional: limpiar los campos después de añadir
                        onInputChange({
                          target: {
                            name: 'selectedWarehouse',
                            value: ''
                          }
                        });
                        onInputChange({
                          target: {
                            name: 'addQuantity',
                            value: ''
                          }
                        });
                      }}
                      disabled={!currentProduct.selectedWarehouse || !currentProduct.addQuantity}
                    >
                      Añadir
                    </Button>
                  </Grid>
                </Grid>
              </Grid>
            )}
            
            <Grid item xs={12}>
              <TextField
                name="notes"
                label="Notas"
                variant="outlined"
                fullWidth
                multiline
                rows={3}
                value={currentProduct.notes || ''}
                onChange={onInputChange}
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onCloseDialog}>
            Cancelar
          </Button>
          <Button 
            variant="contained" 
            onClick={onSaveProduct}
            disabled={!currentProduct.name || formSubmitting}
            startIcon={formSubmitting ? <CircularProgress size={20} /> : null}
          >
            {formSubmitting 
              ? (isEditing ? 'Actualizando...' : 'Añadiendo...') 
              : (isEditing ? 'Actualizar' : 'Añadir')
            }
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar para notificaciones */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={onCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={onCloseSnackbar} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Diálogo de confirmación para eliminación */}
      <Dialog
        open={confirmDialogOpen}
        onClose={onCancelDelete}
        aria-labelledby="delete-dialog-title"
      >
        <DialogTitle id="delete-dialog-title">
          Confirmar eliminación
        </DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro de que desea eliminar este producto? Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={onCancelDelete}
            disabled={isDeleting} // Deshabilitar durante la eliminación
          >
            Cancelar
          </Button>
          <Button 
            onClick={onConfirmDelete} 
            color="error" 
            disabled={isDeleting} // Deshabilitar durante la eliminación
            startIcon={isDeleting ? <CircularProgress size={20} /> : null} // Indicador de carga
            autoFocus
          >
            {isDeleting ? 'Eliminando...' : 'Eliminar'} {/* Cambiar texto */}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de confirmación para cerrar sin guardar */}
      <Dialog
        open={confirmCloseDialogOpen || false}
        onClose={onCancelClose || (() => {})}
        aria-labelledby="close-dialog-title"
      >
        <DialogTitle id="close-dialog-title">
          Cambios sin guardar
        </DialogTitle>
        <DialogContent>
          <Typography>
            Hay cambios sin guardar. ¿Está seguro de que desea cerrar?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={onCancelClose || (() => {})}>Cancelar</Button>
          <Button onClick={onConfirmClose || (() => {})} color="primary" autoFocus>
            Cerrar sin guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProductsPanelView;