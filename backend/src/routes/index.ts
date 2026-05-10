import { Router } from 'express';
import { validateToken } from '../middlewares/auth.middleware';
import { soloRoles } from '../middlewares/roles.middleware';

// Controllers
import { login, me } from '../controllers/auth.controller';
import {
  listProducts, getProduct, createProduct,
  updateProduct, deleteProduct, stockAlerts,
} from '../controllers/products.controller';
import { listCategories, createCategory } from '../controllers/categories.controller';
import {
  registerSale, listSales,
  getSale, cancelSale,
} from '../controllers/sales.controller';
import { getDashboard } from '../controllers/dashboard.controller';
import {
  getCustomers, getCustomer,
  createCustomer, updateCustomer,
} from '../controllers/customers.controller';
import {
  createEntry, createAdjustment, getMovements, getBatches,
} from '../controllers/inventory.controller';
import {
  getUsers, getUser, createUser,
  updateUser, updatePassword,
} from '../controllers/users.controller';

const router = Router();

// Auth
router.post('/auth/login', login);
router.get('/auth/me', validateToken, me);

// Categories
router.get('/categories', validateToken, listCategories);
router.post('/categories', validateToken, soloRoles('admin'), createCategory);

// Products
router.get('/products/low-stock', validateToken, stockAlerts);
router.get('/products', validateToken, listProducts);
router.get('/products/:id', validateToken, getProduct);
router.post('/products', validateToken, soloRoles('admin'), createProduct);
router.put('/products/:id', validateToken, soloRoles('admin'), updateProduct);
router.delete('/products/:id', validateToken, soloRoles('admin'), deleteProduct);

// Sales
router.post('/sales', validateToken, registerSale);
router.get('/sales', validateToken, listSales);
router.get('/sales/:id', validateToken, getSale);
router.put('/sales/:id/anular', validateToken, soloRoles('admin'), cancelSale);

// Customers
router.get('/customers', validateToken, getCustomers);
router.get('/customers/:id', validateToken, getCustomer);
router.post('/customers', validateToken, createCustomer);
router.put('/customers/:id', validateToken, updateCustomer);

// Inventory 
router.post('/inventory/entry', validateToken, soloRoles('admin'), createEntry);
router.post('/inventory/adjustment', validateToken, soloRoles('admin'), createAdjustment);
router.get('/inventory/movements', validateToken, getMovements);
router.get('/inventory/batches', validateToken, getBatches);

// Users
router.get('/users', validateToken, soloRoles('admin'), getUsers);
router.get('/users/:id', validateToken, soloRoles('admin'), getUser);
router.post('/users', validateToken, soloRoles('admin'), createUser);
router.put('/users/:id', validateToken, soloRoles('admin'), updateUser);
router.put('/users/:id/password', validateToken, updatePassword);

//Dashboard 
router.get('/dashboard', validateToken, soloRoles('admin'), getDashboard);

export default router;
