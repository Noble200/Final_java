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
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FilterList as FilterListIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
  Warehouse as WarehouseIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';

/**
 * Componente de vista para el Panel de Almacenes.
 * Maneja solo la presentación, recibiendo datos y funciones del componente controlador.
 */
const WarehousesPanelView = ({
  // Datos
  warehouses,
  fields,
  stats,
  
  // Estados
  loading,
  error,
  openDialog,
  isEditing,
  currentWarehouse,
  formError,
  snackbar,
  searchTerm,
  typeFilter,
  fieldFilter,
  conditionFilter,
  confirmDialogOpen,
  warehouseToDelete,
  
  // Permisos
  canModifyWarehouses,
  
  // Funciones utilitarias
  getFieldName,
  
  // Manejadores de eventos
  onInputChange,
  onOpenAddDialog,
  onOpenEditDialog,
  onDeleteWarehouse,
  onCloseDialog,
  onSaveWarehouse,
  onCloseSnackbar,
  onRefresh,
  onClearFilters,
  onSearchChange,
  onTypeChange,
  onFieldChange,
  onConditionChange,
  onConfirmDelete,
  onCancelDelete,
  formSubmitting,
  isDeleting,

  // Constantes
  warehouseTypes,
  storageConditions,
  capacityUnits,
}) => {
  // Renderizar estadísticas del panel
  const renderStats = () => {
    if (!stats) return null;
    
    return (
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h4" fontWeight="bold" color="primary">
                {stats.totalWarehouses}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Almacenes en total
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" color="text.primary" gutterBottom>
                Distribución por tipo
              </Typography>
              <Box>
                {Object.entries(stats.typeDistribution || {}).map(([type, count]) => (
                  <Chip 
                    key={type}
                    label={`${type}: ${count}`}
                    color="primary"
                    variant="outlined"
                    size="small"
                    sx={{ mr: 1, mb: 1 }}
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" color="text.primary" gutterBottom>
                Distribución por condiciones
              </Typography>
              <Box>
                {Object.entries(stats.conditionDistribution || {}).map(([condition, count]) => (
                  <Chip 
                    key={condition}
                    label={`${condition}: ${count}`}
                    color="info"
                    variant="outlined"
                    size="small"
                    sx={{ mr: 1, mb: 1 }}
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  // Columnas para la tabla de almacenes
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
      minWidth: 180,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <WarehouseIcon color="primary" fontSize="small" sx={{ mr: 1 }} />
          <Typography variant="body2" fontWeight="medium">
            {params.value}
          </Typography>
        </Box>
      )
    },
    { 
      field: 'location', 
      headerName: 'Ubicación', 
      flex: 1,
      minWidth: 180,
      renderCell: (params) => (
        <Typography variant="body2">
          {params.value || 'No especificada'}
        </Typography>
      )
    },
    { 
      field: 'type', 
      headerName: 'Tipo', 
      width: 150,
      renderCell: (params) => (
        <Chip 
          label={params.value || 'No especificado'} 
          size="small"
          color="primary"
          variant="outlined"
        />
      )
    },
    { 
      field: 'fieldId', 
      headerName: 'Campo', 
      width: 180,
      valueGetter: (params) => getFieldName(params.value),
      renderCell: (params) => (
        <Typography variant="body2">
          {params.value}
        </Typography>
      )
    },
    { 
      field: 'storageCondition', 
      headerName: 'Condiciones', 
      width: 150,
      renderCell: (params) => (
        <Chip 
          label={params.value || 'Normal'} 
          size="small"
          color="info"
          variant="outlined"
        />
      )
    },
    { 
      field: 'status', 
      headerName: 'Estado', 
      width: 120,
      renderCell: (params) => (
        <Chip 
          label={params.value === 'active' ? 'Activo' : 'Inactivo'} 
          color={params.value === 'active' ? 'success' : 'default'}
          size="small"
        />
      )
    },
    {
      field: 'actions',
      headerName: 'Acciones',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <Tooltip title="Editar">
            <IconButton 
              size="small" 
              onClick={() => onOpenEditDialog(params.row)}
              disabled={!canModifyWarehouses}
              color="primary"
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Eliminar">
            <IconButton 
              size="small" 
              onClick={() => onDeleteWarehouse(params.row.id)}
              disabled={!canModifyWarehouses}
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
          Almacenes
        </Typography>
        
        <Box>
          <Tooltip title="Actualizar datos">
            <IconButton onClick={onRefresh} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          
          {canModifyWarehouses && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={onOpenAddDialog}
              sx={{ ml: 1 }}
            >
              Añadir Almacén
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
          <Grid item xs={12} md={3}>
            <TextField
              label="Buscar almacenes"
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
            <FormControl fullWidth size="small">
              <InputLabel id="type-filter-label" sx={{ backgroundColor: 'white', px: 0.5 }}>
                Tipo de Almacén
              </InputLabel>
              <Select
                labelId="type-filter-label"
                value={typeFilter}
                label="Tipo de Almacén"
                onChange={onTypeChange}
                displayEmpty
              >
                <MenuItem value="">Todos</MenuItem>
                {warehouseTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="field-filter-label" sx={{ backgroundColor: 'white', px: 0.5 }}>
                Campo
              </InputLabel>
              <Select
                labelId="field-filter-label"
                value={fieldFilter}
                label="Campo"
                onChange={onFieldChange}
                displayEmpty
              >
                <MenuItem value="">Todos</MenuItem>
                {fields && fields.map((field) => (
                  <MenuItem key={field.id} value={field.id}>
                    {field.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="condition-filter-label" sx={{ backgroundColor: 'white', px: 0.5 }}>
                Condición
              </InputLabel>
              <Select
                labelId="condition-filter-label"
                value={conditionFilter}
                label="Condición"
                onChange={onConditionChange}
                displayEmpty
              >
                <MenuItem value="">Todas</MenuItem>
                {storageConditions.map((condition) => (
                  <MenuItem key={condition} value={condition}>
                    {condition}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={3} sx={{ ml: 'auto' }}>
            <Button
              variant="outlined"
              startIcon={<FilterListIcon />}
              onClick={onClearFilters}
              fullWidth
              disabled={!searchTerm && !typeFilter && !fieldFilter && !conditionFilter}
            >
              Limpiar Filtros
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Tabla de almacenes */}
      <Paper elevation={3} sx={{ flexGrow: 1, width: '100%', overflow: 'hidden' }}>
        <DataGrid
          rows={warehouses}
          columns={columns}
          loading={loading}
          initialState={{
            pagination: {
              paginationModel: {
                pageSize: 10,
              },
            },
            sorting: {
              sortModel: [{ field: 'name', sort: 'asc' }],
            },
          }}
          pageSizeOptions={[10, 25, 50]}
          checkboxSelection={false}
          disableRowSelectionOnClick
          localeText={{
            noRowsLabel: 'No hay almacenes',
            footerRowSelected: (count) => `${count} almacén${count !== 1 ? 'es' : ''} seleccionado${count !== 1 ? 's' : ''}`,
            noResultsOverlayLabel: 'No se encontraron resultados.',
          }}
          sx={{
            '& .MuiDataGrid-cell:focus-within, & .MuiDataGrid-cell:focus': {
              outline: 'none',
            },
            '& .MuiDataGrid-columnHeader:focus-within, & .MuiDataGrid-columnHeader:focus': {
              outline: 'none',
            }
          }}
        />
      </Paper>
      
      {/* Diálogo para añadir/editar almacén */}
      <Dialog 
        open={openDialog} 
        onClose={onCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {isEditing ? 'Editar Almacén' : 'Añadir Nuevo Almacén'}
        </DialogTitle>
        
        <DialogContent>
          {formError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formError}
            </Alert>
           )}
        
           <Grid container spacing={2} sx={{ mt: 1 }}>
             <Grid item xs={12} md={6}>
               <TextField
                 name="name"
                 label="Nombre del Almacén"
                 variant="outlined"
                 fullWidth
                 required
                 value={currentWarehouse.name || ''}
                 onChange={onInputChange}
               />
             </Grid>
            
             <Grid item xs={12} md={6}>
               <FormControl fullWidth required>
                 <InputLabel sx={{ backgroundColor: 'white', px: 0.5 }}>
                   Tipo de Almacén
                 </InputLabel>
                 <Select
                   name="type"
                   value={currentWarehouse.type || 'Principal'}
                   label="Tipo de Almacén"
                   onChange={onInputChange}
                 >
                   {warehouseTypes.map((type) => (
                     <MenuItem key={type} value={type}>
                       {type}
                     </MenuItem>
                   ))}
                 </Select>
               </FormControl>
             </Grid>
            
             <Grid item xs={12} md={6}>
               <TextField
                 name="location"
                 label="Ubicación/Dirección"
                 variant="outlined"
                 fullWidth
                 value={currentWarehouse.location || ''}
                 onChange={onInputChange}
                 InputProps={{
                   startAdornment: (
                     <InputAdornment position="start">
                     <LocationIcon />
                     </InputAdornment>
                   ),
                 }}
               />
             </Grid>
            
             <Grid item xs={12} md={6}>
               <FormControl fullWidth>
                 <InputLabel sx={{ backgroundColor: 'white', px: 0.5 }}>
                   Campo Asociado
                 </InputLabel>
                 <Select
                   name="fieldId"
                   value={currentWarehouse.fieldId || ''}
                   label="Campo Asociado"
                   onChange={onInputChange}
                   displayEmpty
                 >
                   <MenuItem value="">
                     <em>No asociado a un campo</em>
                   </MenuItem>
                   {fields && fields.map((field) => (
                     <MenuItem key={field.id} value={field.id}>
                       {field.name}
                     </MenuItem>
                   ))}
                 </Select>
               </FormControl>
             </Grid>
            
             <Grid item xs={12} md={6}>
               <FormControl fullWidth>
                 <InputLabel sx={{ backgroundColor: 'white', px: 0.5 }}>
                   Condiciones de Almacenamiento
                 </InputLabel>
                 <Select
                   name="storageCondition"
                   value={currentWarehouse.storageCondition || 'Normal'}
                   label="Condiciones de Almacenamiento"
                   onChange={onInputChange}
                 >
                   {storageConditions.map((condition) => (
                     <MenuItem key={condition} value={condition}>
                       {condition}
                     </MenuItem>
                   ))}
                 </Select>
               </FormControl>
             </Grid>
            
             <Grid item xs={12} md={4}>
               <TextField
                 name="capacity"
                 label="Capacidad"
                 type="number"
                 variant="outlined"
                 fullWidth
                 value={currentWarehouse.capacity}
                 onChange={onInputChange}
                 inputProps={{ min: 0 }}
               />
             </Grid>

             <Grid item xs={12} md={2}>
               <FormControl fullWidth>
                 <InputLabel sx={{ backgroundColor: 'white', px: 0.5 }}>
                   Unidad
                 </InputLabel>
                 <Select
                   name="capacityUnit"
                   value={currentWarehouse.capacityUnit || 'm³'}
                   label="Unidad"
                   onChange={onInputChange}
                 >
                   {capacityUnits.map((unit) => (
                     <MenuItem key={unit} value={unit}>
                       {unit}
                     </MenuItem>
                   ))}
                 </Select>
               </FormControl>
             </Grid>

             <Grid item xs={12} md={6}>
               <TextField
                 name="supervisor"
                 label="Encargado/Responsable"
                 variant="outlined"
                 fullWidth
                 value={currentWarehouse.supervisor || ''}
                 onChange={onInputChange}
                 InputProps={{
                   startAdornment: (
                     <InputAdornment position="start">
                     <PersonIcon />
                     </InputAdornment>
                   ),
                 }}
               />
             </Grid>
            
             <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={currentWarehouse.status === 'active'}
                    onChange={(e) => onInputChange({
                      target: {
                        name: 'status',
                        value: e.target.checked ? 'active' : 'inactive'
                      }
                    })}
                    color="primary"
                  />
                }
                label="Almacén activo"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                name="notes"
                label="Notas adicionales"
                variant="outlined"
                fullWidth
                multiline
                rows={3}
                value={currentWarehouse.notes || ''}
                onChange={onInputChange}
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={onCloseDialog}
            disabled={formSubmitting}
          >
            Cancelar
          </Button>
          <Button 
            variant="contained" 
            onClick={onSaveWarehouse}
            disabled={!currentWarehouse.name || formSubmitting}
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
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          Confirmar eliminación
        </DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro de que desea eliminar este almacén? Esta acción no se puede deshacer.
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
    </Box>
  );
};

export default WarehousesPanelView;