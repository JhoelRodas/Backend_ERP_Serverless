-- =============================================================
--  ERP Azure Serverless — Script de Base de Datos SQL Server
--  Módulos: Productos, Inventario, Compras, Ventas, Clientes
-- =============================================================

-- -------------------------------------------------------------
-- 0. LIMPIEZA (El orden importa por las llaves foráneas)
-- -------------------------------------------------------------
IF OBJECT_ID('v_ordenes_compra_resumen', 'V') IS NOT NULL DROP VIEW v_ordenes_compra_resumen;
IF OBJECT_ID('v_ventas_resumen', 'V') IS NOT NULL DROP VIEW v_ventas_resumen;
IF OBJECT_ID('v_productos_stock', 'V') IS NOT NULL DROP VIEW v_productos_stock;

IF OBJECT_ID('detalle_venta', 'U') IS NOT NULL DROP TABLE detalle_venta;
IF OBJECT_ID('ventas', 'U') IS NOT NULL DROP TABLE ventas;
IF OBJECT_ID('detalle_orden_compra', 'U') IS NOT NULL DROP TABLE detalle_orden_compra;
IF OBJECT_ID('ordenes_compra', 'U') IS NOT NULL DROP TABLE ordenes_compra;
IF OBJECT_ID('movimientos_inventario', 'U') IS NOT NULL DROP TABLE movimientos_inventario;
IF OBJECT_ID('inventario', 'U') IS NOT NULL DROP TABLE inventario;
IF OBJECT_ID('productos', 'U') IS NOT NULL DROP TABLE productos;
IF OBJECT_ID('categorias', 'U') IS NOT NULL DROP TABLE categorias;
IF OBJECT_ID('proveedores', 'U') IS NOT NULL DROP TABLE proveedores;
IF OBJECT_ID('clientes', 'U') IS NOT NULL DROP TABLE clientes;
GO

-- =============================================================
-- 1. CATÁLOGOS BASE
-- =============================================================

-- 1.1 Categorías de productos
CREATE TABLE categorias (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    nombre      VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    creado_en   DATETIME2 NOT NULL DEFAULT GETDATE()
);

-- 1.2 Clientes
CREATE TABLE clientes (
    id        INT IDENTITY(1,1) PRIMARY KEY,
    nombre    VARCHAR(150) NOT NULL,
    email     VARCHAR(150) NOT NULL UNIQUE,
    telefono  VARCHAR(20),
    direccion TEXT,
    ruc       VARCHAR(20) UNIQUE,
    activo    BIT NOT NULL DEFAULT 1, -- 1 es TRUE en SQL Server
    creado_en DATETIME2 NOT NULL DEFAULT GETDATE()
);

-- 1.3 Proveedores
CREATE TABLE proveedores (
    id        INT IDENTITY(1,1) PRIMARY KEY,
    nombre    VARCHAR(150) NOT NULL,
    email     VARCHAR(150) UNIQUE,
    telefono  VARCHAR(20),
    direccion TEXT,
    ruc       VARCHAR(20) UNIQUE,
    activo    BIT NOT NULL DEFAULT 1,
    creado_en DATETIME2 NOT NULL DEFAULT GETDATE()
);

-- =============================================================
-- 2. MÓDULO PRODUCTOS
-- =============================================================

CREATE TABLE productos (
    id           INT IDENTITY(1,1) PRIMARY KEY,
    nombre       VARCHAR(200) NOT NULL,
    codigo       VARCHAR(50) NOT NULL UNIQUE,  -- SKU
    descripcion  TEXT,
    precio       NUMERIC(12, 2) NOT NULL CHECK (precio >= 0),
    categoria_id INT REFERENCES categorias(id) ON DELETE SET NULL,
    activo       BIT NOT NULL DEFAULT 1,
    creado_en    DATETIME2 NOT NULL DEFAULT GETDATE()
);

CREATE INDEX idx_productos_codigo ON productos(codigo);
CREATE INDEX idx_productos_categoria_id ON productos(categoria_id);

-- =============================================================
-- 3. MÓDULO INVENTARIO
-- =============================================================

-- Stock actual por producto (relación 1-a-1)
CREATE TABLE inventario (
    id             INT IDENTITY(1,1) PRIMARY KEY,
    producto_id    INT NOT NULL UNIQUE REFERENCES productos(id) ON DELETE CASCADE,
    stock          INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
    stock_minimo   INT NOT NULL DEFAULT 0 CHECK (stock_minimo >= 0),
    actualizado_en DATETIME2 NOT NULL DEFAULT GETDATE()
);

CREATE INDEX idx_inventario_producto_id ON inventario(producto_id);

-- Historial de movimientos de stock
CREATE TABLE movimientos_inventario (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    producto_id INT NOT NULL REFERENCES productos(id) ON DELETE NO ACTION, -- SQL Server usa NO ACTION en lugar de RESTRICT
    tipo        VARCHAR(10) NOT NULL CHECK (tipo IN ('ENTRADA', 'SALIDA', 'AJUSTE')),
    cantidad    INT NOT NULL CHECK (cantidad > 0),
    motivo      VARCHAR(255),
    referencia  VARCHAR(100),  -- ej. "VENTA-42", "COMPRA-17"
    creado_en   DATETIME2 NOT NULL DEFAULT GETDATE()
);

CREATE INDEX idx_mov_inv_producto_id ON movimientos_inventario(producto_id);
CREATE INDEX idx_mov_inv_creado_en ON movimientos_inventario(creado_en DESC);
GO

-- Trigger: actualiza inventario.actualizado_en en cada UPDATE
CREATE TRIGGER trg_inventario_updated
ON inventario
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE inventario
    SET actualizado_en = GETDATE()
    FROM inventario i
    INNER JOIN inserted ins ON i.id = ins.id;
END;
GO

-- =============================================================
-- 4. MÓDULO COMPRAS
-- =============================================================

CREATE TABLE ordenes_compra (
    id            INT IDENTITY(1,1) PRIMARY KEY,
    proveedor_id  INT NOT NULL REFERENCES proveedores(id) ON DELETE NO ACTION,
    estado        VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE'
                  CHECK (estado IN ('PENDIENTE','APROBADA','RECIBIDA','CANCELADA')),
    fecha_entrega DATE,
    observaciones TEXT,
    creado_en     DATETIME2 NOT NULL DEFAULT GETDATE()
);

CREATE INDEX idx_oc_proveedor_id ON ordenes_compra(proveedor_id);
CREATE INDEX idx_oc_estado ON ordenes_compra(estado);

CREATE TABLE detalle_orden_compra (
    id              INT IDENTITY(1,1) PRIMARY KEY,
    orden_id        INT NOT NULL REFERENCES ordenes_compra(id) ON DELETE CASCADE,
    producto_id     INT NOT NULL REFERENCES productos(id) ON DELETE NO ACTION,
    cantidad        INT NOT NULL CHECK (cantidad > 0),
    precio_unitario NUMERIC(12, 2) NOT NULL CHECK (precio_unitario >= 0),
    subtotal        AS (CAST(cantidad * precio_unitario AS NUMERIC(14,2))) PERSISTED
);

CREATE INDEX idx_doc_orden_id ON detalle_orden_compra(orden_id);

-- =============================================================
-- 5. MÓDULO VENTAS
-- =============================================================

CREATE TABLE ventas (
    id            INT IDENTITY(1,1) PRIMARY KEY,
    cliente_id    INT NOT NULL REFERENCES clientes(id) ON DELETE NO ACTION,
    total         NUMERIC(14, 2) NOT NULL CHECK (total >= 0),
    estado        VARCHAR(20) NOT NULL DEFAULT 'COMPLETADA'
                  CHECK (estado IN ('COMPLETADA','ANULADA')),
    observaciones TEXT,
    creado_en     DATETIME2 NOT NULL DEFAULT GETDATE()
);

CREATE INDEX idx_ventas_cliente_id ON ventas(cliente_id);
CREATE INDEX idx_ventas_estado ON ventas(estado);
CREATE INDEX idx_ventas_creado_en ON ventas(creado_en DESC);

CREATE TABLE detalle_venta (
    id              INT IDENTITY(1,1) PRIMARY KEY,
    venta_id        INT NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
    producto_id     INT NOT NULL REFERENCES productos(id) ON DELETE NO ACTION,
    cantidad        INT NOT NULL CHECK (cantidad > 0),
    precio_unitario NUMERIC(12, 2) NOT NULL CHECK (precio_unitario >= 0),
    subtotal        AS (CAST(cantidad * precio_unitario AS NUMERIC(14,2))) PERSISTED
);

CREATE INDEX idx_dv_venta_id ON detalle_venta(venta_id);
CREATE INDEX idx_dv_producto_id ON detalle_venta(producto_id);
GO

-- =============================================================
-- 6. DATOS SEMILLA (SEED)
-- =============================================================

INSERT INTO categorias (nombre, descripcion) VALUES
    ('Electrónica',  'Equipos y accesorios electrónicos'),
    ('Oficina',      'Útiles y mobiliario de oficina'),
    ('Consumibles',  'Papel, tóner y materiales de uso diario'),
    ('Software',     'Licencias y suscripciones de software');

INSERT INTO proveedores (nombre, email, telefono, ruc) VALUES
    ('Tech Distribuidora SAC', 'ventas@techdist.pe',  '+51 1 234-5678', '20100012345'),
    ('Oficina Total EIRL',     'pedidos@oficina.pe',  '+51 1 987-6543', '20200067890'),
    ('SumiMax Perú SA',        'compras@sumimax.pe',  '+51 1 555-0001', '20300011122');

INSERT INTO clientes (nombre, email, telefono, ruc) VALUES
    ('Empresa ABC SAC',      'finanzas@abc.pe',    '+51 1 300-1111', '20400055566'),
    ('Constructora XYZ SA',  'logistica@xyz.pe',   '+51 1 300-2222', '20500077788'),
    ('Retail Perú EIRL',     'compras@retail.pe',  '+51 1 300-3333', '20600099900'),
    ('Carlos Quispe',        'carlos@gmail.com',   '+51 999 111 222', NULL);

INSERT INTO productos (nombre, codigo, descripcion, precio, categoria_id) VALUES
    ('Laptop Dell Inspiron 15',   'LAP-DELL-15',  '15" Intel i5, 16GB RAM, 512GB SSD', 3200.00, 1),
    ('Monitor LG 27"',            'MON-LG-27',    'Full HD IPS 75Hz HDMI/DP',          850.00, 1),
    ('Teclado mecánico Logitech', 'TEC-LOG-MEC',  'Switch Red, retroiluminado',        245.00, 1),
    ('Resma de papel A4 80gr',    'PAP-A4-80G',   'Paquete 500 hojas',                 18.50, 3),
    ('Tóner HP LaserJet 85A',     'TON-HP-85A',   'Compatible HP P1102/P1102W',        95.00, 3),
    ('Silla ergonómica',          'SIL-ERG-01',   'Respaldo alto, apoyabrazos 4D',     680.00, 2),
    ('Microsoft 365 Business',    'SW-M365-BUS',  'Licencia anual 1 usuario',          420.00, 4);

INSERT INTO inventario (producto_id, stock, stock_minimo) VALUES
    (1, 15,  3),
    (2, 22,  5),
    (3, 40, 10),
    (4, 200, 50),
    (5, 35, 10),
    (6,  8,  2),
    (7, 50, 10);
GO

-- =============================================================
-- 7. VISTAS ÚTILES
-- =============================================================

-- Productos con stock y alerta de stock bajo
CREATE VIEW v_productos_stock AS
SELECT
    p.id, p.codigo, p.nombre, p.precio,
    c.nombre AS categoria,
    ISNULL(i.stock, 0) AS stock,
    ISNULL(i.stock_minimo, 0) AS stock_minimo,
    CAST(CASE WHEN ISNULL(i.stock, 0) <= ISNULL(i.stock_minimo, 0) THEN 1 ELSE 0 END AS BIT) AS stock_bajo
FROM productos p
LEFT JOIN categorias c ON c.id = p.categoria_id
LEFT JOIN inventario i ON i.producto_id = p.id
WHERE p.activo = 1;
GO

-- Ventas con datos del cliente
CREATE VIEW v_ventas_resumen AS
SELECT
    v.id, v.total, v.estado, v.creado_en,
    cl.nombre AS cliente,
    cl.email  AS cliente_email
FROM ventas v
JOIN clientes cl ON cl.id = v.cliente_id;
GO

-- Órdenes de compra con proveedor y total calculado
CREATE VIEW v_ordenes_compra_resumen AS
SELECT
    oc.id, oc.estado, oc.fecha_entrega, oc.creado_en,
    pr.nombre AS proveedor,
    pr.email  AS proveedor_email,
    ISNULL(SUM(doc.subtotal), 0) AS total
FROM ordenes_compra oc
JOIN proveedores pr ON pr.id = oc.proveedor_id
LEFT JOIN detalle_orden_compra doc ON doc.orden_id = oc.id
GROUP BY oc.id, oc.estado, oc.fecha_entrega, oc.creado_en,
         pr.nombre, pr.email;
GO