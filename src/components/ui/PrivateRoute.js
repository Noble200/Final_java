import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Box, CircularProgress, Typography } from '@mui/material';

/**
 * Componente para proteger rutas privadas
 * Redirige al login si el usuario no está autenticado
 * @param {Object} props - Propiedades del componente
 * @param {string} props.requiredPermission - Permiso requerido para acceder a la ruta
 * @param {React.ReactNode} props.children - Contenido a renderizar si tiene acceso
 */
const PrivateRoute = ({ requiredPermission, children }) => {
  const { currentUser, hasPermission, isAdmin, loading } = useAuth();
  const location = useLocation();

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100vh' 
        }}
      >
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Verificando acceso...
        </Typography>
      </Box>
    );
  }

  // Redirigir al login si no hay usuario autenticado
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Los administradores tienen acceso a todas las rutas
  if (isAdmin) {
    return children;
  }

  // Si se requiere un permiso específico, verificarlo
  if (requiredPermission && !hasPermission(requiredPermission)) {
    // Redirigir al dashboard si no tiene el permiso requerido
    return <Navigate to="/dashboard" replace />;
  }

  // Si todo está bien, mostrar el contenido
  return children;
};

export default PrivateRoute;