import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import NewSale from './pages/NewSale';
import Sales from './pages/Sales';
import Customers from './pages/Customers';
import Inventory from './pages/Inventory';
import Users from './pages/Users';

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />

          {/* Protected — any authenticated user */}
          <Route path="/ventas/nueva" element={
            <PrivateRoute><Layout><NewSale /></Layout></PrivateRoute>
          } />
          <Route path="/ventas" element={
            <PrivateRoute><Layout><Sales /></Layout></PrivateRoute>
          } />
          <Route path="/clientes" element={
            <PrivateRoute><Layout><Customers /></Layout></PrivateRoute>
          } />

          {/* Protected — admin only */}
          <Route path="/dashboard" element={
            <PrivateRoute adminOnly><Layout><Dashboard /></Layout></PrivateRoute>
          } />
          <Route path="/productos" element={
            <PrivateRoute adminOnly><Layout><Products /></Layout></PrivateRoute>
          } />
          <Route path="/inventario" element={
            <PrivateRoute adminOnly><Layout><Inventory /></Layout></PrivateRoute>
          } />
          <Route path="/usuarios" element={
            <PrivateRoute adminOnly><Layout><Users /></Layout></PrivateRoute>
          } />

          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
