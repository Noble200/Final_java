import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../api/supabase';
import usersService from '../api/usersService';

// Crear el contexto de autenticación
const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userPermissions, setUserPermissions] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Función para iniciar sesión
  async function login(email, password) {
    try {
      setError('');
      const userData = await usersService.login(email, password);
      return userData;
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      setError('Error al iniciar sesión: ' + error.message);
      throw error;
    }
  }

  // Función para cerrar sesión
  async function logout() {
    try {
      setError('');
      await usersService.logout();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      setError('Error al cerrar sesión: ' + error.message);
      throw error;
    }
  }

  // Función para verificar si el usuario tiene un permiso específico
  function hasPermission(permission) {
    if (userRole === 'admin' || userPermissions?.admin) {
      return true;
    }
    
    return !!userPermissions?.[permission];
  }

  // Efecto para monitorear cambios en la autenticación
  useEffect(() => {
    setLoading(true);

    const safetyTimeout = setTimeout(() => {
      if (loading) {
        console.log('Timeout de seguridad activado - forzando reset de autenticación');
        setCurrentUser(null);
        setUserPermissions(null);
        setUserRole(null);
        setLoading(false);
      }
    }, 5000); // 5 segundos de timeout de seguridad
    
    // Suscripción a cambios en la autenticación
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          if (session?.user) {
            // Obtener datos adicionales del usuario desde la tabla users
            const { data: userData, error } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();
            
            if (error && error.code !== 'PGRST116') {
              console.error('Error al obtener datos del usuario:', error);
            }
            
            // Combinar datos de autenticación con datos de la tabla users
            setCurrentUser({
              uid: session.user.id,
              email: session.user.email,
              displayName: userData?.display_name || session.user.email.split('@')[0],
              emailVerified: session.user.email_confirmed_at !== null,
              ...(userData || {})
            });
            
            setUserRole(userData?.role || 'user');
            setUserPermissions(userData?.permissions || { dashboard: true });
          } else {
            // Reiniciar estados si no hay usuario autenticado
            setCurrentUser(null);
            setUserPermissions(null);
            setUserRole(null);
          }
        } catch (error) {
          console.error('Error al procesar cambio de autenticación:', error);
          if (session?.user) {
            // En caso de error, mantener el usuario básico
            setCurrentUser({
              uid: session.user.id,
              email: session.user.email,
              displayName: session.user.email.split('@')[0],
              emailVerified: session.user.email_confirmed_at !== null
            });
            setUserPermissions({ dashboard: true });
            setUserRole('user');
          }
          setError('Error al obtener datos completos del usuario: ' + error.message);
        } finally {
          setLoading(false);
        }
      }
    );
    
    // Verificar si hay un usuario actualmente autenticado
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        // Obtener datos adicionales del usuario
        supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()
          .then(({ data: userData, error }) => {
            if (!error || error.code === 'PGRST116') {
              setCurrentUser({
                uid: user.id,
                email: user.email,
                displayName: userData?.display_name || user.email.split('@')[0],
                emailVerified: user.email_confirmed_at !== null,
                ...(userData || {})
              });
              
              setUserRole(userData?.role || 'user');
              setUserPermissions(userData?.permissions || { dashboard: true });
            } else {
              console.error('Error al obtener datos del usuario:', error);
              // Usuario básico en caso de error
              setCurrentUser({
                uid: user.id,
                email: user.email,
                displayName: user.email.split('@')[0],
                emailVerified: user.email_confirmed_at !== null
              });
              setUserPermissions({ dashboard: true });
              setUserRole('user');
            }
          })
          .catch(error => {
            console.error('Error al obtener datos del usuario:', error);
          })
          .finally(() => {
            setLoading(false);
          });
      } else {
        setCurrentUser(null);
        setUserPermissions(null);
        setUserRole(null);
        setLoading(false);
      }
    });
    
    // Limpiar suscripción al desmontar
    return () => {
      authListener?.subscription?.unsubscribe();
      clearTimeout(safetyTimeout);
    };
  }, []);

  // Valor que se proporcionará a través del contexto
  const value = {
    currentUser,
    userPermissions,
    userRole,
    login,
    logout,
    hasPermission,
    error,
    setError,
    isAdmin: userRole === 'admin' || !!userPermissions?.admin,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;