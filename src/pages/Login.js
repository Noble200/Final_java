import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Paper,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton
} from '@mui/material';
import {
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, currentUser, error: authError, setError: setAuthError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (currentUser) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [currentUser, navigate, location]);

  // Mostrar error del contexto de autenticación
  useEffect(() => {
    if (authError) {
      setError(authError);
      setAuthError('');
    }
  }, [authError, setAuthError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Por favor completa todos los campos');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      await login(email, password);
      // No es necesario navegar aquí, el useEffect se encargará
    } catch (err) {
      // Manejar error específico de Firebase
      if (err.code === 'auth/invalid-email' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError('Correo electrónico o contraseña incorrectos');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Demasiados intentos fallidos. Por favor, intenta de nuevo más tarde.');
      } else {
        setError('Error al iniciar sesión. Por favor, intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          py: 4
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%'
          }}
        >
          <Typography component="h1" variant="h4" color="primary" fontWeight="bold" gutterBottom>
            AgroGestión
          </Typography>
          
          <Typography variant="h6" gutterBottom>
            Iniciar Sesión
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Correo Electrónico"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Contraseña"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handlePasswordVisibility}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.5 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Iniciar Sesión'}
            </Button>
          </Box>
          
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
            Sistema de Gestión Agrícola con Stock Centralizado
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;