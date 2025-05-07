// src/components/panels/TestConnectionPanelView.js

import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Card,
  CardContent,
  Grid,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Storage as StorageIcon
} from '@mui/icons-material';

/**
 * Componente de vista para el Panel de Prueba de Conexión.
 * Permite probar la conexión con Supabase y ver el estado.
 */
const TestConnectionPanelView = ({
  // Estados
  loading,
  connectionState,
  testResults,
  
  // Manejadores de eventos
  onTestConnection,
  onTestTables,
  onRefresh
}) => {
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Cabecera */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Prueba de Conexión a Supabase
        </Typography>
        
        <Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={onRefresh}
            sx={{ ml: 1 }}
          >
            Refrescar
          </Button>
        </Box>
      </Box>
      
      <Grid container spacing={3}>
        {/* Tarjeta de estado de conexión */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <StorageIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" component="div">
                  Estado de la Conexión
                </Typography>
              </Box>
              
              <Divider sx={{ mb: 2 }} />
              
              {connectionState === null ? (
                <Alert severity="info">
                  Haz clic en "Probar Conexión" para verificar la conexión con Supabase.
                </Alert>
              ) : connectionState.success ? (
                <Alert 
                  severity="success"
                  icon={<CheckCircleIcon fontSize="inherit" />}
                >
                  {connectionState.message}
                </Alert>
              ) : (
                <Alert 
                  severity="error"
                  icon={<ErrorIcon fontSize="inherit" />}
                >
                  {connectionState.message}
                </Alert>
              )}
              
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  onClick={onTestConnection}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                  {loading ? 'Probando...' : 'Probar Conexión'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Tarjeta de prueba de tablas */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <StorageIcon color="secondary" sx={{ mr: 1 }} />
                <Typography variant="h6" component="div">
                  Prueba de Tablas
                </Typography>
              </Box>
              
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ mb: 2 }}>
                <Button
                  variant="contained"
                  color="secondary"
                  size="large"
                  onClick={onTestTables}
                  disabled={loading}
                  fullWidth
                >
                  Probar Todas las Tablas
                </Button>
              </Box>
              
              {testResults && testResults.length > 0 && (
                <Paper elevation={1} sx={{ p: 2, mt: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Resultados de pruebas:
                  </Typography>
                  
                  <List dense>
                    {testResults.map((result, index) => (
                      <React.Fragment key={result.table}>
                        <ListItem>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                {result.success ? (
                                  <CheckCircleIcon color="success" fontSize="small" sx={{ mr: 1 }} />
                                ) : (
                                  <ErrorIcon color="error" fontSize="small" sx={{ mr: 1 }} />
                                )}
                                <Typography variant="body1">
                                  <strong>{result.table}</strong>: {result.message}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                        {index < testResults.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                </Paper>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Tarjeta de instrucciones */}
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Instrucciones para la migración a Supabase
            </Typography>
            
            <Typography variant="body1" paragraph>
              Este panel te permite verificar que la conexión con Supabase está configurada correctamente. Asegúrate de:
            </Typography>
            
            <List>
              <ListItem>
                <ListItemText 
                  primary="1. Verificar que el archivo src/api/supabase.js existe con las credenciales correctas." 
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="2. Confirmar que las tablas necesarias están creadas en Supabase." 
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="3. Comprobar que las políticas de seguridad (RLS) permiten el acceso a los datos." 
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="4. Para migrar los datos existentes, exporta desde Firebase e importa a Supabase." 
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TestConnectionPanelView;