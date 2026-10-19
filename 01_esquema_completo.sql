-- ComprayVenta (5): esquema para una base PostgreSQL nueva y vacía.
-- Ejecutar desde Query Tool, conectado a la base compraventa.
-- No incluye datos privados ni contraseñas de usuarios.
BEGIN;

CREATE TABLE IF NOT EXISTS usuarios (
  id BIGSERIAL PRIMARY KEY,
  run VARCHAR(12) NOT NULL UNIQUE,
  nombre_completo VARCHAR(150) NOT NULL,
  correo VARCHAR(150) NOT NULL UNIQUE,
  fecha_nacimiento DATE NOT NULL,
  telefono_personal VARCHAR(20) NOT NULL,
  contrasena_hash VARCHAR(255) NOT NULL,
  estado_cuenta VARCHAR(20) NOT NULL DEFAULT 'Activa'
    CHECK (estado_cuenta IN ('Activa', 'Bloqueada')),
  fecha_registro TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS roles (
  id BIGSERIAL PRIMARY KEY,
  nombre VARCHAR(30) NOT NULL UNIQUE
);
INSERT INTO roles(nombre) VALUES
  ('Cliente'), ('Emprendedor'), ('Administrador')
ON CONFLICT (nombre) DO NOTHING;

CREATE TABLE IF NOT EXISTS usuario_roles (
  usuario_id BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  rol_id BIGINT NOT NULL REFERENCES roles(id),
  PRIMARY KEY (usuario_id, rol_id)
);

CREATE TABLE IF NOT EXISTS direcciones (
  id BIGSERIAL PRIMARY KEY,
  usuario_id BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  region VARCHAR(100) NOT NULL,
  comuna VARCHAR(100) NOT NULL DEFAULT '',
  calle VARCHAR(150) NOT NULL,
  numero VARCHAR(20) NOT NULL,
  principal BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS direcciones_usuario_idx ON direcciones(usuario_id);

CREATE TABLE IF NOT EXISTS solicitudes_administrador (
  id BIGSERIAL PRIMARY KEY,
  usuario_id BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  estado VARCHAR(20) NOT NULL DEFAULT 'Pendiente'
    CHECK (estado IN ('Pendiente','Aprobada','Rechazada')),
  fecha_solicitud TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS solicitudes_admin_usuario_idx
  ON solicitudes_administrador(usuario_id);

CREATE TABLE IF NOT EXISTS sesiones (
  id BIGSERIAL PRIMARY KEY,
  usuario_id BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  token_hash CHAR(64) NOT NULL UNIQUE,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expira_en TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sesiones_usuario ON sesiones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_sesiones_expira ON sesiones(expira_en);

CREATE TABLE IF NOT EXISTS empresas (
  id BIGSERIAL PRIMARY KEY,
  propietario_id BIGINT NOT NULL REFERENCES usuarios(id),
  nombre_empresa VARCHAR(80) NOT NULL,
  rut_empresa VARCHAR(12) NOT NULL,
  correo VARCHAR(150),
  telefono VARCHAR(20),
  region VARCHAR(100),
  calle VARCHAR(100),
  numero_casa VARCHAR(20),
  pagina_web VARCHAR(250),
  fecha_registro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  activa BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE UNIQUE INDEX IF NOT EXISTS empresas_propietario_unico
  ON empresas(propietario_id);
CREATE UNIQUE INDEX IF NOT EXISTS empresas_rut_unico
  ON empresas(rut_empresa);
CREATE UNIQUE INDEX IF NOT EXISTS empresas_nombre_unico
  ON empresas(LOWER(TRIM(nombre_empresa)));

CREATE TABLE IF NOT EXISTS publicaciones (
  id BIGSERIAL PRIMARY KEY,
  empresa_id BIGINT NOT NULL REFERENCES empresas(id),
  tipo VARCHAR(12) NOT NULL CHECK (tipo IN ('Producto', 'Servicio')),
  titulo VARCHAR(150) NOT NULL,
  descripcion TEXT NOT NULL,
  categoria VARCHAR(100) NOT NULL DEFAULT '',
  precio BIGINT NOT NULL CHECK (precio > 0),
  stock INTEGER NOT NULL CHECK (stock >= 0),
  datos JSONB NOT NULL DEFAULT '{}'::jsonb,
  activa BOOLEAN NOT NULL DEFAULT TRUE,
  creada_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS publicaciones_empresa_idx ON publicaciones(empresa_id);

CREATE TABLE IF NOT EXISTS pedidos (
  id BIGSERIAL PRIMARY KEY,
  comprador_id BIGINT NOT NULL REFERENCES usuarios(id),
  empresa_id BIGINT NOT NULL REFERENCES empresas(id),
  region VARCHAR(100) NOT NULL,
  medio_pago VARCHAR(30) NOT NULL DEFAULT 'Simulado',
  subtotal BIGINT NOT NULL CHECK (subtotal >= 0),
  iva BIGINT NOT NULL CHECK (iva >= 0),
  costo_envio BIGINT NOT NULL CHECK (costo_envio >= 0),
  total BIGINT NOT NULL CHECK (total >= 0),
  estado VARCHAR(30) NOT NULL DEFAULT 'Registrado',
  creada_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  transportista VARCHAR(120),
  numero_seguimiento VARCHAR(120),
  actualizado_en TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS pedidos_comprador_idx ON pedidos(comprador_id);
CREATE INDEX IF NOT EXISTS pedidos_empresa_idx ON pedidos(empresa_id);

CREATE TABLE IF NOT EXISTS pedido_detalles (
  id BIGSERIAL PRIMARY KEY,
  pedido_id BIGINT NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  publicacion_id BIGINT NOT NULL REFERENCES publicaciones(id),
  titulo VARCHAR(150) NOT NULL,
  precio_unitario BIGINT NOT NULL CHECK (precio_unitario > 0),
  cantidad INTEGER NOT NULL CHECK (cantidad > 0)
);

CREATE TABLE IF NOT EXISTS cotizaciones (
  id BIGSERIAL PRIMARY KEY,
  solicitante_id BIGINT NOT NULL REFERENCES usuarios(id),
  empresa_id BIGINT NOT NULL REFERENCES empresas(id),
  total BIGINT NOT NULL CHECK (total >= 0),
  estado VARCHAR(30) NOT NULL DEFAULT 'Pendiente',
  creada_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  respuesta TEXT,
  respondida_en TIMESTAMPTZ,
  vence_en TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '15 days')
);
CREATE INDEX IF NOT EXISTS cotizaciones_solicitante_idx
  ON cotizaciones(solicitante_id);

CREATE TABLE IF NOT EXISTS cotizacion_detalles (
  id BIGSERIAL PRIMARY KEY,
  cotizacion_id BIGINT NOT NULL REFERENCES cotizaciones(id) ON DELETE CASCADE,
  publicacion_id BIGINT NOT NULL REFERENCES publicaciones(id),
  titulo VARCHAR(150) NOT NULL,
  precio_unitario BIGINT NOT NULL CHECK (precio_unitario > 0),
  cantidad INTEGER NOT NULL CHECK (cantidad > 0)
);

CREATE TABLE IF NOT EXISTS listas_deseos (
  id BIGSERIAL PRIMARY KEY,
  usuario_id BIGINT NOT NULL REFERENCES usuarios(id),
  nombre VARCHAR(80) NOT NULL,
  predeterminada BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (usuario_id, nombre)
);
CREATE UNIQUE INDEX IF NOT EXISTS una_lista_predeterminada
  ON listas_deseos(usuario_id) WHERE predeterminada = TRUE;

CREATE TABLE IF NOT EXISTS lista_deseos_items (
  lista_id BIGINT NOT NULL REFERENCES listas_deseos(id) ON DELETE CASCADE,
  publicacion_id BIGINT NOT NULL REFERENCES publicaciones(id) ON DELETE CASCADE,
  PRIMARY KEY (lista_id, publicacion_id)
);

CREATE TABLE IF NOT EXISTS conversaciones (
  id BIGSERIAL PRIMARY KEY,
  publicacion_id BIGINT NOT NULL REFERENCES publicaciones(id),
  comprador_id BIGINT NOT NULL REFERENCES usuarios(id),
  vendedor_id BIGINT NOT NULL REFERENCES usuarios(id),
  creada_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (publicacion_id, comprador_id),
  CHECK (comprador_id <> vendedor_id)
);
CREATE INDEX IF NOT EXISTS conversaciones_vendedor_idx
  ON conversaciones(vendedor_id);

CREATE TABLE IF NOT EXISTS mensajes_chat (
  id BIGSERIAL PRIMARY KEY,
  conversacion_id BIGINT NOT NULL REFERENCES conversaciones(id) ON DELETE CASCADE,
  remitente_id BIGINT NOT NULL REFERENCES usuarios(id),
  texto VARCHAR(2000) NOT NULL,
  enviado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS mensajes_chat_conversacion_idx
  ON mensajes_chat(conversacion_id, id);

COMMIT;
