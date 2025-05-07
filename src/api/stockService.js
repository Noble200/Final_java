import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';

const stockService = {
  getAllProducts: async (options = {}) => {
    try {
      const { category, minStock, searchTerm } = options;
      
      // Consulta principal
      let query = supabase.from('products').select('*');
      
      // Aplicar filtros
      if (category) {
        query = query.eq('category', category);
      }
      
      if (minStock) {
        query = query.lte('quantity', minStock);
      }
      
      // Ordenar por nombre
      query = query.order('name');
      
      // Ejecutar consulta
      const { data: products, error } = await query;
      
      if (error) throw error;
      
      // Si no hay productos, devolver array vacío
      if (!products || products.length === 0) {
        return [];
      }
      
      // Obtener stock por almacén
      const { data: warehouseStock, error: stockError } = await supabase
        .from('warehouse_stock')
        .select('*')
        .in('product_id', products.map(p => p.id));
      
      if (stockError) throw stockError;
      
      // Formatear productos con su stock por almacén
      let formattedProducts = products.map(product => {
        const productStock = warehouseStock.filter(s => s.product_id === product.id);
        
        // Construir objeto de stock por almacén
        const warehouseStockObj = {};
        productStock.forEach(stock => {
          warehouseStockObj[stock.warehouse_id] = stock.quantity;
        });
        
        // Asegurar que todos los campos esperados estén presentes y mapeados correctamente
        const formattedProduct = {
          id: product.id,
          name: product.name,
          category: product.category,
          quantity: product.quantity || 0,
          // Mapeo explícito de estos campos problemáticos
          minStock: product.min_stock || 0, // PostgreSQL usa snake_case
          unitOfMeasure: product.unit_of_measure || 'unidad', // Mapeo explícito
          lotNumber: product.lot_number || '', // Mapeo explícito
          notes: product.notes || '',
          warehouseStock: warehouseStockObj
        };
        
        // Formatear fecha de vencimiento si existe
        if (product.expiry_date) {
          const expiryDate = new Date(product.expiry_date);
          formattedProduct.expiryDate = {
            seconds: Math.floor(expiryDate.getTime() / 1000),
            nanoseconds: 0
          };
        }
        
        // Formatear fechas de creación y actualización
        if (product.created_at) {
          const createdAt = new Date(product.created_at);
          formattedProduct.createdAt = {
            seconds: Math.floor(createdAt.getTime() / 1000),
            nanoseconds: 0
          };
        }
        
        if (product.updated_at) {
          const updatedAt = new Date(product.updated_at);
          formattedProduct.updatedAt = {
            seconds: Math.floor(updatedAt.getTime() / 1000),
            nanoseconds: 0
          };
        }
        
        console.log('Producto formateado:', formattedProduct); // Para depuración
        
        return formattedProduct;
      });
      
      // Filtrar por término de búsqueda si se proporciona
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        formattedProducts = formattedProducts.filter(product => 
          product.name.toLowerCase().includes(term) || 
          product.id.toLowerCase().includes(term) ||
          (product.lotNumber && product.lotNumber.toLowerCase().includes(term))
        );
      }
      
      return formattedProducts;
    } catch (error) {
      console.error('Error al obtener productos:', error);
      throw error;
    }
  },
  
  getProductById: async (productId) => {
    try {
      const { data: product, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') return null; // No existe
        throw error;
      }
      
      // Obtener stock por almacén
      const { data: warehouseStock, error: stockError } = await supabase
        .from('warehouse_stock')
        .select('*')
        .eq('product_id', productId);
      
      if (stockError) throw stockError;
      
      // Formatear producto con su stock por almacén
      const warehouseStockObj = {};
      warehouseStock.forEach(stock => {
        warehouseStockObj[stock.warehouse_id] = stock.quantity;
      });
      
      // Convertir nombres de campo y fechas - mapeo explícito de todos los campos
      const formattedProduct = {
        id: product.id,
        name: product.name,
        category: product.category,
        quantity: product.quantity || 0,
        minStock: product.min_stock || 0, // Mapeo correcto
        unitOfMeasure: product.unit_of_measure || 'unidad', // Mapeo correcto
        lotNumber: product.lot_number || '', // Mapeo correcto
        notes: product.notes || '',
        warehouseStock: warehouseStockObj
      };
      
      // Formatear fecha de vencimiento si existe
      if (product.expiry_date) {
        const expiryDate = new Date(product.expiry_date);
        formattedProduct.expiryDate = {
          seconds: Math.floor(expiryDate.getTime() / 1000),
          nanoseconds: 0
        };
      }
      
      // Formatear fechas de creación y actualización
      if (product.created_at) {
        const createdAt = new Date(product.created_at);
        formattedProduct.createdAt = {
          seconds: Math.floor(createdAt.getTime() / 1000),
          nanoseconds: 0
        };
      }
      
      if (product.updated_at) {
        const updatedAt = new Date(product.updated_at);
        formattedProduct.updatedAt = {
          seconds: Math.floor(updatedAt.getTime() / 1000),
          nanoseconds: 0
        };
      }
      
      console.log('Producto individual formateado:', formattedProduct); // Para depuración
      
      return formattedProduct;
    } catch (error) {
      console.error(`Error al obtener producto ${productId}:`, error);
      throw error;
    }
  },
  
  addProduct: async (productData) => {
    try {
      // Validaciones básicas
      if (!productData.name) {
        throw new Error('El nombre del producto es obligatorio');
      }
      
      console.log("Datos del producto a insertar:", productData); // Para depuración
      
      // Convertir formato de datos para PostgreSQL
      const dbProductData = {
        name: productData.name,
        category: productData.category,
        quantity: productData.quantity || 0,
        min_stock: productData.minStock || 0, // Asegurarse de mapear correctamente
        unit_of_measure: productData.unitOfMeasure || 'unidad', // Asegurarse de mapear correctamente
        lot_number: productData.lotNumber || null, // Asegurarse de incluir
        notes: productData.notes || null
      };
      
      // Mostrar datos a insertar para depuración
      console.log("Datos convertidos para la BD:", dbProductData);
      
      // Convertir fecha de vencimiento si existe
      if (productData.expiryDate) {
        // Si es objeto de convertir a Date
        if (productData.expiryDate.seconds) {
          dbProductData.expiry_date = new Date(productData.expiryDate.seconds * 1000);
        } else {
          dbProductData.expiry_date = new Date(productData.expiryDate);
        }
      }
      
      // Insertar producto en la base de datos
      const { data: product, error } = await supabase
        .from('products')
        .insert(dbProductData)
        .select() // Para obtener el registro insertado
        .single();
      
      if (error) {
        console.error("Error al insertar producto:", error);
        throw error;
      }
      
      console.log("Producto insertado:", product); // Para depuración
      
      // Insertar stock en almacenes
      if (productData.warehouseStock && Object.keys(productData.warehouseStock).length > 0) {
        const stockInserts = Object.entries(productData.warehouseStock).map(([warehouseId, quantity]) => ({
          product_id: product.id,
          warehouse_id: warehouseId,
          quantity: quantity
        }));
        
        console.log("Stock a insertar:", stockInserts); // Para depuración
        
        const { error: stockError } = await supabase
          .from('warehouse_stock')
          .insert(stockInserts);
        
        if (stockError) {
          console.error("Error al insertar stock:", stockError);
          throw stockError;
        }
      }
      
      // Registrar en historial
      await stockService.addStockHistoryEntry({
        product_id: product.id,
        type: 'create',
        previous_quantity: 0,
        new_quantity: productData.quantity || 0,
        warehouse_id: Object.keys(productData.warehouseStock || {})[0] || null,
        notes: 'Producto creado'
      });
      
      return product.id;
    } catch (error) {
      console.error('Error al añadir producto:', error);
      throw error;
    }
  },
  
  updateProduct: async (productId, productData) => {
    try {
      // Validaciones
      if (!productId) {
        throw new Error('Se requiere el ID del producto');
      }
      
      // Obtener datos actuales para comparación
      const { data: currentProduct, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Convertir formato de datos para PostgreSQL
      const dbProductData = {
        name: productData.name,
        category: productData.category,
        quantity: productData.quantity,
        min_stock: productData.minStock,
        unit_of_measure: productData.unitOfMeasure,
        lot_number: productData.lotNumber,
        notes: productData.notes,
        updated_at: new Date()
      };
      
      // Convertir fecha de vencimiento si existe
      if (productData.expiryDate) {
        // Si es objeto de convertir a Date
        if (productData.expiryDate.seconds) {
          dbProductData.expiry_date = new Date(productData.expiryDate.seconds * 1000);
        } else {
          dbProductData.expiry_date = new Date(productData.expiryDate);
        }
      }
      
      // Actualizar producto en la base de datos
      const { error: updateError } = await supabase
        .from('products')
        .update(dbProductData)
        .eq('id', productId);
      
      if (updateError) throw updateError;
      
      // Actualizar stock por almacén
      if (productData.warehouseStock) {
        // Obtener stock actual
        const { data: currentStock, error: stockFetchError } = await supabase
          .from('warehouse_stock')
          .select('*')
          .eq('product_id', productId);
        
        if (stockFetchError) throw stockFetchError;
        
        // Mapeo de almacenes actuales
        const currentWarehouses = currentStock.reduce((map, item) => {
          map[item.warehouse_id] = item;
          return map;
        }, {});
        
        // Procesar cada almacén en los nuevos datos
        for (const [warehouseId, quantity] of Object.entries(productData.warehouseStock)) {
          const quantityValue = quantity === '' ? 0 : Number(quantity);
          
          if (currentWarehouses[warehouseId]) {
            // Actualizar existente si cambió
            if (currentWarehouses[warehouseId].quantity !== quantityValue) {
              const { error } = await supabase
                .from('warehouse_stock')
                .update({ quantity: quantityValue })
                .eq('product_id', productId)
                .eq('warehouse_id', warehouseId);
              
              if (error) throw error;
            }
          } else if (quantityValue > 0) { // Solo insertar si la cantidad es mayor que 0
            // Insertar nuevo
            const { error } = await supabase
              .from('warehouse_stock')
              .insert({
                product_id: productId,
                warehouse_id: warehouseId,
                quantity: quantityValue
              });
            
            if (error) throw error;
          }
        }
        
        // Eliminar los almacenes que ya no están en los nuevos datos
        for (const warehouseId in currentWarehouses) {
          if (!(warehouseId in productData.warehouseStock)) {
            const { error } = await supabase
              .from('warehouse_stock')
              .delete()
              .eq('product_id', productId)
              .eq('warehouse_id', warehouseId);
            
            if (error) throw error;
          }
        }
      }
      
      // Registrar en historial si cambió la cantidad
      if (productData.quantity !== currentProduct.quantity) {
        await stockService.addStockHistoryEntry({
          product_id: productId,
          type: 'update',
          previous_quantity: currentProduct.quantity || 0,
          new_quantity: productData.quantity || 0,
          notes: 'Actualización manual de cantidad'
        });
      }
      
      return productId;
    } catch (error) {
      console.error(`Error al actualizar producto ${productId}:`, error);
      throw error;
    }
  },
  
  deleteProduct: async (productId) => {
    try {
      // Verificar que exista el producto
      const { data: product, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();
      
      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          throw new Error(`El producto ${productId} no existe`);
        }
        throw fetchError;
      }
      
      // Eliminar stock por almacén
      const { error: stockDeleteError } = await supabase
        .from('warehouse_stock')
        .delete()
        .eq('product_id', productId);
      
      if (stockDeleteError) throw stockDeleteError;
      
      // Registrar en historial antes de eliminar
      await stockService.addStockHistoryEntry({
        product_id: productId,
        type: 'delete',
        previous_quantity: product.quantity || 0,
        new_quantity: 0,
        notes: 'Producto eliminado'
      });
      
      // Eliminar el producto
      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);
      
      if (deleteError) throw deleteError;
      
      return true;
    } catch (error) {
      console.error(`Error al eliminar producto ${productId}:`, error);
      throw error;
    }
  },
  
  // Implementar el resto de métodos (transferencias, compras, etc.) siguiendo el mismo patrón...
  
  // Método para registrar entradas en el historial de stock
  addStockHistoryEntry: async (entryData) => {
    try {
      // Convertir formato para PostgreSQL
      const dbEntryData = {
        product_id: entryData.productId || entryData.product_id,
        type: entryData.type,
        previous_quantity: entryData.previousQuantity || entryData.previous_quantity || 0,
        new_quantity: entryData.newQuantity || entryData.new_quantity || 0,
        warehouse_id: entryData.warehouseId || entryData.warehouse_id,
        source_warehouse_id: entryData.sourceWarehouseId || entryData.source_warehouse_id,
        target_warehouse_id: entryData.targetWarehouseId || entryData.target_warehouse_id,
        transfer_id: entryData.transferId || entryData.transfer_id,
        fumigation_id: entryData.fumigationId || entryData.fumigation_id,
        purchase_id: entryData.purchaseId || entryData.purchase_id,
        user_id: entryData.userId || entryData.user_id,
        notes: entryData.notes
      };
      
      // Insertar en la base de datos
      const { data, error } = await supabase
        .from('stock_history')
        .insert(dbEntryData)
        .select();
      
      if (error) throw error;
      
      return data[0].id;
    } catch (error) {
      console.error('Error al añadir entrada al historial de stock:', error);
      throw error;
    }
  },
  
  // Método para obtener el historial de stock
  getStockHistory: async (options = {}) => {
    try {
      const { productId, warehouseId, fromDate, toDate, type } = options;
      
      // Construir consulta
      let query = supabase.from('stock_history').select('*');
      
      // Aplicar filtros
      if (productId) {
        query = query.eq('product_id', productId);
      }
      
      if (warehouseId) {
        query = query.eq('warehouse_id', warehouseId);
      }
      
      if (type) {
        query = query.eq('type', type);
      }
      
      if (fromDate) {
        query = query.gte('timestamp', fromDate.toISOString());
      }
      
      if (toDate) {
        query = query.lte('timestamp', toDate.toISOString());
      }
      
      // Ordenar por fecha descendente
      query = query.order('timestamp', { ascending: false });
      
      // Ejecutar consulta
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Formatear para mantener compatibilidad
      return data.map(entry => ({
        id: entry.id,
        productId: entry.product_id,
        type: entry.type,
        previousQuantity: entry.previous_quantity,
        newQuantity: entry.new_quantity,
        warehouseId: entry.warehouse_id,
        sourceWarehouseId: entry.source_warehouse_id,
        targetWarehouseId: entry.target_warehouse_id,
        transferId: entry.transfer_id,
        fumigationId: entry.fumigation_id,
        purchaseId: entry.purchase_id,
        userId: entry.user_id,
        notes: entry.notes,
        timestamp: {
          seconds: Math.floor(new Date(entry.timestamp).getTime() / 1000),
          nanoseconds: 0
        }
      }));
    } catch (error) {
      console.error('Error al obtener historial de stock:', error);
      throw error;
    }
  },
  
  // Método para obtener todos los almacenes
  getAllWarehouses: async () => {
    try {
      const { data, error } = await supabase
        .from('warehouses')
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      // Formatear para mantener compatibilidad
      return data.map(warehouse => ({
        id: warehouse.id,
        name: warehouse.name,
        location: warehouse.location,
        type: warehouse.type,
        fieldId: warehouse.field_id,
        storageCondition: warehouse.storage_condition,
        capacity: warehouse.capacity,
        capacityUnit: warehouse.capacity_unit,
        supervisor: warehouse.supervisor,
        notes: warehouse.notes,
        status: warehouse.status,
        createdAt: warehouse.created_at ? {
          seconds: Math.floor(new Date(warehouse.created_at).getTime() / 1000),
          nanoseconds: 0
        } : null,
        updatedAt: warehouse.updated_at ? {
          seconds: Math.floor(new Date(warehouse.updated_at).getTime() / 1000),
          nanoseconds: 0
        } : null
      }));
    } catch (error) {
      console.error('Error al obtener almacenes:', error);
      throw error;
    }
  },
  
  createTransfer: async (transferData) => {
    try {
      const {
        sourceWarehouseId,
        targetWarehouseId,
        products,
        status = 'pending',
        notes
      } = transferData;
      
      if (!sourceWarehouseId || !targetWarehouseId) {
        throw new Error('Se requieren los IDs de almacén origen y destino');
      }
      
      if (!products || !Array.isArray(products) || products.length === 0) {
        throw new Error('Se requiere al menos un producto para transferir');
      }
      
      // Verificar que hay suficiente stock en el almacén origen
      for (const product of products) {
        const { productId, quantity } = product;
        const { data, error } = await supabase
          .from('warehouse_stock')
          .select('quantity')
          .eq('product_id', productId)
          .eq('warehouse_id', sourceWarehouseId)
          .single();
        
        if (error) {
          throw new Error(`No se encontró el producto ${productId} en el almacén origen`);
        }
        
        if (data.quantity < quantity) {
          // Obtener nombre del producto para el mensaje de error
          const { data: productData } = await supabase
            .from('products')
            .select('name')
            .eq('id', productId)
            .single();
          
          throw new Error(`Stock insuficiente para el producto ${productData?.name || productId} en el almacén origen`);
        }
      }
      
      // Crear la transferencia
      const transferId = uuidv4();
      const dbTransferData = {
        id: transferId,
        source_warehouse_id: sourceWarehouseId,
        target_warehouse_id: targetWarehouseId,
        products: products,
        status,
        notes,
        completed_at: status === 'completed' ? new Date() : null
      };
      
      const { error: transferError } = await supabase
        .from('transfers')
        .insert(dbTransferData);
      
      if (transferError) throw transferError;
      
      // Si el estado es 'completed', actualizar el stock inmediatamente
      if (status === 'completed') {
        // Iniciar una "transacción manual" - hacemos múltiples operaciones
        // que deben completarse todas o ninguna
        for (const product of products) {
          const { productId, quantity } = product;
          
          // Actualizar stock en almacén origen (reducir)
          const { data: sourceStock, error: sourceStockError } = await supabase
            .from('warehouse_stock')
            .select('quantity')
            .eq('product_id', productId)
            .eq('warehouse_id', sourceWarehouseId)
            .single();
          
          if (sourceStockError) throw sourceStockError;
          
          const { error: updateSourceError } = await supabase
            .from('warehouse_stock')
            .update({ quantity: sourceStock.quantity - quantity })
            .eq('product_id', productId)
            .eq('warehouse_id', sourceWarehouseId);
          
          if (updateSourceError) throw updateSourceError;
          
          // Verificar si existe stock en almacén destino
          const { data: targetStockData, error: targetStockError } = await supabase
            .from('warehouse_stock')
            .select('quantity')
            .eq('product_id', productId)
            .eq('warehouse_id', targetWarehouseId)
            .maybeSingle();
          
          if (targetStockError) throw targetStockError;
          
          if (targetStockData) {
            // Actualizar stock existente en almacén destino
            const { error: updateTargetError } = await supabase
              .from('warehouse_stock')
              .update({ quantity: targetStockData.quantity + quantity })
              .eq('product_id', productId)
              .eq('warehouse_id', targetWarehouseId);
            
            if (updateTargetError) throw updateTargetError;
          } else {
            // Crear nuevo registro en warehouse_stock para el almacén destino
            const { error: insertTargetError } = await supabase
              .from('warehouse_stock')
              .insert({
                product_id: productId,
                warehouse_id: targetWarehouseId,
                quantity: quantity
              });
            
            if (insertTargetError) throw insertTargetError;
          }
          
          // Añadir al historial de movimientos
          await stockService.addStockHistoryEntry({
            product_id: productId,
            transfer_id: transferId,
            type: 'transfer',
            source_warehouse_id: sourceWarehouseId,
            target_warehouse_id: targetWarehouseId,
            quantity: quantity,
            notes: notes || 'Transferencia entre almacenes'
          });
        }
      }
      
      return transferId;
    } catch (error) {
      console.error('Error al crear transferencia:', error);
      throw error;
    }
  },
  
  updateTransferStatus: async (transferId, newStatus, notes) => {
    try {
      // Obtener la transferencia actual
      const { data: transfer, error: fetchError } = await supabase
        .from('transfers')
        .select('*')
        .eq('id', transferId)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Si ya está en el estado deseado, no hacer nada
      if (transfer.status === newStatus) {
        return;
      }
      
      // Si la transferencia ya está completa o cancelada, no permitir cambios
      if (transfer.status === 'completed' || transfer.status === 'cancelled') {
        throw new Error(`No se puede cambiar el estado de una transferencia que ya está ${transfer.status}`);
      }
      
      // Actualizar el estado de la transferencia
      const updateData = {
        status: newStatus,
        notes: notes || transfer.notes,
        updated_at: new Date(),
        completed_at: newStatus === 'completed' ? new Date() : transfer.completed_at
      };
      
      const { error: updateError } = await supabase
        .from('transfers')
        .update(updateData)
        .eq('id', transferId);
      
      if (updateError) throw updateError;
      
      // Si el nuevo estado es 'completed', actualizar el stock
      if (newStatus === 'completed') {
        // Implementar actualizaciones similares a las de createTransfer
        // pero verificando que la transferencia sea válida primero
        for (const product of transfer.products) {
          const { productId, quantity } = product;
          
          // Actualizar stock en almacén origen (reducir)
          const { data: sourceStock, error: sourceStockError } = await supabase
            .from('warehouse_stock')
            .select('quantity')
            .eq('product_id', productId)
            .eq('warehouse_id', transfer.source_warehouse_id)
            .single();
          
          if (sourceStockError) throw sourceStockError;
          
          if (sourceStock.quantity < quantity) {
            // Obtener nombre del producto para el mensaje de error
            const { data: productData } = await supabase
              .from('products')
              .select('name')
              .eq('id', productId)
              .single();
            
            throw new Error(`Stock insuficiente para el producto ${productData?.name || productId} en el almacén origen`);
          }
          
          const { error: updateSourceError } = await supabase
            .from('warehouse_stock')
            .update({ quantity: sourceStock.quantity - quantity })
            .eq('product_id', productId)
            .eq('warehouse_id', transfer.source_warehouse_id);
          
          if (updateSourceError) throw updateSourceError;
          
          // Verificar si existe stock en almacén destino
          const { data: targetStockData, error: targetStockError } = await supabase
            .from('warehouse_stock')
            .select('quantity')
            .eq('product_id', productId)
            .eq('warehouse_id', transfer.target_warehouse_id)
            .maybeSingle();
          
          if (targetStockError) throw targetStockError;
          
          if (targetStockData) {
            // Actualizar stock existente en almacén destino
            const { error: updateTargetError } = await supabase
              .from('warehouse_stock')
              .update({ quantity: targetStockData.quantity + quantity })
              .eq('product_id', productId)
              .eq('warehouse_id', transfer.target_warehouse_id);
            
            if (updateTargetError) throw updateTargetError;
          } else {
            // Crear nuevo registro en warehouse_stock para el almacén destino
            const { error: insertTargetError } = await supabase
              .from('warehouse_stock')
              .insert({
                product_id: productId,
                warehouse_id: transfer.target_warehouse_id,
                quantity: quantity
              });
            
            if (insertTargetError) throw insertTargetError;
          }
          
          // Añadir al historial
          await stockService.addStockHistoryEntry({
            product_id: productId,
            transfer_id: transferId,
            type: 'transfer_completed',
            source_warehouse_id: transfer.source_warehouse_id,
            target_warehouse_id: transfer.target_warehouse_id,
            quantity: quantity,
            notes: notes || 'Transferencia completada'
          });
        }
      }
      
      // Si el nuevo estado es 'cancelled', registrar en el historial
      if (newStatus === 'cancelled') {
        for (const product of transfer.products) {
          await stockService.addStockHistoryEntry({
            product_id: product.productId,
            transfer_id: transferId,
            type: 'transfer_cancelled',
            source_warehouse_id: transfer.source_warehouse_id,
            target_warehouse_id: transfer.target_warehouse_id,
            quantity: product.quantity,
            notes: notes || 'Transferencia cancelada'
          });
        }
      }
      
      return transferId;
    } catch (error) {
      console.error(`Error al actualizar estado de transferencia ${transferId}:`, error);
      throw error;
    }
  },
  
  createPurchase: async (purchaseData) => {
    try {
      const {
        supplier,
        products,
        invoice,
        shippingCost,
        notes
      } = purchaseData;
      
      if (!products || !Array.isArray(products) || products.length === 0) {
        throw new Error('Se requiere al menos un producto para la compra');
      }
      
      if (!invoice) {
        throw new Error('Se requiere el número de factura');
      }
      
      // Calcular costo total
      const totalProductCost = products.reduce((sum, product) => 
        sum + (product.quantity * product.unitPrice), 0);
      const totalCost = totalProductCost + (shippingCost || 0);
      
      // Preparar los productos con estado inicial
      const productsWithStatus = products.map(product => ({
        ...product,
        received: 0,
        status: 'pending'
      }));
      
      // Crear la compra
      const purchaseId = uuidv4();
      const dbPurchaseData = {
        id: purchaseId,
        supplier,
        products: productsWithStatus,
        invoice,
        shipping_cost: shippingCost || 0,
        total_cost: totalCost,
        status: 'pending',
        notes
      };
      
      const { error } = await supabase
        .from('purchases')
        .insert(dbPurchaseData);
      
      if (error) throw error;
      
      // Registrar en el historial
      const { error: historyError } = await supabase
        .from('purchase_history')
        .insert({
          purchase_id: purchaseId,
          type: 'create',
          details: dbPurchaseData,
          notes: notes || 'Compra creada'
        });
      
      if (historyError) throw historyError;
      
      return purchaseId;
    } catch (error) {
      console.error('Error al crear compra:', error);
      throw error;
    }
  },
  
  receivePurchaseProducts: async (receiveData) => {
    try {
      const {
        purchaseId,
        warehouseId,
        products,
        notes
      } = receiveData;
      
      if (!purchaseId || !warehouseId) {
        throw new Error('Se requieren el ID de compra y el ID de almacén');
      }
      
      if (!products || !Array.isArray(products) || products.length === 0) {
        throw new Error('Se requiere al menos un producto para recibir');
      }
      
      // Obtener la compra
      const { data: purchase, error: fetchError } = await supabase
        .from('purchases')
        .select('*')
        .eq('id', purchaseId)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Verificar que los productos existen en la compra
      const updatedProducts = [...purchase.products];
      for (const receivedProduct of products) {
        const { productId, quantity } = receivedProduct;
        
        const purchaseProductIndex = updatedProducts.findIndex(p => p.productId === productId);
        if (purchaseProductIndex === -1) {
          throw new Error(`El producto ${productId} no existe en la compra ${purchaseId}`);
        }
        
        const purchaseProduct = updatedProducts[purchaseProductIndex];
        const pendingQuantity = purchaseProduct.quantity - purchaseProduct.received;
        if (quantity > pendingQuantity) {
          throw new Error(`La cantidad recibida (${quantity}) para el producto ${productId} excede la cantidad pendiente (${pendingQuantity})`);
        }
        
        // Actualizar la cantidad recibida en la compra
        updatedProducts[purchaseProductIndex].received += quantity;
        
        // Actualizar el estado del producto
        if (updatedProducts[purchaseProductIndex].received === updatedProducts[purchaseProductIndex].quantity) {
          updatedProducts[purchaseProductIndex].status = 'completed';
        } else {
          updatedProducts[purchaseProductIndex].status = 'partial';
        }
        
        // Actualizar el stock del producto
        // Primero verificar si existe el producto
        const { data: productExists, error: productCheckError } = await supabase
          .from('products')
          .select('id')
          .eq('id', productId)
          .maybeSingle();
        
        if (productCheckError) throw productCheckError;
        
        if (productExists) {
          // Si el producto existe, actualizar su stock
          // Primero verificar si ya tiene stock en este almacén
          const { data: warehouseStock, error: stockCheckError } = await supabase
            .from('warehouse_stock')
            .select('quantity')
            .eq('product_id', productId)
            .eq('warehouse_id', warehouseId)
            .maybeSingle();
          
          if (stockCheckError) throw stockCheckError;
          
          if (warehouseStock) {
            // Actualizar stock existente
            const { error: updateStockError } = await supabase
              .from('warehouse_stock')
              .update({ quantity: warehouseStock.quantity + quantity })
              .eq('product_id', productId)
              .eq('warehouse_id', warehouseId);
            
            if (updateStockError) throw updateStockError;
          } else {
            // Crear nuevo registro de stock
            const { error: insertStockError } = await supabase
              .from('warehouse_stock')
              .insert({
                product_id: productId,
                warehouse_id: warehouseId,
                quantity: quantity
              });
            
            if (insertStockError) throw insertStockError;
          }
          
          // Actualizar la cantidad total del producto
          const { data: productData, error: getProductError } = await supabase
            .from('products')
            .select('quantity')
            .eq('id', productId)
            .single();
          
          if (getProductError) throw getProductError;
          
          const { error: updateProductError } = await supabase
            .from('products')
            .update({ 
              quantity: productData.quantity + quantity,
              updated_at: new Date()
            })
            .eq('id', productId);
          
          if (updateProductError) throw updateProductError;
        } else {
          // Si el producto no existe, crearlo
          const newProductData = {
            id: productId,
            name: receivedProduct.name || 'Producto sin nombre',
            category: receivedProduct.category || 'Sin categoría',
            quantity: quantity,
            min_stock: 0,
            unit_of_measure: receivedProduct.unitOfMeasure || 'unidad'
          };
          
          const { error: insertProductError } = await supabase
            .from('products')
            .insert(newProductData);
          
          if (insertProductError) throw insertProductError;
          
          // Crear stock para el nuevo producto
          const { error: insertStockError } = await supabase
            .from('warehouse_stock')
            .insert({
              product_id: productId,
              warehouse_id: warehouseId,
              quantity: quantity
            });
          
          if (insertStockError) throw insertStockError;
        }
        
        // Añadir al historial de stock
        await stockService.addStockHistoryEntry({
          product_id: productId,
          purchase_id: purchaseId,
          type: 'purchase_receive',
          warehouse_id: warehouseId,
          quantity: quantity,
          notes: notes || 'Recepción de productos de compra'
        });
      }
      
      // Determinar si la compra está completamente recibida
      const allCompleted = updatedProducts.every(p => p.status === 'completed');
      const purchaseStatus = allCompleted ? 'completed' : 'partial';
      
      // Actualizar la compra
      const { error: updatePurchaseError } = await supabase
        .from('purchases')
        .update({
          products: updatedProducts,
          status: purchaseStatus,
          updated_at: new Date(),
          completed_at: allCompleted ? new Date() : null
        })
        .eq('id', purchaseId);
      
      if (updatePurchaseError) throw updatePurchaseError;
      
      // Registrar en el historial de compras
      const { error: historyError } = await supabase
        .from('purchase_history')
        .insert({
          purchase_id: purchaseId,
          type: 'receive',
          warehouse_id: warehouseId,
          products: products.map(p => ({ productId: p.productId, quantity: p.quantity })),
          status: purchaseStatus,
          notes: notes || 'Recepción de productos'
        });
      
      if (historyError) throw historyError;
      
      return purchaseId;
    } catch (error) {
      console.error('Error al recibir productos de compra:', error);
      throw error;
    }
  },
  
  // Continúa implementando el resto de los métodos siguiendo el mismo patrón...
  
  getAllFields: async () => {
    try {
      const { data, error } = await supabase
        .from('fields')
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      // Transformar datos a formato compatible
      return data.map(field => ({
        id: field.id,
        name: field.name,
        location: field.location,
        area: field.area,
        areaUnit: field.area_unit,
        owner: field.owner,
        notes: field.notes,
        lots: field.lots || [],
        createdAt: field.created_at ? {
          seconds: Math.floor(new Date(field.created_at).getTime() / 1000),
          nanoseconds: 0
        } : null,
        updatedAt: field.updated_at ? {
          seconds: Math.floor(new Date(field.updated_at).getTime() / 1000),
          nanoseconds: 0
        } : null
      }));
    } catch (error) {
      console.error('Error al obtener campos:', error);
      throw error;
    }
  },
  
  addField: async (fieldData) => {
    try {
      // Validaciones básicas
      if (!fieldData.name) {
        throw new Error('El nombre del campo es obligatorio');
      }
      
      // Convertir formato para Supabase
      const dbFieldData = {
        name: fieldData.name,
        location: fieldData.location,
        area: fieldData.area,
        area_unit: fieldData.areaUnit || 'ha',
        owner: fieldData.owner,
        notes: fieldData.notes,
        lots: fieldData.lots || []
      };
      
      // Insertar campo
      const { data, error } = await supabase
        .from('fields')
        .insert(dbFieldData)
        .select();
      
      if (error) throw error;
      
      return data[0].id;
    } catch (error) {
      console.error('Error al añadir campo:', error);
      throw error;
    }
  },
  
  updateField: async (fieldId, fieldData) => {
    try {
      // Validaciones básicas
      if (!fieldData.name) {
        throw new Error('El nombre del campo es obligatorio');
      }
      
      // Convertir formato para Supabase
      const dbFieldData = {
        name: fieldData.name,
        location: fieldData.location,
        area: fieldData.area,
        area_unit: fieldData.areaUnit,
        owner: fieldData.owner,
        notes: fieldData.notes,
        lots: fieldData.lots,
        updated_at: new Date()
      };
      
      // Actualizar campo
      const { error } = await supabase
        .from('fields')
        .update(dbFieldData)
        .eq('id', fieldId);
      
      if (error) throw error;
      
      return fieldId;
    } catch (error) {
      console.error(`Error al actualizar campo ${fieldId}:`, error);
      throw error;
    }
  },
  
  addLotToField: async (fieldId, lotData) => {
    try {
      // Validaciones básicas
      if (!lotData.name) {
        throw new Error('El nombre del lote es obligatorio');
      }
      
      // Obtener campo actual
      const { data: field, error: fetchError } = await supabase
        .from('fields')
        .select('lots')
        .eq('id', fieldId)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Generar ID para el lote
      const lotId = uuidv4();
      
      // Añadir lote al campo
      const lots = field.lots || [];
      lots.push({
        id: lotId,
        ...lotData,
        createdAt: new Date()
      });
      
      // Actualizar campo
      const { error } = await supabase
        .from('fields')
        .update({ 
          lots, 
          updated_at: new Date() 
        })
        .eq('id', fieldId);
      
      if (error) throw error;
      
      return lotId;
    } catch (error) {
      console.error(`Error al añadir lote al campo ${fieldId}:`, error);
      throw error;
    }
  },
  
  updateLot: async (fieldId, lotId, lotData) => {
    try {
      // Obtener campo actual
      const { data: field, error: fetchError } = await supabase
        .from('fields')
        .select('lots')
        .eq('id', fieldId)
        .single();
      
      if (fetchError) throw fetchError;
      
      const lots = field.lots || [];
      
      // Encontrar el lote
      const lotIndex = lots.findIndex(lot => lot.id === lotId);
      if (lotIndex === -1) {
        throw new Error(`El lote ${lotId} no existe en el campo ${fieldId}`);
      }
      
      // Actualizar el lote
      lots[lotIndex] = {
        ...lots[lotIndex],
        ...lotData,
        updatedAt: new Date()
      };
      
      // Actualizar campo
      const { error } = await supabase
        .from('fields')
        .update({ 
          lots, 
          updated_at: new Date() 
        })
        .eq('id', fieldId);
      
      if (error) throw error;
      
      return lotId;
    } catch (error) {
      console.error(`Error al actualizar lote ${lotId} en campo ${fieldId}:`, error);
      throw error;
    }
  },
  
  generateStockReport: async (options = {}) => {
    try {
      const { warehouseId, categoryFilter } = options;
      
      // Obtener productos
      let query = supabase.from('products').select('*');
      
      if (categoryFilter) {
        query = query.eq('category', categoryFilter);
      }
      
      const { data: products, error } = await query;
      
      if (error) throw error;
      
      // Obtener stock por almacén para todos los productos
      const { data: warehouseStock, error: stockError } = await supabase
        .from('warehouse_stock')
        .select('*');
      
      if (stockError) throw stockError;
      
      // Añadir stock por almacén a cada producto
      const productsWithStock = products.map(product => {
        const productStock = warehouseStock.filter(s => s.product_id === product.id);
        
        // Construir objeto de stock por almacén
        const warehouseStockObj = {};
        productStock.forEach(stock => {
          warehouseStockObj[stock.warehouse_id] = stock.quantity;
        });
        
        return {
          ...product,
          warehouseStock: warehouseStockObj
        };
      });
      
      // Filtrar por almacén si se especifica
      let filteredProducts = productsWithStock;
      if (warehouseId) {
        filteredProducts = productsWithStock.filter(product => {
          const warehouseStock = product.warehouseStock || {};
          return warehouseStock[warehouseId] !== undefined && warehouseStock[warehouseId] > 0;
        });
      }
      
      // Calcular totales por categoría
      const categorySummary = filteredProducts.reduce((summary, product) => {
        const category = product.category || 'Sin categoría';
        const totalStock = warehouseId
          ? (product.warehouseStock?.[warehouseId] || 0)
          : Object.values(product.warehouseStock || {}).reduce((sum, stock) => sum + stock, 0);
        
        if (!summary[category]) {
          summary[category] = {
            totalProducts: 0,
            totalStock: 0,
            lowStockCount: 0
          };
        }
        
        summary[category].totalProducts += 1;
        summary[category].totalStock += totalStock;
        
        // Contar productos con stock bajo
        if (totalStock <= (product.min_stock || 0)) {
          summary[category].lowStockCount += 1;
        }
        
        return summary;
      }, {});
      
      return {
        timestamp: new Date(),
        totalProducts: filteredProducts.length,
        warehouseId,
        categoryFilter,
        products: filteredProducts,
        categorySummary
      };
    } catch (error) {
      console.error('Error al generar reporte de stock:', error);
      throw error;
    }
  },
  
  generateMovementsReport: async (options = {}) => {
    try {
      const { fromDate, toDate, productId, warehouseId, type } = options;
      
      // Obtener historial de stock
      const history = await stockService.getStockHistory({
        productId,
        warehouseId,
        fromDate,
        toDate,
        type
      });
      
      // Obtener productos y almacenes para incluir nombres
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name');
      
      if (productsError) throw productsError;
      
      const { data: warehouses, error: warehousesError } = await supabase
        .from('warehouses')
        .select('id, name');
      
      if (warehousesError) throw warehousesError;
      
      // Mapear IDs a nombres
      const productsMap = products.reduce((map, product) => {
        map[product.id] = product.name;
        return map;
      }, {});
      
      const warehousesMap = warehouses.reduce((map, warehouse) => {
        map[warehouse.id] = warehouse.name;
        return map;
      }, {});
      
      // Enriquecer el historial con nombres
      const enrichedHistory = history.map(entry => ({
        ...entry,
        productName: productsMap[entry.productId] || 'Producto desconocido',
        warehouseName: warehousesMap[entry.warehouseId] || 'Almacén desconocido',
        sourceWarehouseName: entry.sourceWarehouseId ? warehousesMap[entry.sourceWarehouseId] : undefined,
        targetWarehouseName: entry.targetWarehouseId ? warehousesMap[entry.targetWarehouseId] : undefined
      }));
      
      // Agrupar por tipo de movimiento
      const movementsByType = enrichedHistory.reduce((groups, entry) => {
        const type = entry.type || 'unknown';
        if (!groups[type]) {
          groups[type] = [];
        }
        groups[type].push(entry);
        return groups;
      }, {});
      
      return {
        timestamp: new Date(),
        fromDate,
        toDate,
        productId,
        warehouseId,
        type,
        totalMovements: history.length,
        movements: enrichedHistory,
        movementsByType
      };
    } catch (error) {
      console.error('Error al generar reporte de movimientos:', error);
      throw error;
    }
  }
};

export default stockService;