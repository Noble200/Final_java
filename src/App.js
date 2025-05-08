import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { esES } from '@mui/material/locale';
import TestConnectionPanel from './pages/TestConnectionPanel';

// Contextos
import { AuthProvider } from './contexts/AuthContext';
import { StockProvider } from './contexts/StockContext';

// Tema
import theme from './theme';

// Páginas y componentes
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProductsPanel from './pages/ProductsPanel';
import TransfersPanel from './pages/TransfersPanel';
import PurchasesPanel from './pages/PurchasesPanel';
import FumigationsPanel from './pages/FumigationsPanel';
import UsersPanel from './pages/UsersPanel';
import FieldsPanel from './pages/FieldsPanel';
import FumigationsPanel from './pages/FumigationsPanel';
import WarehousesPanel from './pages/WarehousesPanel';
import ReportsPanel from './pages/ReportsPanel';
import AppLayout from './components/ui/AppLayout';
import PrivateRoute from './components/ui/PrivateRoute';
import ErrorBoundary from './components/ui/ErrorBoundary';

// Importar locales de español para fechas
import 'dayjs/locale/es';

function App() {
  return (
    <ThemeProvider theme={{ ...theme, esES }}>
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
        <CssBaseline />
        <ErrorBoundary>
          <AuthProvider>
            <StockProvider>
              <Router>
                <Routes>
                  {/* Ruta pública */}
                  <Route path="/login" element={<Login />} />
                  
                  {/* Rutas privadas */}
                  <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/productos" element={<ProductsPanel />} />
                    <Route path="/transferencias" element={<TransfersPanel />} />
                    <Route path="/compras" element={<PurchasesPanel />} />
                    <Route path="/fumigaciones" element={<FumigationsPanel />} />
                    <Route path="/usuarios" element={<UsersPanel />} />
                    <Route path="/campos" element={<FieldsPanel />} />
                    <Route path="/almacenes" element={<WarehousesPanel />} />
                    <Route path="/reportes" element={<ReportsPanel />} />
                    <Route path="/test-supabase" element={<TestConnectionPanel />} />
                  </Route>
                  
                  {/* Redirigir cualquier otra ruta al dashboard */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Router>
            </StockProvider>
          </AuthProvider>
        </ErrorBoundary>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;