-- Elimina las tablas existentes para evitar conflictos al recrear la base de datos
DROP TABLE IF EXISTS inventory_movements CASCADE;
DROP TABLE IF EXISTS sale_details        CASCADE;
DROP TABLE IF EXISTS sales               CASCADE;
DROP TABLE IF EXISTS customers           CASCADE;
DROP TABLE IF EXISTS products            CASCADE;
DROP TABLE IF EXISTS categories          CASCADE;
DROP TABLE IF EXISTS users               CASCADE;

-- Almacena los usuarios del sistema (empleados) y sus roles de acceso
CREATE TABLE users (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    email         VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(20) NOT NULL DEFAULT 'vendedor' 
                                CHECK (role IN ('admin', 'vendedor')),
    active        BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Crea un usuario administrador por defecto
INSERT INTO users (name, email, password_hash, role)
VALUES (
    'Administrador',
    'admin@novasalud.com',
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password
    'admin'
);

-- Clasificación para agrupar los productos
CREATE TABLE categories (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    active      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Registros iniciales de categorías
INSERT INTO categories (name, description) VALUES
    ('Analgésicos', 'Medicamentos para el dolor'),
    ('Antibióticos', 'Medicamentos contra infecciones bacterianas'),
    ('Vitaminas', 'Suplementos vitamínicos y minerales'),
    ('Antiinflamatorios', 'Medicamentos para reducir inflamación'),
    ('Antiácidos', 'Medicamentos para problemas digestivos'),
    ('Cuidado Personal', 'Productos de higiene y cuidado'),
    ('Otros', 'Productos varios');

-- Catálogo principal de inventario con control de precios y stock
CREATE TABLE products (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(150) NOT NULL,
    description     TEXT,
    category_id     INT NOT NULL REFERENCES categories(id),
    purchase_price  NUMERIC(10, 2) NOT NULL CHECK (purchase_price >= 0),
    sale_price      NUMERIC(10, 2) NOT NULL CHECK (sale_price >= 0),
    current_stock   INT NOT NULL DEFAULT 0 CHECK (current_stock >= 0),
    min_stock       INT NOT NULL DEFAULT 10 CHECK (min_stock >= 0),
    unit_of_measure VARCHAR(30) NOT NULL DEFAULT 'unidad',
    expiry_date     DATE,
    barcode         VARCHAR(50) UNIQUE,
    active          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Índices para agilizar las búsquedas de productos
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_low_stock ON products(current_stock, min_stock);

-- Catálogo de productos de ejemplo
INSERT INTO products (name, category_id, purchase_price, sale_price, current_stock, min_stock, unit_of_measure) VALUES
    ('Paracetamol 500mg x 10', 1, 1.50, 3.00, 50, 20, 'caja'),
    ('Ibuprofeno 400mg x 10', 4, 2.00, 4.50, 40, 15, 'caja'),
    ('Amoxicilina 500mg x 21', 2, 8.00, 15.00, 8, 10, 'caja'),
    ('Vitamina C 1g x 10', 3, 3.00, 6.00, 60, 20, 'caja'),
    ('Omeprazol 20mg x 14', 5, 4.50, 9.00, 25, 10, 'caja'),
    ('Alcohol 70% 250ml', 6, 3.50, 6.50, 30, 15, 'frasco'),
    ('Loratadina 10mg x 10', 7, 2.50, 5.00, 5, 10, 'caja');

-- Registro de clientes para facturación y seguimiento
CREATE TABLE customers (
    id         SERIAL PRIMARY KEY,
    name       VARCHAR(150) NOT NULL,
    dni        VARCHAR(20) UNIQUE,
    phone      VARCHAR(20),
    email      VARCHAR(150),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Cliente por defecto para ventas rápidas o anónimas
INSERT INTO customers (name, dni) VALUES ('Cliente General', '00000000');

-- Cabecera principal de las transacciones de venta
CREATE TABLE sales (
    id          SERIAL PRIMARY KEY,
    user_id     INT NOT NULL REFERENCES users(id),
    customer_id INT NOT NULL REFERENCES customers(id) DEFAULT 1,
    sale_date   TIMESTAMP NOT NULL DEFAULT NOW(),
    total       NUMERIC(10, 2) NOT NULL CHECK (total >= 0),
    status      VARCHAR(20) NOT NULL DEFAULT 'completada'
                                CHECK (status IN ('completada', 'anulada')),
    observation TEXT,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Índices para agilizar consultas de ventas por fecha, usuario o cliente
CREATE INDEX idx_sales_date ON sales(sale_date);
CREATE INDEX idx_sales_user ON sales(user_id);
CREATE INDEX idx_sales_customer ON sales(customer_id);

-- Detalle individual de los productos vendidos en cada transacción
CREATE TABLE sale_details (
    id         SERIAL PRIMARY KEY,
    sale_id    INT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products(id),
    quantity   INT NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
    subtotal   NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0)
);

-- Índices para optimizar las búsquedas en los detalles
CREATE INDEX idx_sale_details_sale ON sale_details(sale_id);
CREATE INDEX idx_sale_details_product ON sale_details(product_id);

-- Historial detallado de todas las alteraciones de stock (entradas, salidas, ajustes)
CREATE TABLE inventory_movements (
    id            SERIAL PRIMARY KEY,
    product_id    INT NOT NULL REFERENCES products(id),
    user_id       INT NOT NULL REFERENCES users(id),
    type          VARCHAR(20) NOT NULL CHECK (type IN ('entrada', 'salida', 'ajuste')),
    quantity      INT NOT NULL,
    stock_before  INT NOT NULL,
    stock_after   INT NOT NULL,
    reason        TEXT,
    sale_id       INT REFERENCES sales(id),
    movement_date TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Índices para agilizar reportes de inventario
CREATE INDEX idx_inv_mov_product ON inventory_movements(product_id);
CREATE INDEX idx_inv_mov_date ON inventory_movements(movement_date);

-- Vista: Muestra rápidamente los productos que están por debajo de su stock mínimo
CREATE VIEW low_stock_alerts_view AS
SELECT
    p.id,
    p.name,
    p.current_stock,
    p.min_stock,
    p.min_stock - p.current_stock AS missing_units,
    c.name AS category
FROM products p
JOIN categories c ON c.id = p.category_id
WHERE p.current_stock <= p.min_stock
  AND p.active = TRUE
ORDER BY missing_units DESC;

-- Vista: Resumen financiero de las ventas exitosas del día actual
CREATE VIEW todays_sales_view AS
SELECT
    COUNT(*) AS total_sales,
    COALESCE(SUM(total), 0) AS total_income,
    COUNT(DISTINCT customer_id) AS customers_served
FROM sales
WHERE status = 'completada'
  AND sale_date::date = CURRENT_DATE;

-- Vista: Ranking de los 10 productos con más unidades vendidas históricamente
CREATE VIEW top_products_view AS
SELECT
    p.id,
    p.name,
    SUM(sd.quantity) AS total_sold,
    SUM(sd.subtotal) AS income_generated
FROM sale_details sd
JOIN sales s ON s.id = sd.sale_id
JOIN products p ON p.id = sd.product_id
WHERE s.status = 'completada'
GROUP BY p.id, p.name
ORDER BY total_sold DESC
LIMIT 10;

-- Función genérica para actualizar automáticamente la fecha de modificación (updated_at)
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers: Asignan la función set_updated_at() a las tablas principales
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
