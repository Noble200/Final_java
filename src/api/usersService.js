import { supabase } from './supabase';

const usersService = {
  login: async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Obtener datos adicionales del usuario
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (userError) {
        // Si no existe el usuario en la tabla users, crearlo
        if (userError.code === 'PGRST116') {
          const basicUserData = {
            id: data.user.id,
            email: data.user.email,
            display_name: data.user.email.split('@')[0],
            role: 'user',
            permissions: { dashboard: true }
          };

          await supabase.from('users').insert(basicUserData);
          
          return {
            uid: data.user.id,
            ...basicUserData,
            emailVerified: data.user.email_confirmed_at !== null,
            isNewUser: true
          };
        }
        throw userError;
      }

      return {
        uid: data.user.id,
        email: data.user.email,
        displayName: userData.display_name,
        emailVerified: data.user.email_confirmed_at !== null,
        role: userData.role,
        permissions: userData.permissions
      };
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      throw error;
    }
  },

  logout: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      throw error;
    }
  },

  getCurrentUser: async () => {
    const { data } = await supabase.auth.getUser();
    return data.user;
  },

  isAuthenticated: async () => {
    const { data } = await supabase.auth.getUser();
    return data.user !== null;
  },

  createUser: async (userData) => {
    try {
      if (!userData.email || !userData.password) {
        throw new Error('El correo y la contraseña son obligatorios');
      }
      
      // Crear usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password
      });
      
      if (authError) throw authError;
      
      // Datos a guardar en la tabla users
      const { password, sendVerification, ...userDataForDB } = userData;
      
      // Asegurarse de que tenga un rol y permisos
      const dataWithDefaults = {
        id: authData.user.id,
        email: authData.user.email,
        display_name: userData.displayName || userData.email.split('@')[0],
        role: userData.role || 'user',
        permissions: userData.permissions || {
          dashboard: true
        }
      };
      
      // Guardar datos en la tabla users
      const { error: insertError } = await supabase
        .from('users')
        .insert(dataWithDefaults);
      
      if (insertError) throw insertError;
      
      return authData.user.id;
    } catch (error) {
      console.error('Error al crear usuario:', error);
      throw error;
    }
  },

  updateUser: async (userId, userData) => {
    try {
      // Eliminar campos sensibles que no se deben actualizar directamente
      const { password, email, uid, ...updateData } = userData;
      
      // Adaptar nombres de campos para PostgreSQL
      const dbUpdateData = {
        display_name: updateData.displayName,
        role: updateData.role,
        permissions: updateData.permissions,
        updated_at: new Date()
      };
      
      // Actualizar en la base de datos
      const { error } = await supabase
        .from('users')
        .update(dbUpdateData)
        .eq('id', userId);
        
      if (error) throw error;
      
      return userId;
    } catch (error) {
      console.error(`Error al actualizar usuario ${userId}:`, error);
      throw error;
    }
  },

  changePassword: async (currentPassword, newPassword) => {
    try {
      // Actualizar contraseña en Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      throw error;
    }
  },
  
  changeEmail: async (password, newEmail) => {
    try {
      // Actualizar email en Supabase Auth
      const { error: authError } = await supabase.auth.updateUser({
        email: newEmail
      });
      
      if (authError) throw authError;
      
      // Actualizar en la tabla users
      const { data: userData } = await supabase.auth.getUser();
      
      if (userData?.user) {
        const { error: dbError } = await supabase
          .from('users')
          .update({ email: newEmail, updated_at: new Date() })
          .eq('id', userData.user.id);
          
        if (dbError) throw dbError;
      }
      
      return true;
    } catch (error) {
      console.error('Error al cambiar correo electrónico:', error);
      throw error;
    }
  },
  
  resetPassword: async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error al enviar correo de restablecimiento:', error);
      throw error;
    }
  },
  
  getAllUsers: async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('display_name');
        
      if (error) throw error;
      
      // Adaptar formato para mantener compatibilidad
      return data.map(user => ({
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        role: user.role,
        permissions: user.permissions
      }));
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      throw error;
    }
  },
  
  getUserById: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error) {
        if (error.code === 'PGRST116') return null; // No existe
        throw error;
      }
      
      // Adaptar formato para mantener compatibilidad
      return {
        id: data.id,
        email: data.email,
        displayName: data.display_name,
        role: data.role,
        permissions: data.permissions
      };
    } catch (error) {
      console.error(`Error al obtener usuario ${userId}:`, error);
      throw error;
    }
  },
  
  updateUserPermissions: async (userId, permissions) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          permissions, 
          updated_at: new Date() 
        })
        .eq('id', userId);
        
      if (error) throw error;
      
      return userId;
    } catch (error) {
      console.error(`Error al actualizar permisos del usuario ${userId}:`, error);
      throw error;
    }
  },
  
  hasPermission: async (permission) => {
    try {
      const { data } = await supabase.auth.getUser();
      
      if (!data?.user) {
        return false;
      }
      
      // Obtener datos de permisos desde la tabla users
      const { data: userData, error } = await supabase
        .from('users')
        .select('role, permissions')
        .eq('id', data.user.id)
        .single();
        
      if (error) return false;
      
      // Los administradores tienen todos los permisos
      if (userData.role === 'admin' || userData.permissions?.admin) {
        return true;
      }
      
      // Verificar permiso específico
      return userData.permissions?.[permission] === true;
    } catch (error) {
      console.error(`Error al verificar permiso ${permission}:`, error);
      return false;
    }
  }
};

export default usersService;