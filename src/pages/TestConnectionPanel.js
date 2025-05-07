// src/pages/TestConnectionPanel.js

import React, { useState } from 'react';
import TestConnectionPanelView from '../components/panels/TestConnectionPanelView';
import { supabase } from '../api/supabase';

const TestConnectionPanel = () => {
  const [loading, setLoading] = useState(false);
  const [connectionState, setConnectionState] = useState(null);
  const [testResults, setTestResults] = useState([]);
  
  // Probar conexión básica
  const handleTestConnection = async () => {
    setLoading(true);
    try {
      // Intentar hacer una consulta simple para verificar la conexión
      const { data, error } = await supabase.from('warehouses').select('count');
      
      if (error) {
        console.error('Error de conexión a Supabase:', error);
        setConnectionState({
          success: false,
          message: `Error de conexión: ${error.message}`
        });
      } else {
        console.log('¡Conexión exitosa a Supabase!', data);
        setConnectionState({
          success: true,
          message: '¡Conexión a Supabase establecida correctamente!'
        });
      }
    } catch (err) {
      console.error('Error inesperado:', err);
      setConnectionState({
        success: false,
        message: `Error inesperado: ${err.message}`
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Probar todas las tablas
  const handleTestTables = async () => {
    setLoading(true);
    const results = [];
    
    const tablesToTest = [
      'users',
      'warehouses', 
      'products', 
      'fields', 
      'warehouse_stock',
      'transfers',
      'purchases',
      'fumigations',
      'stock_history'
    ];
    
    try {
      for (const table of tablesToTest) {
        try {
          const { data, error } = await supabase.from(table).select('count');
          
          if (error) {
            console.error(`Error al probar tabla ${table}:`, error);
            results.push({
              table,
              success: false,
              message: `Error: ${error.message}`
            });
          } else {
            console.log(`Tabla ${table} OK:`, data);
            results.push({
              table,
              success: true,
              message: `OK - Tabla accesible`
            });
          }
        } catch (err) {
          console.error(`Error al probar tabla ${table}:`, err);
          results.push({
            table,
            success: false,
            message: `Error: ${err.message}`
          });
        }
      }
      
      setTestResults(results);
    } finally {
      setLoading(false);
    }
  };
  
  // Refrescar
  const handleRefresh = () => {
    setConnectionState(null);
    setTestResults([]);
  };
  
  return (
    <TestConnectionPanelView
      loading={loading}
      connectionState={connectionState}
      testResults={testResults}
      onTestConnection={handleTestConnection}
      onTestTables={handleTestTables}
      onRefresh={handleRefresh}
    />
  );
};

export default TestConnectionPanel;