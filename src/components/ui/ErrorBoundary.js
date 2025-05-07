import React from 'react';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import { Box, Button, Container, Typography, Paper } from '@mui/material';
import { ErrorOutline } from '@mui/icons-material';

// Componente que muestra un error
const ErrorFallback = ({ error, resetErrorBoundary }) => {
  return (
    <Container maxWidth="md" sx={{ mt: 5 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          textAlign: 'center'
        }}>
          <ErrorOutline color="error" sx={{ fontSize: 64, mb: 2 }} />
          
          <Typography variant="h4" color="error" gutterBottom>
            ¡Ups! Algo salió mal
          </Typography>
          
          <Typography variant="body1" color="text.secondary" paragraph>
            Ha ocurrido un error inesperado en la aplicación.
          </Typography>
          
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              mt: 2, 
              bgcolor: 'background.default', 
              p: 2, 
              borderRadius: 1,
              maxWidth: '100%',
              overflow: 'auto',
              textAlign: 'left'
            }}
          >
            <strong>Error:</strong> {error.message}
          </Typography>
          
          <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
            <Button 
              variant="contained" 
              color="primary"
              onClick={resetErrorBoundary}
            >
              Intentar de nuevo
            </Button>
            
            <Button 
              variant="outlined"
              onClick={() => window.location.href = '/'}
            >
              Volver al inicio
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

// Función para registrar errores
const logErrorToService = (error, info) => {
  // Aquí se podría implementar un servicio de registro de errores
  console.error('Error capturado por ErrorBoundary:', error);
  console.error('Información del componente:', info);
};

// Componente ErrorBoundary
const ErrorBoundary = ({ children }) => {
  return (
    <ReactErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={logErrorToService}
      onReset={() => {
        // Acciones adicionales al reiniciar después de un error
      }}
    >
      {children}
    </ReactErrorBoundary>
  );
};

export default ErrorBoundary;