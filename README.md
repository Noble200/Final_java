# AgroGestión

Aplicación de gestión agrícola con sistema de stock centralizado para Windows.

## Características

- Gestión completa de inventario y stock centralizado
- Transferencias entre almacenes
- Compras y recepción de productos
- Registro y seguimiento de fumigaciones
- Administración de campos y lotes
- Generación de reportes
- Sistema de usuarios y permisos

## Requisitos previos

- Node.js (v14 o superior)
- npm (v6 o superior)
- Cuenta de Firebase (Firestore y Authentication)

## Configuración inicial

1. Clona este repositorio:
   ```
   git clone https://tu-repositorio/agro-gestion-app.git
   cd agro-gestion-app
   ```

2. Instala las dependencias:
   ```
   npm install
   ```

3. Configura Firebase:
   - Crea un proyecto en la [consola de Firebase](https://console.firebase.google.com/)
   - Habilita Firestore y Authentication en tu proyecto
   - En Authentication, habilita el proveedor de correo electrónico/contraseña
   - Copia las credenciales de tu proyecto Firebase

4. Configura las variables de entorno:
   - Crea un archivo `.env` en la raíz del proyecto
   - Añade las siguientes variables:
     ```
     REACT_APP_FIREBASE_API_KEY=tu-api-key
     REACT_APP_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
     REACT_APP_FIREBASE_PROJECT_ID=tu-proyecto-id
     REACT_APP_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
     REACT_APP_FIREBASE_MESSAGING_SENDER_ID=tu-sender-id
     REACT_APP_FIREBASE_APP_ID=tu-app-id
     ```

5. Crea un usuario administrador:
   ```
   npm run create-admin
   ```
   
   El script te guiará para crear un usuario administrador con todos los permisos necesarios. También puedes usar los valores predeterminados:
   
   - Email: admin@agrogestion.com
   - Contraseña: Admin123!
   - Nombre: Administrador

   **¡Importante!** Guarda estas credenciales de administrador en un lugar seguro.

## Ejecución en desarrollo

Para iniciar la aplicación en modo desarrollo:

```
npm start
```

Esto iniciará tanto el servidor React como la aplicación Electron.

## Construcción para producción

Para generar una versión de producción:

```
npm run dist
```

Esto creará los archivos de instalación en la carpeta `dist`.

## Sistema de Autenticación

La aplicación utiliza Firebase Authentication para la gestión de usuarios y permisos. Existen tres niveles de acceso:

1. **Administrador**: Tiene acceso completo a todas las funcionalidades de la aplicación.
2. **Usuario con permisos específicos**: Solo puede acceder a las funciones para las que tiene permiso.
3. **Usuario básico**: Solo puede acceder al dashboard.

### Gestión de Usuarios

Los administradores pueden:

- Crear nuevos usuarios
- Asignar permisos específicos
- Cambiar roles de usuario
- Desactivar usuarios

### Permisos disponibles

- `admin`: Acceso completo a todas las funciones
- `dashboard`: Acceso al panel principal
- `products`: Gestión de productos
- `transfers`: Gestión de transferencias
- `purchases`: Gestión de compras
- `fumigations`: Gestión de fumigaciones
- `fields`: Gestión de campos y lotes
- `warehouses`: Gestión de almacenes
- `reports`: Generación de reportes
- `users`: Gestión de usuarios

## Estructura del proyecto

```
agro-gestion-app/
├── electron/                    # Archivos específicos de Electron
├── public/                      # Archivos estáticos
├── scripts/                     # Scripts de utilidad
│   └── createAdmin.js           # Script para crear usuario administrador
├── src/                         # Código fuente de la aplicación
│   ├── api/                     # Servicios y API
│   │   ├── firebase.js          # Configuración de Firebase
│   │   ├── localStorageService.js # Servicio de almacenamiento local
│   │   ├── stockService.js      # Servicio de stock centralizado
│   │   └── usersService.js      # Servicio de gestión de usuarios
│   ├── components/              # Componentes reutilizables
│   ├── contexts/                # Contextos de React
│   │   ├── AuthContext.js       # Contexto de autenticación
│   │   └── StockContext.js      # Contexto de stock
│   ├── hooks/                   # Custom hooks
│   ├── pages/                   # Páginas/Paneles de la aplicación
│   │   ├── Login.js             # Página de inicio de sesión
│   │   └── ...                  # Otros paneles
│   └── theme/                   # Configuración de temas
└── package.json                 # Dependencias y scripts
```

## Solución de problemas

### Problemas de autenticación

Si tienes problemas para iniciar sesión:

1. Verifica que has creado un usuario administrador con `npm run create-admin`
2. Asegúrate de que Firebase Authentication está correctamente configurado en tu proyecto Firebase
3. Comprueba que las variables de entorno están correctamente configuradas
4. Revisa los logs de la consola para ver errores específicos

### Problemas con Firebase

1. Verifica que las reglas de seguridad de Firestore permiten lectura/escritura autenticada
2. Asegúrate de que el plan de Firebase es adecuado para tu uso (el plan Spark gratuito es suficiente para desarrollo)

## Licencia

[MIT](LICENSE)