import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Divider,
  Button,
  Card,
  CardContent,
  CardActions,
  List,
  ListItem,
  ListItemText,
  Chip,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  Warning as WarningIcon,
  EventAvailable as EventAvailableIcon,
  TrendingUp as TrendingUpIcon,
  SwapHoriz as SwapHorizIcon,
  LocalShipping as LocalShippingIcon,
  BugReport as BugReportIcon
} from '@mui/icons-material';
import { useStock } from '../contexts/StockContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../api/supabase';


const Dashboard = () => {
  const { products, warehouses, transfers, purchases, fumigations, loading, error } = useStock();
  const { currentUser, userPermissions } = useAuth();
  const navigate = useNavigate();
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [expiringSoonProducts, setExpiringSoonProducts] = useState([]);
  const [pendingTransfers, setPendingTransfers] = useState([]);
  const [pendingPurchases, setPendingPurchases] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);

  // Calcular datos para el dashboard
  useEffect(() => {
    if (loading) return;

    // Encontrar productos con stock bajo
    const lowStock = products.filter(product => {
      const totalStock = Object.values(product.warehouseStock || {}).reduce((sum, stock) => sum + stock, 0);
      return totalStock <= (product.minStock || 0);
    }).slice(0, 5);
    setLowStockProducts(lowStock);

    // Encontrar productos próximos a vencer
    const currentDate = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(currentDate.getDate() + 30);
    
    const expiringSoon = products
      .filter(product => {
        const expiryDate = product.expiryDate ? new Date(product.expiryDate.seconds * 1000) : null;
        return expiryDate && expiryDate > currentDate && expiryDate < thirtyDaysFromNow;
      })
      .slice(0, 5);
    setExpiringSoonProducts(expiringSoon);

    // Transferencias pendientes
    const pendingTransfs = transfers
      .filter(transfer => transfer.status === 'pending')
      .slice(0, 5);
    setPendingTransfers(pendingTransfs);

    // Compras pendientes
    const pendingPurchs = purchases
      .filter(purchase => purchase.status === 'pending' || purchase.status === 'partial')
      .slice(0, 5);
    setPendingPurchases(pendingPurchs);

    // Actividades recientes
    const allActivities = [
      ...transfers.map(transfer => ({
        type: 'transfer',
        id: transfer.id,
        date: transfer.updatedAt ? new Date(transfer.updatedAt.seconds * 1000) : new Date(),
        description: `Transferencia de ${transfer.products.length} producto(s) de ${getWarehouseName(transfer.sourceWarehouseId)} a ${getWarehouseName(transfer.targetWarehouseId)}`,
        status: transfer.status
      })),
      ...purchases.map(purchase => ({
        type: 'purchase',
        id: purchase.id,
        date: purchase.updatedAt ? new Date(purchase.updatedAt.seconds * 1000) : new Date(),
        description: `Compra de ${purchase.products.length} producto(s) a ${purchase.supplier}`,
        status: purchase.status
      })),
      ...fumigations.map(fumigation => ({
        type: 'fumigation',
        id: fumigation.id,
        date: fumigation.updatedAt ? new Date(fumigation.updatedAt.seconds * 1000) : new Date(),
        description: `Fumigación en ${fumigation.establishment} (${fumigation.surface} ha)`,
        status: fumigation.status
      }))
    ];
    
    // Ordenar por fecha descendente y tomar los 10 más recientes
    const recent = allActivities
      .sort((a, b) => b.date - a.date)
      .slice(0, 10);
    
    setRecentActivities(recent);

  }, [products, warehouses, transfers, purchases, fumigations, loading]);

  // Función auxiliar para obtener nombre de almacén
  const getWarehouseName = (warehouseId) => {
    const warehouse = warehouses.find(w => w.id === warehouseId);
    return warehouse ? warehouse.name : 'Almacén desconocido';
  };

  // Determinar si el usuario tiene permiso para acceder a una sección
  const hasPermission = (permission) => {
    if (!userPermissions) return false;
    return userPermissions.admin || userPermissions[permission];
  };

  // Obtener chips de estado según el valor
  const getStatusChip = (status) => {
    const statusMap = {
      'pending': { label: 'Pendiente', color: 'warning' },
      'partial': { label: 'Parcial', color: 'info' },
      'completed': { label: 'Completado', color: 'success' },
      'cancelled': { label: 'Cancelado', color: 'error' }
    };
    
    const statusInfo = statusMap[status] || { label: status, color: 'default' };
    
    return (
      <Chip 
        label={statusInfo.label} 
        color={statusInfo.color} 
        size="small" 
        sx={{ ml: 1 }}
      />
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ 
      height: '100%',
      overflow: 'auto',
      p: 1
    }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Panel Principal
      </Typography>
      
      <Grid container spacing={3}>
        {/* Primera fila: Tarjetas de resumen */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={3}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              bgcolor: 'primary.main',
              color: 'white'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <InventoryIcon sx={{ mr: 1 }} />
              <Typography variant="h6" component="div">
                Productos
              </Typography>
            </Box>
            <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
              {products.length}
            </Typography>
            <Typography variant="body2">
              Total en el sistema
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={3}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              bgcolor: 'warning.main',
              color: 'white'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <WarningIcon sx={{ mr: 1 }} />
              <Typography variant="h6" component="div">
                Stock Bajo
              </Typography>
            </Box>
            <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
              {lowStockProducts.length}
            </Typography>
            <Typography variant="body2">
              Productos bajo mínimo
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={3}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              bgcolor: 'success.main',
              color: 'white'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <LocalShippingIcon sx={{ mr: 1 }} />
              <Typography variant="h6" component="div">
                Almacenes
              </Typography>
            </Box>
            <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
              {warehouses.length}
            </Typography>
            <Typography variant="body2">
              En el sistema
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={3}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              bgcolor: 'info.main',
              color: 'white'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <SwapHorizIcon sx={{ mr: 1 }} />
              <Typography variant="h6" component="div">
                Transferencias
              </Typography>
            </Box>
            <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
              {pendingTransfers.length}
            </Typography>
            <Typography variant="body2">
              Pendientes
            </Typography>
          </Paper>
        </Grid>
        
        {/* Segunda fila: Productos con stock bajo */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <WarningIcon color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6" component="div">
                  Productos con Stock Bajo
                </Typography>
              </Box>
              
              <Divider sx={{ mb: 2 }} />
              
              {lowStockProducts.length > 0 ? (
                <List disablePadding>
                  {lowStockProducts.map((product) => {
                    const totalStock = Object.values(product.warehouseStock || {}).reduce((sum, stock) => sum + stock, 0);
                    return (
                      <ListItem 
                        key={product.id}
                        divider
                        sx={{ py: 1 }}
                      >
                        <ListItemText
                          primary={product.name}
                          secondary={
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                              <Typography variant="body2" color="text.secondary">
                                Stock actual: {totalStock} {product.unitOfMeasure || 'unidades'}
                              </Typography>
                              <Typography variant="body2" color="warning.main" sx={{ ml: 2 }}>
                                Mínimo: {product.minStock || 0} {product.unitOfMeasure || 'unidades'}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    );
                  })}
                </List>
              ) : (
                <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  No hay productos con stock bajo
                </Typography>
              )}
            </CardContent>
            
            {hasPermission('products') && (
              <CardActions sx={{ justifyContent: 'flex-end', p: 2, pt: 0 }}>
                <Button 
                  size="small" 
                  onClick={() => navigate('/productos')}
                >
                  Ver todos los productos
                </Button>
              </CardActions>
            )}
          </Card>
        </Grid>
        
        {/* Productos por vencer */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <EventAvailableIcon color="error" sx={{ mr: 1 }} />
                <Typography variant="h6" component="div">
                  Productos Próximos a Vencer
                </Typography>
              </Box>
              
              <Divider sx={{ mb: 2 }} />
              
              {expiringSoonProducts.length > 0 ? (
                <List disablePadding>
                  {expiringSoonProducts.map((product) => {
                    const expiryDate = product.expiryDate 
                      ? new Date(product.expiryDate.seconds * 1000).toLocaleDateString('es-ES') 
                      : 'Sin fecha';
                    return (
                      <ListItem 
                        key={product.id}
                        divider
                        sx={{ py: 1 }}
                      >
                        <ListItemText
                          primary={product.name}
                          secondary={
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                              <Typography variant="body2" color="error">
                                Vence: {expiryDate}
                              </Typography>
                              {product.lotNumber && (
                                <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                                  Lote: {product.lotNumber}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                    );
                  })}
                </List>
              ) : (
                <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  No hay productos próximos a vencer
                </Typography>
              )}
            </CardContent>
            
            {hasPermission('products') && (
              <CardActions sx={{ justifyContent: 'flex-end', p: 2, pt: 0 }}>
                <Button 
                  size="small" 
                  onClick={() => navigate('/productos')}
                >
                  Ver todos los productos
                </Button>
              </CardActions>
            )}
          </Card>
        </Grid>
        
        {/* Tercera fila: Transferencias pendientes y compras pendientes */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SwapHorizIcon color="info" sx={{ mr: 1 }} />
                <Typography variant="h6" component="div">
                  Transferencias Pendientes
                </Typography>
              </Box>
              
              <Divider sx={{ mb: 2 }} />
              
              {pendingTransfers.length > 0 ? (
                <List disablePadding>
                  {pendingTransfers.map((transfer) => {
                    const sourceWarehouse = getWarehouseName(transfer.sourceWarehouseId);
                    const targetWarehouse = getWarehouseName(transfer.targetWarehouseId);
                    const date = transfer.createdAt 
                      ? new Date(transfer.createdAt.seconds * 1000).toLocaleDateString('es-ES') 
                      : 'Sin fecha';
                    
                    return (
                      <ListItem 
                        key={transfer.id}
                        divider
                        sx={{ py: 1 }}
                      >
                        <ListItemText
                          primary={
                            <Typography variant="body1">
                              De: <strong>{sourceWarehouse}</strong> → A: <strong>{targetWarehouse}</strong>
                            </Typography>
                          }
                          secondary={
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                              <Typography variant="body2" color="text.secondary">
                                Fecha: {date}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                                Productos: {transfer.products.length}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    );
                  })}
                </List>
              ) : (
                <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  No hay transferencias pendientes
                </Typography>
              )}
            </CardContent>
            
            {hasPermission('transfers') && (
              <CardActions sx={{ justifyContent: 'flex-end', p: 2, pt: 0 }}>
                <Button 
                  size="small" 
                  onClick={() => navigate('/transferencias')}
                >
                  Ver todas las transferencias
                </Button>
              </CardActions>
            )}
          </Card>
        </Grid>
        
        <Grid item xs={12} lg={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LocalShippingIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" component="div">
                  Compras Pendientes
                </Typography>
              </Box>
              
              <Divider sx={{ mb: 2 }} />
              
              {pendingPurchases.length > 0 ? (
                <List disablePadding>
                  {pendingPurchases.map((purchase) => {
                    const date = purchase.createdAt 
                      ? new Date(purchase.createdAt.seconds * 1000).toLocaleDateString('es-ES') 
                      : 'Sin fecha';
                    const totalReceived = purchase.products.reduce((sum, p) => sum + (p.received || 0), 0);
                    const totalQuantity = purchase.products.reduce((sum, p) => sum + p.quantity, 0);
                    
                    return (
                      <ListItem 
                        key={purchase.id}
                        divider
                        sx={{ py: 1 }}
                      >
                        <ListItemText
                          primary={
                            <Typography variant="body1">
                              Proveedor: <strong>{purchase.supplier}</strong>
                              {getStatusChip(purchase.status)}
                            </Typography>
                          }
                          secondary={
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                              <Typography variant="body2" color="text.secondary">
                                Fecha: {date}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                                Recibido: {totalReceived}/{totalQuantity}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    );
                  })}
                </List>
              ) : (
                <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  No hay compras pendientes
                </Typography>
              )}
            </CardContent>
            
            {hasPermission('purchases') && (
              <CardActions sx={{ justifyContent: 'flex-end', p: 2, pt: 0 }}>
                <Button 
                  size="small" 
                  onClick={() => navigate('/compras')}
                >
                  Ver todas las compras
                </Button>
              </CardActions>
            )}
          </Card>
        </Grid>
        
        {/* Cuarta fila: Actividades recientes */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUpIcon color="secondary" sx={{ mr: 1 }} />
                <Typography variant="h6" component="div">
                  Actividades Recientes
                </Typography>
              </Box>
              
              <Divider sx={{ mb: 2 }} />
              
              {recentActivities.length > 0 ? (
                <List disablePadding>
                  {recentActivities.map((activity, index) => {
                    const date = activity.date.toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    });
                    
                    let icon;
                    switch (activity.type) {
                      case 'transfer':
                        icon = <SwapHorizIcon color="info" fontSize="small" />;
                        break;
                      case 'purchase':
                        icon = <LocalShippingIcon color="primary" fontSize="small" />;
                        break;
                      case 'fumigation':
                        icon = <BugReportIcon color="success" fontSize="small" />;
                        break;
                      default:
                        icon = <TrendingUpIcon color="secondary" fontSize="small" />;
                    }
                    
                    return (
                      <ListItem 
                        key={`${activity.type}-${activity.id}-${index}`}
                        divider={index < recentActivities.length - 1}
                        sx={{ py: 1 }}
                      >
                        <Box sx={{ mr: 1 }}>
                          {icon}
                        </Box>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Typography variant="body1">
                                {activity.description}
                              </Typography>
                              {getStatusChip(activity.status)}
                            </Box>
                          }
                          secondary={
                            <Typography variant="body2" color="text.secondary">
                              {date}
                            </Typography>
                          }
                        />
                      </ListItem>
                    );
                  })}
                </List>
              ) : (
                <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  No hay actividades recientes
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;