import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../api/supabase';
import stockService from '../api/stockService';
import { useAuth } from './AuthContext';

// Crear el contexto de stock
const StockContext = createContext();

export function useStock() {
  return useContext(StockContext);
}

export function StockProvider({ children }) {
  const { currentUser } = useAuth();
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [fumigations, setFumigations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Cargar productos
  const loadProducts = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError('');
      const productsData = await stockService.getAllProducts(filters);
      setProducts(productsData);
      return productsData;
    } catch (error) {
      console.error('Error al cargar productos:', error);
      setError('Error al cargar productos: ' + error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtener un producto por ID
  const getProduct = useCallback(async (productId) => {
    try {
      setError('');
      return await stockService.getProductById(productId);
    } catch (error) {
      console.error(`Error al obtener producto ${productId}:`, error);
      setError(`Error al obtener producto: ${error.message}`);
      throw error;
    }
  }, []);

  // Añadir un producto
  const addProduct = useCallback(async (productData) => {
    try {
      setError('');
      const productId = await stockService.addProduct(productData);
      await loadProducts(); // Recargar productos
      return productId;
    } catch (error) {
      console.error('Error al añadir producto:', error);
      setError('Error al añadir producto: ' + error.message);
      throw error;
    }
  }, [loadProducts]);

  // Actualizar un producto
  const updateProduct = useCallback(async (productId, productData) => {
    try {
      setError('');
      await stockService.updateProduct(productId, productData);
      await loadProducts(); // Recargar productos
      return productId;
    } catch (error) {
      console.error(`Error al actualizar producto ${productId}:`, error);
      setError('Error al actualizar producto: ' + error.message);
      throw error;
    }
  }, [loadProducts]);

  // Eliminar un producto
  const deleteProduct = useCallback(async (productId) => {
    try {
      setError('');
      await stockService.deleteProduct(productId);
      await loadProducts(); // Recargar productos
      return true;
    } catch (error) {
      console.error(`Error al eliminar producto ${productId}:`, error);
      setError('Error al eliminar producto: ' + error.message);
      throw error;
    }
  }, [loadProducts]);

  // Añadir un almacén
  const addWarehouse = useCallback(async (warehouseData) => {
    try {
      setError('');
      // Convertir formato para Supabase
      const dbWarehouseData = {
        name: warehouseData.name,
        location: warehouseData.location,
        type: warehouseData.type || 'Principal',
        field_id: warehouseData.fieldId,
        storage_condition: warehouseData.storageCondition || 'Normal',
        capacity: warehouseData.capacity,
        capacity_unit: warehouseData.capacityUnit || 'm³',
        supervisor: warehouseData.supervisor,
        notes: warehouseData.notes,
        status: warehouseData.status || 'active'
      };
      
      // Insertar almacén
      const { data, error } = await supabase
        .from('warehouses')
        .insert(dbWarehouseData)
        .select();
      
      if (error) throw error;
      
      // Recargar almacenes
      await loadWarehouses();
      
      return data[0].id;
    } catch (error) {
      console.error('Error al añadir almacén:', error);
      setError('Error al añadir almacén: ' + error.message);
      throw error;
    }
  }, []);

  // Actualizar un almacén
  const updateWarehouse = useCallback(async (warehouseId, warehouseData) => {
    try {
      setError('');
      // Convertir formato para Supabase
      const dbWarehouseData = {
        name: warehouseData.name,
        location: warehouseData.location,
        type: warehouseData.type,
        field_id: warehouseData.fieldId,
        storage_condition: warehouseData.storageCondition,
        capacity: warehouseData.capacity,
        capacity_unit: warehouseData.capacityUnit,
        supervisor: warehouseData.supervisor,
        notes: warehouseData.notes,
        status: warehouseData.status,
        updated_at: new Date()
      };
      
      // Actualizar almacén
      const { error } = await supabase
        .from('warehouses')
        .update(dbWarehouseData)
        .eq('id', warehouseId);
      
      if (error) throw error;
      
      // Recargar almacenes
      await loadWarehouses();
      
      return warehouseId;
    } catch (error) {
      console.error(`Error al actualizar almacén ${warehouseId}:`, error);
      setError('Error al actualizar almacén: ' + error.message);
      throw error;
    }
  }, []);

  // Eliminar un almacén
  const deleteWarehouse = useCallback(async (warehouseId) => {
    try {
      setError('');
      // Verificar si el almacén tiene productos
      const { data: stockData, error: stockError } = await supabase
        .from('warehouse_stock')
        .select('product_id')
        .eq('warehouse_id', warehouseId);
      
      if (stockError) throw stockError;
      
      if (stockData && stockData.length > 0) {
        throw new Error('No se puede eliminar el almacén porque contiene productos');
      }
      
      // Eliminar el almacén
      const { error } = await supabase
        .from('warehouses')
        .delete()
        .eq('id', warehouseId);
      
      if (error) throw error;
      
      // Recargar almacenes
      await loadWarehouses();
      
      return true;
    } catch (error) {
      console.error(`Error al eliminar almacén ${warehouseId}:`, error);
      setError('Error al eliminar almacén: ' + error.message);
      throw error;
    }
  }, []);

  // Cargar almacenes
  const loadWarehouses = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const warehousesData = await stockService.getAllWarehouses();
      setWarehouses(warehousesData);
      return warehousesData;
    } catch (error) {
      console.error('Error al cargar almacenes:', error);
      setError('Error al cargar almacenes: ' + error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Aquí implementarías los demás métodos (createTransfer, updateTransferStatus, etc.)

  // Efecto para cargar datos iniciales
  useEffect(() => {
    if (!currentUser) {
      setProducts([]);
      setWarehouses([]);
      setTransfers([]);
      setPurchases([]);
      setFumigations([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Cargar datos iniciales
    Promise.all([
      stockService.getAllProducts(),
      stockService.getAllWarehouses(),
      // También cargar transfers, purchases, fumigations
    ])
      .then(([productsData, warehousesData]) => {
        setProducts(productsData);
        setWarehouses(warehousesData);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error al cargar datos iniciales:', err);
        setError('Error al cargar datos: ' + err.message);
        setLoading(false);
      });

    // Configurar subscripciones para cambios en tiempo real
    const productsSubscription = supabase
      .channel('public:products')
      .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'products' }, 
          () => {
            stockService.getAllProducts().then(setProducts).catch(console.error);
          })
      .subscribe();

    const warehousesSubscription = supabase
      .channel('public:warehouses')
      .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'warehouses' }, 
          () => {
            stockService.getAllWarehouses().then(setWarehouses).catch(console.error);
          })
      .subscribe();

    // Configurar más subscripciones según sea necesario

    // Limpiar subscripciones al desmontar
    return () => {
      supabase.removeChannel(productsSubscription);
      supabase.removeChannel(warehousesSubscription);
      // Limpiar otras subscripciones
    };
  }, [currentUser]);

  // Valor que se proporcionará a través del contexto
  const value = {
    products,
    warehouses,
    transfers,
    purchases,
    fumigations,
    loading,
    error,
    setError,
    loadProducts,
    getProduct,
    addProduct,
    updateProduct,
    deleteProduct,
    addWarehouse,
    updateWarehouse,
    deleteWarehouse,
    loadWarehouses,
    // Incluir los demás métodos que implementes
  };

  return (
    <StockContext.Provider value={value}>
      {children}
    </StockContext.Provider>
  );
}

export default StockContext;