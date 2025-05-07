import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Tooltip
} from '@mui/material';
import {
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  Dashboard as DashboardIcon,
  Inventory as InventoryIcon,
  SwapHoriz as SwapHorizIcon,
  ShoppingCart as ShoppingCartIcon,
  Agriculture as AgricultureIcon,
  People as PeopleIcon,
  Grass as GrassIcon,
  Warehouse as WarehouseIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
  MoreVert as MoreVertIcon,
  ExitToApp as ExitToAppIcon,
  BugReport as BugReportIcon,
  Storage as StorageIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

// Ancho del drawer
const drawerWidth = 260;

// Componente styled para el AppBar
const StyledAppBar = styled(AppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

// Componente styled para el Drawer
const StyledDrawer = styled(Drawer, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
  '& .MuiDrawer-paper': {
    position: 'relative',
    whiteSpace: 'nowrap',
    width: drawerWidth,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    boxSizing: 'border-box',
    ...(!open && {
      overflowX: 'hidden',
      transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
      width: theme.spacing(7),
      [theme.breakpoints.up('sm')]: {
        width: theme.spacing(9),
      },
    }),
  },
}));

// Componente principal para el layout de la aplicación
const AppLayout = () => {
  const [open, setOpen] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const { currentUser, userPermissions, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Opciones del menú principal con rutas y permisos requeridos
  const menuOptions = [
    { 
      text: 'Panel Principal', 
      icon: <DashboardIcon />, 
      path: '/dashboard',
      permission: 'dashboard' 
    },
    { 
      text: 'Productos', 
      icon: <InventoryIcon />, 
      path: '/productos',
      permission: 'products' 
    },
    { 
      text: 'Test Supabase', 
      icon: <StorageIcon />, 
      path: '/test-supabase',
      permission: 'dashboard' // Usar un permiso que ya tengas
    },
    { 
      text: 'Transferencias', 
      icon: <SwapHorizIcon />, 
      path: '/transferencias',
      permission: 'transfers' 
    },
    { 
      text: 'Compras', 
      icon: <ShoppingCartIcon />, 
      path: '/compras',
      permission: 'purchases' 
    },
    { 
      text: 'Fumigaciones', 
      icon: <BugReportIcon />, 
      path: '/fumigaciones',
      permission: 'fumigations' 
    },
    { 
      text: 'Campos', 
      icon: <GrassIcon />, 
      path: '/campos',
      permission: 'fields' 
    },
    { 
      text: 'Almacenes', 
      icon: <WarehouseIcon />, 
      path: '/almacenes',
      permission: 'warehouses' 
    },
    { 
      text: 'Reportes', 
      icon: <AssessmentIcon />, 
      path: '/reportes',
      permission: 'reports' 
    },
    { 
      text: 'Usuarios', 
      icon: <PeopleIcon />, 
      path: '/usuarios',
      permission: 'users',
      adminOnly: true
    }
  ];

  const toggleDrawer = () => {
    setOpen(!open);
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  // Comprobar si el usuario tiene permiso para una opción
  const hasPermission = (option) => {
    if (!userPermissions) return false;
    if (userPermissions.admin) return true;
    if (option.adminOnly && !userPermissions.admin) return false;
    return option.permission ? userPermissions[option.permission] : true;
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <StyledAppBar position="absolute" open={open}>
        <Toolbar
          sx={{
            pr: '24px',
            backgroundColor: 'primary.main'
          }}
        >
          <IconButton
            edge="start"
            color="inherit"
            aria-label="open drawer"
            onClick={toggleDrawer}
            sx={{
              marginRight: '36px',
              ...(open && { display: 'none' }),
            }}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            component="h1"
            variant="h6"
            color="inherit"
            noWrap
            sx={{ flexGrow: 1 }}
          >
            AgroGestión
          </Typography>
          
          <Tooltip title={currentUser?.email || 'Usuario'}>
            <IconButton
              color="inherit"
              onClick={handleMenuOpen}
              size="small"
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                {currentUser?.email?.charAt(0)?.toUpperCase() || 'U'}
              </Avatar>
            </IconButton>
          </Tooltip>
          
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <MenuItem disabled>
              <Typography variant="body2">
                {currentUser?.email}
              </Typography>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <ExitToAppIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Cerrar sesión</ListItemText>
            </MenuItem>
          </Menu>
        </Toolbar>
      </StyledAppBar>
      
      <StyledDrawer variant="permanent" open={open}>
        <Toolbar
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            px: [1],
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            width: '100%',
            p: 1 
          }}>
            {open && (
              <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                AgroGestión
              </Typography>
            )}
            <IconButton onClick={toggleDrawer}>
              <ChevronLeftIcon />
            </IconButton>
          </Box>
        </Toolbar>
        <Divider />
        <List component="nav">
          {menuOptions.map((option) => 
            hasPermission(option) && (
              <ListItem key={option.text} disablePadding>
                <ListItemButton
                  selected={location.pathname === option.path}
                  onClick={() => navigate(option.path)}
                  sx={{
                    minHeight: 48,
                    justifyContent: open ? 'initial' : 'center',
                    px: 2.5,
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: open ? 3 : 'auto',
                      justifyContent: 'center',
                      color: location.pathname === option.path ? 'primary.main' : 'inherit'
                    }}
                  >
                    {option.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={option.text} 
                    sx={{ 
                      opacity: open ? 1 : 0,
                      color: location.pathname === option.path ? 'primary.main' : 'inherit',
                      '& .MuiTypography-root': {
                        fontWeight: location.pathname === option.path ? 'bold' : 'normal',
                      }
                    }} 
                  />
                </ListItemButton>
              </ListItem>
            )
          )}
        </List>
      </StyledDrawer>
      
      <Box
        component="main"
        sx={{
          backgroundColor: (theme) => theme.palette.grey[100],
          flexGrow: 1,
          height: '100vh',
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Toolbar />
        <Box sx={{ 
          flexGrow: 1, 
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default AppLayout;