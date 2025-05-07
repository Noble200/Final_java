import { createTheme } from '@mui/material/styles';

// Crear un tema personalizado
const theme = createTheme({
  palette: {
    primary: {
      main: '#4CAF50', // Verde
      light: '#80E27E',
      dark: '#087F23',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#2196F3', // Azul
      light: '#6EC6FF',
      dark: '#0069C0',
      contrastText: '#FFFFFF',
    },
    warning: {
      main: '#FF9800', // Naranja
      light: '#FFC947',
      dark: '#C66900',
      contrastText: '#000000',
    },
    error: {
      main: '#F44336', // Rojo
      light: '#FF7961',
      dark: '#BA000D',
      contrastText: '#FFFFFF',
    },
    success: {
      main: '#4CAF50', // Verde
      light: '#80E27E',
      dark: '#087F23',
      contrastText: '#FFFFFF',
    },
    info: {
      main: '#03A9F4', // Azul claro
      light: '#67DAFF',
      dark: '#007AC1',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F5F5F5',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#263238',
      secondary: '#546E7A',
      disabled: '#90A4AE',
    },
  },
  typography: {
    fontFamily: [
      'Roboto',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontWeight: 500,
      fontSize: '2.5rem',
    },
    h2: {
      fontWeight: 500,
      fontSize: '2rem',
    },
    h3: {
      fontWeight: 500,
      fontSize: '1.75rem',
    },
    h4: {
      fontWeight: 500,
      fontSize: '1.5rem',
    },
    h5: {
      fontWeight: 500,
      fontSize: '1.25rem',
    },
    h6: {
      fontWeight: 500,
      fontSize: '1rem',
    },
    body1: {
      fontSize: '1rem',
    },
    body2: {
      fontSize: '0.875rem',
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontSize: '0.875rem',
          padding: '8px 16px',
        },
        sizeSmall: {
          padding: '4px 8px',
        },
        sizeLarge: {
          padding: '12px 24px',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.08)',
        },
        elevation1: {
          boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.08)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.15)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.08)',
          borderRadius: 12,
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: 20,
          '&:last-child': {
            paddingBottom: 20,
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '12px 16px',
        },
        head: {
          fontWeight: 700,
          backgroundColor: '#F5F5F5',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#FFFFFF',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          '&.Mui-selected': {
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
            '&:hover': {
              backgroundColor: 'rgba(76, 175, 80, 0.2)',
            },
          },
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
          },
        },
      },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: {
          border: 'none',
          '& .MuiDataGrid-columnHeader': {
            backgroundColor: '#F5F5F5',
          },
          '& .MuiDataGrid-columnHeaderTitle': {
            fontWeight: 700,
          },
          '& .MuiDataGrid-cell': {
            borderBottom: '1px solid #E0E0E0',
          },
          '& .MuiDataGrid-row:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
          },
        },
      },
    },
  },
});

export default theme;