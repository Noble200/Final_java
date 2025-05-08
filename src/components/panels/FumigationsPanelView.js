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
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Badge
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FilterList as FilterListIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
  PictureAsPdf as PdfIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Check as CheckIcon,
  Cancel as CancelIcon,
  Image as ImageIcon,
  CloudUpload as UploadIcon,
  BugReport as BugReportIcon
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import dayjs from 'dayjs';

/**
 * Componente de vista para el Panel de Fumigaciones.
 * Maneja solo la presentación, recibiendo datos y funciones del componente controlador.
 */
const FumigationsPanelView = ({
  // Datos
  fumigations,
  products,
  warehouses,
  fields,
  
  // Estados
  loading,
  error,
  openDialog,
  isEditing,
  currentFumigation,
  currentProduct,
  formError,
  snackbar,
  searchTerm,
  statusFilter,
  dateFilter,
  fieldFilter,
  cropFilter,
  confirmDialogOpen,
  confirmDialogAction,
  isPerformingAction,
  formSubmitting,
  pdfDialogOpen,
  currentPdfUrl,
  pdfLoading,
  
  // Permisos
  canModifyFumigations,
  
  // Funciones utilitarias
  getUniqueEstablishments,
  getUniqueCrops,
  getStatusLabel,
  getStatusColor,
  calculateTotalQuantity,
  
  // Manejadores de eventos
  onInputChange,
  onDateChange,
  onSurfaceChange,
  onProductInputChange,
  onAddProduct,
  onRemoveProduct,
  onImageChange,
  onRemoveImage,
  onOpenAddDialog,
  onOpenEditDialog,
  onCloseDialog,
  onSaveFumigation,
  onUpdateStatus,
  onConfirmStatusUpdate,
  onCancelAction,
  onGeneratePdf,
  onDownloadPdf,
  onClosePdfDialog,
  onCloseSnackbar,
  onRefresh,
  onClearFilters,
  onSearchChange,
  onStatusChange,
  onDateFilterChange,
  onFieldChange,
  onCropChange,
  
  // Constantes
  fumigationStatus,
  cropTypes,
  doseUnits,
  productUnits
}) => {
  // Función para renderizar las acciones según el estado
  const renderStatusActions = (fumigation) => {
    const { status, id } = fumigation;
    
    switch (status) {
      case fumigationStatus.PENDING:
        return (
          <>
            <Tooltip title="Iniciar">
              <IconButton 
                color="primary" 
                size="small"
                onClick={() => onUpdateStatus(id, fumigationStatus.IN_PROGRESS)}
                disabled={!canModifyFumigations}
              >
                <PlayIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Cancelar">
              <IconButton 
                color="error" 
                size="small"
                onClick={() => onUpdateStatus(id, fumigationStatus.CANCELLED)}
                disabled={!canModifyFumigations}
              >
                <CancelIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </>
        );
      case fumigationStatus.IN_PROGRESS:
        return (
          <>
            <Tooltip title="Completar">
              <IconButton 
                color="success" 
                size="small"
                onClick={() => onUpdateStatus(id, fumigationStatus.COMPLETED)}
                disabled={!canModifyFumigations}
              >
                <CheckIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Cancelar">
              <IconButton 
                color="error" 
                size="small"
                onClick={() => onUpdateStatus(id, fumigationStatus.CANCELLED)}
                disabled={!canModifyFumigations}
              >
                <CancelIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </>
        );
      default:
        return null;
    }
  };

  // Columnas para la tabla de fumigaciones
  const columns = [
    { 
      field: 'order_number', 
      headerName: 'Orden N°', 
      width: 100,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight="medium">
          {params.value}
        </Typography>
      )
    },
    { 
      field: 'date', 
      headerName: 'Fecha', 
      width: 120,
      valueFormatter: (params) => {
        if (!params.value) return '';
        return new Date(params.value).toLocaleDateString('es-ES');
      }
    },
    { 
      field: 'establishment', 
      headerName: 'Establecimiento', 
      width: 170,
      flex: 1
    },
    { 
      field: 'crop', 
      headerName: 'Cultivo', 
      width: 120
    },
    { 
      field: 'lot', 
      headerName: 'Lote', 
      width: 120
    },
    { 
      field: 'surface', 
      headerName: 'Superficie (ha)', 
      width: 140,
      valueFormatter: (params) => params.value ? params.value.toFixed(2) : ''
    },
    { 
      field: 'applicator', 
      headerName: 'Aplicador', 
      width: 150
    },
    { 
      field: 'status', 
      headerName: 'Estado', 
      width: 130,
      renderCell: (params) => (
        <Chip 
          label={getStatusLabel(params.value)} 
          color={getStatusColor(params.value)}
          size="small"
        />
      )
    },
    {
      field: 'actions',
      headerName: 'Acciones',
      width: 180,
      sortable: false,
      renderCell: (params) => (
        <Box>
          {renderStatusActions(params.row)}
          
          <Tooltip title="Editar">
            <IconButton 
              size="small" 
              onClick={() => onOpenEditDialog(params.row)}
              disabled={!canModifyFumigations || params.row.status === fumigationStatus.COMPLETED || params.row.status === fumigationStatus.CANCELLED}
              color="primary"
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Ver/Descargar PDF">
            <IconButton 
              size="small"
              onClick={() => onGeneratePdf(params.row.id)}
              color="secondary"
            >
              <PdfIcon fontSize="small" />
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
          Fumigaciones
        </Typography>
        
        <Box>
          <Tooltip title="Actualizar datos">
            <IconButton onClick={onRefresh} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          
          {canModifyFumigations && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={onOpenAddDialog}
              sx={{ ml: 1 }}
            >
              Nueva Fumigación
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
      
      {/* Filtros */}
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              label="Buscar fumigaciones"
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
          
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel id="status-filter-label" sx={{ backgroundColor: 'white', px: 0.5 }}>
                Estado
              </InputLabel>
              <Select
                labelId="status-filter-label"
                value={statusFilter}
                label="Estado"
                onChange={onStatusChange}
                displayEmpty
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value={fumigationStatus.PENDING}>Pendiente</MenuItem>
                <MenuItem value={fumigationStatus.IN_PROGRESS}>En Proceso</MenuItem>
                <MenuItem value={fumigationStatus.COMPLETED}>Completada</MenuItem>
                <MenuItem value={fumigationStatus.CANCELLED}>Cancelada</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <DatePicker 
              label="Filtrar por fecha"
              value={dateFilter ? dayjs(dateFilter) : null}
              onChange={onDateFilterChange}
              slotProps={{
                textField: {
                  fullWidth: true,
                  size: "small",
                  variant: "outlined"
                }
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel id="field-filter-label" sx={{ backgroundColor: 'white', px: 0.5 }}>
                Establecimiento
              </InputLabel>
              <Select
                labelId="field-filter-label"
                value={fieldFilter}
                label="Establecimiento"
                onChange={onFieldChange}
                displayEmpty
              >
                <MenuItem value="">Todos</MenuItem>
                {getUniqueEstablishments().map((establishment) => (
                  <MenuItem key={establishment} value={establishment}>
                    {establishment}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel id="crop-filter-label" sx={{ backgroundColor: 'white', px: 0.5 }}>
                Cultivo
              </InputLabel>
              <Select
                labelId="crop-filter-label"
                value={cropFilter}
                label="Cultivo"
                onChange={onCropChange}
                displayEmpty
              >
                <MenuItem value="">Todos</MenuItem>
                {getUniqueCrops().map((crop) => (
                  <MenuItem key={crop} value={crop}>
                    {crop}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={1}>
            <Button
              variant="outlined"
              onClick={onClearFilters}
              fullWidth
              disabled={!searchTerm && !statusFilter && !dateFilter && !fieldFilter && !cropFilter}
              startIcon={<FilterListIcon />}
            >
              Limpiar
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Tabla de fumigaciones */}
      <Paper elevation={3} sx={{ flexGrow: 1, width: '100%', overflow: 'hidden' }}>
        <DataGrid
          rows={fumigations}
          columns={columns}
          loading={loading}
          initialState={{
            pagination: {
              paginationModel: {
                pageSize: 10,
              },
            },
            sorting: {
              sortModel: [{ field: 'order_number', sort: 'desc' }],
            },
          }}
          pageSizeOptions={[10, 25, 50]}
          checkboxSelection={false}
          disableRowSelectionOnClick
          localeText={{
            noRowsLabel: 'No hay fumigaciones',
            footerRowSelected: (count) => `${count} fumigación${count !== 1 ? 'es' : ''} seleccionada${count !== 1 ? 's' : ''}`,
            noResultsOverlayLabel: 'No se encontraron resultados.',
          }}
          getRowClassName={(params) => {
            switch (params.row.status) {
              case fumigationStatus.PENDING:
                return 'pending-row';
              case fumigationStatus.IN_PROGRESS:
                return 'in-progress-row';
              case fumigationStatus.COMPLETED:
                return 'completed-row';
              case fumigationStatus.CANCELLED:
                return 'cancelled-row';
              default:
                return '';
            }
          }}
          sx={{
            '& .pending-row': {
              backgroundColor: 'rgba(255, 152, 0, 0.08)'
            },
            '& .in-progress-row': {
              backgroundColor: 'rgba(33, 150, 243, 0.08)'
            },
            '& .completed-row': {
              backgroundColor: 'rgba(76, 175, 80, 0.08)'
            },
            '& .cancelled-row': {
              backgroundColor: 'rgba(211, 47, 47, 0.08)'
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
      
      {/* Diálogo para añadir/editar fumigación */}
      <Dialog 
        open={openDialog} 
        onClose={onCloseDialog}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          {isEditing ? 'Editar Fumigación' : 'Nueva Fumigación'}
        </DialogTitle>
        
        <DialogContent dividers>
          {formError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formError}
            </Alert>
          )}
          
          <Grid container spacing={2}>
            {/* Primera fila: Información general */}
            <Grid item xs={12} md={3}>
              <TextField
                name="order_number"
                label="Número de Orden"
                variant="outlined"
                fullWidth
                required
                value={currentFumigation.order_number || ''}
                disabled={true} // Generado automáticamente
              />
            </Grid>
            
            <Grid item xs={12} md={3}>
              <DatePicker 
                label="Fecha"
                value={currentFumigation.date ? dayjs(currentFumigation.date) : null}
                onChange={onDateChange}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                    variant: "outlined"
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={3}>
              <TextField
                name="establishment"
                label="Establecimiento"
                variant="outlined"
                fullWidth
                required
                value={currentFumigation.establishment || ''}
                onChange={onInputChange}
              />
            </Grid>
            
            <Grid item xs={12} md={3}>
              <TextField
                name="applicator"
                label="Aplicador"
                variant="outlined"
                fullWidth
                required
                value={currentFumigation.applicator || ''}
                onChange={onInputChange}
              />
            </Grid>
            
            {/* Segunda fila: Información del cultivo */}
            <Grid item xs={12} md={4}>
              <FormControl fullWidth required>
                <InputLabel id="crop-label" sx={{ backgroundColor: 'white', px: 0.5 }}>
                  Cultivo
                </InputLabel>
                <Select
                  labelId="crop-label"
                  name="crop"
                  value={currentFumigation.crop || ''}
                  label="Cultivo"
                  onChange={onInputChange}
                >
                  {cropTypes.map((crop) => (
                    <MenuItem key={crop} value={crop}>
                      {crop}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                name="lot"
                label="Lote"
                variant="outlined"
                fullWidth
                required
                value={currentFumigation.lot || ''}
                onChange={onInputChange}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                name="surface"
                label="Superficie (ha)"
                type="number"
                variant="outlined"
                fullWidth
                required
                value={currentFumigation.surface || ''}
                onChange={onSurfaceChange}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
            
            {/* Sección de productos */}
            <Grid item xs={12}>
              <Divider textAlign="left" sx={{ mt: 1, mb: 2 }}>
                <Typography variant="subtitle1" color="primary" fontWeight="medium">
                  Productos a aplicar
                </Typography>
              </Divider>
            </Grid>
            
            {/* Formulario para agregar productos */}
            <Grid item xs={12} md={3}>
              <FormControl fullWidth required>
                <InputLabel id="product-label" sx={{ backgroundColor: 'white', px: 0.5 }}>
                  Producto
                </InputLabel>
                <Select
                  labelId="product-label"
                  name="product_id"
                  value={currentProduct.product_id || ''}
                  label="Producto"
                  onChange={onProductInputChange}
                  disabled={!currentFumigation.surface}
                >
                  <MenuItem value="" disabled>
                    Seleccione un producto
                  </MenuItem>
                  {products.map((product) => (
                    <MenuItem key={product.id} value={product.id}>
                      {product.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <FormControl fullWidth required>
                <InputLabel id="warehouse-label" sx={{ backgroundColor: 'white', px: 0.5 }}>
                  Almacén
                </InputLabel>
                <Select
                  labelId="warehouse-label"
                  name="warehouse_id"
                  value={currentProduct.warehouse_id || ''}
                  label="Almacén"
                  onChange={onProductInputChange}
                  disabled={!currentProduct.product_id}
                >
                  <MenuItem value="" disabled>
                    Seleccione un almacén
                  </MenuItem>
                  {warehouses.map((warehouse) => {
                    // Solo mostrar almacenes que tengan stock del producto seleccionado
                    const product = products.find(p => p.id === currentProduct.product_id);
                    if (!product) return null;
                    
                    const stock = product.warehouseStock?.[warehouse.id] || 0;
                    if (stock <= 0) return null;
                    
                    return (
                      <MenuItem key={warehouse.id} value={warehouse.id}>
                        {warehouse.name} (Stock: {stock} {product.unitOfMeasure})
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={2}>
              <TextField
                name="dose_per_ha"
                label="Dosis por ha"
                type="number"
                variant="outlined"
                fullWidth
                required
                value={currentProduct.dose_per_ha || ''}
                onChange={onProductInputChange}
                disabled={!currentProduct.warehouse_id}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
            
            <Grid item xs={12} md={1}>
              <FormControl fullWidth required>
                <InputLabel id="dose-unit-label" sx={{ backgroundColor: 'white', px: 0.5 }}>
                  Unidad
                </InputLabel>
                <Select
                  labelId="dose-unit-label"
                  name="dose_unit"
                  value={currentProduct.dose_unit || 'cc/ha'}
                  label="Unidad"
                  onChange={onProductInputChange}
                  disabled={!currentProduct.warehouse_id}
                >
                  {doseUnits.map((unit) => (
                    <MenuItem key={unit} value={unit}>
                      {unit}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={2}>
              <TextField
                name="total_quantity"
                label="Cantidad Total"
                type="number"
                variant="outlined"
                fullWidth
                required
                value={currentProduct.total_quantity || ''}
                onChange={onProductInputChange}
                disabled={!currentProduct.dose_per_ha}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      {currentProduct.total_unit}
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={1}>
              <Button
                variant="contained"
                color="secondary"
                fullWidth
                onClick={onAddProduct}
                disabled={!currentProduct.product_id || !currentProduct.warehouse_id || !currentProduct.dose_per_ha || !currentProduct.total_quantity}
                sx={{ height: '100%' }}
              >
                <AddIcon />
              </Button>
            </Grid>
            
            {/* Tabla de productos agregados */}
            <Grid item xs={12}>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Producto</TableCell>
                      <TableCell>Almacén</TableCell>
                      <TableCell>Dosis/ha</TableCell>
                      <TableCell>Cantidad Total</TableCell>
                      <TableCell align="center">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {currentFumigation.products.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          No hay productos agregados
                        </TableCell>
                      </TableRow>
                    ) : (
                      currentFumigation.products.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            {product.product_name || products.find(p => p.id === product.product_id)?.name || 'Producto'}
                          </TableCell>
                          <TableCell>
                            {product.warehouse_name || warehouses.find(w => w.id === product.warehouse_id)?.name || 'Almacén'}
                          </TableCell>
                          <TableCell>{product.dose_per_ha} {product.dose_unit}</TableCell>
                          <TableCell>{product.total_quantity} {product.total_unit}</TableCell>
                          <TableCell align="center">
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => onRemoveProduct(product.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
            
            {/* Sección de imagen y observaciones */}
            <Grid item xs={12}>
              <Divider textAlign="left" sx={{ mt: 2, mb: 2 }}>
                <Typography variant="subtitle1" color="primary" fontWeight="medium">
                  Imagen y Observaciones
                </Typography>
              </Divider>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ border: '1px dashed grey', p: 2, borderRadius: 1 }}>
                {currentFumigation.image_preview ? (
                  <Box sx={{ position: 'relative' }}>
                    <img 
                      src={currentFumigation.image_preview}
                      alt="Mapa de aplicación"
                      style={{ width: '100%', maxHeight: '300px', objectFit: 'contain' }}
                    />
                    <IconButton
                      sx={{ position: 'absolute', top: 5, right: 5, bgcolor: 'rgba(255,255,255,0.7)' }}
                      onClick={onRemoveImage}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '200px',
                      gap: 1
                    }}
                  >
                    <ImageIcon fontSize="large" color="disabled" />
                    <Typography variant="body2" color="text.secondary">
                      Cargue una imagen del mapa de aplicación
                    </Typography>
                    <Button
                      component="label"
                      variant="outlined"
                      startIcon={<UploadIcon />}
                    >
                      Seleccionar Imagen
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={onImageChange}
                      />
                    </Button>
                  </Box>
                )}
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                name="observations"
                label="Observaciones"
                multiline
                rows={8}
                variant="outlined"
                fullWidth
                value={currentFumigation.observations || ''}
                onChange={onInputChange}
                placeholder="Ingrese instrucciones o observaciones importantes para la fumigación"
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onCloseDialog} disabled={formSubmitting}>
            Cancelar
          </Button>
          <Button 
            variant="contained" 
            onClick={onSaveFumigation}
            disabled={
              !currentFumigation.establishment ||
              !currentFumigation.applicator ||
              !currentFumigation.crop ||
              !currentFumigation.lot ||
              !currentFumigation.surface ||
              currentFumigation.products.length === 0 ||
              formSubmitting
            }
            startIcon={formSubmitting ? <CircularProgress size={20} /> : null}
          >
            {formSubmitting 
              ? (isEditing ? 'Actualizando...' : 'Guardando...') 
              : (isEditing ? 'Actualizar' : 'Guardar')
            }
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Diálogo de confirmación para cambios de estado */}
      <Dialog
        open={confirmDialogOpen}
        onClose={onCancelAction}
        aria-labelledby="confirm-dialog-title"
      >
        <DialogTitle id="confirm-dialog-title">
          Confirmar cambio de estado
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            {confirmDialogAction === fumigationStatus.IN_PROGRESS && 
              '¿Está seguro de iniciar esta fumigación? Se descontarán los productos del stock cuando se complete.'
            }
            {confirmDialogAction === fumigationStatus.COMPLETED && 
              '¿Está seguro de marcar esta fumigación como completada? Se descontarán los productos del stock.'
            }
            {confirmDialogAction === fumigationStatus.CANCELLED && 
              '¿Está seguro de cancelar esta fumigación?'
            }
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={onCancelAction}
            disabled={isPerformingAction}
          >
            No
          </Button>
          <Button 
            onClick={onConfirmStatusUpdate}
            color={
              confirmDialogAction === fumigationStatus.IN_PROGRESS ? 'primary' :
              confirmDialogAction === fumigationStatus.COMPLETED ? 'success' :
              confirmDialogAction === fumigationStatus.CANCELLED ? 'error' :
              'primary'
            }
            variant="contained"
            disabled={isPerformingAction}
            startIcon={isPerformingAction ? <CircularProgress size={20} /> : null}
            autoFocus
          >
            Sí, {
              confirmDialogAction === fumigationStatus.IN_PROGRESS ? 'Iniciar' :
              confirmDialogAction === fumigationStatus.COMPLETED ? 'Completar' :
              confirmDialogAction === fumigationStatus.CANCELLED ? 'Cancelar' :
              'Confirmar'
            }
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Diálogo para visualizar PDF */}
      <Dialog
        open={pdfDialogOpen}
        onClose={onClosePdfDialog}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Orden de Fumigación
          <IconButton
            aria-label="close"
            onClick={onClosePdfDialog}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {pdfLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : currentPdfUrl ? (
            currentPdfUrl.endsWith('.pdf') ? (
              <iframe 
                src={currentPdfUrl} 
                width="100%" 
                height="600px" 
                style={{ border: 'none' }}
                title="Orden de Fumigación"
              />
            ) : (
              <Box sx={{ textAlign: 'center' }}>
                <img 
                  src={currentPdfUrl} 
                  alt="Mapa de aplicación" 
                  style={{ maxWidth: '100%', maxHeight: '600px', objectFit: 'contain' }}
                />
              </Box>
            )
          ) : (
            <Typography variant="body1" align="center">
              No hay documento disponible para esta fumigación
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          {currentPdfUrl && (
            <Button
              startIcon={<PdfIcon />}
              variant="contained"
              color="primary"
              onClick={() => window.open(currentPdfUrl, '_blank')}
            >
              Descargar
            </Button>
          )}
          <Button onClick={onClosePdfDialog}>
            Cerrar
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
    </Box>
  );
};

export default FumigationsPanelView;