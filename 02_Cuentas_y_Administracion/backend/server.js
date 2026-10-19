
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const pool = require('./db');
const {
  crearSesion,
  registrarRutasPerfil
} = require('./perfil-api');

const { registrarRutasEmpresas } = require('./empresas-api');

const { registrarRutasNegocio } = require('./negocio-api');
const { instalarMejoras } = require('./mejoras-api');

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json({ limit: '4mb' }));

function normalizarRun(valor) {
  return String(valor || '')
    .replace(/[.\s]/g, '')
    .toUpperCase();
}

function runValido(valor) {
  const run = normalizarRun(valor);

  if (!/^\d{1,8}-[0-9K]$/.test(run)) {
    return false;
  }

  const [cuerpo, digito] = run.split('-');
  let suma = 0;
  let factor = 2;

  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo[i]) * factor;
    factor = factor === 7 ? 2 : factor + 1;
  }

  const resultado = 11 - (suma % 11);

  const esperado =
    resultado === 11 ? '0' :
    resultado === 10 ? 'K' :
    String(resultado);

  return esperado === digito;
}

function fechaValidaYEdad(fecha) {
  if (
    typeof fecha !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(fecha)
  ) {
    return false;
  }

  const nacimiento = new Date(`${fecha}T12:00:00Z`);

  if (
    Number.isNaN(nacimiento.getTime()) ||
    nacimiento.toISOString().slice(0, 10) !== fecha
  ) {
    return false;
  }

  const hoy = new Date();

  let edad =
    hoy.getFullYear() - nacimiento.getUTCFullYear();

  const mes = hoy.getMonth() - nacimiento.getUTCMonth();

  if (
    mes < 0 ||
    (mes === 0 &&
      hoy.getDate() < nacimiento.getUTCDate())
  ) {
    edad--;
  }

  return edad >= 14 && edad <= 120;
}

function usuarioParaReact(usuario, roles, estadoSolicitud) {
  const estadoAdmin = roles.includes('Administrador')
    ? 'Aprobado'
    : estadoSolicitud;

  return {
    id: String(usuario.id),
    run: usuario.run,
    nombreCompleto: usuario.nombre_completo,
    correo: usuario.correo,
    fechaNacimiento:
      usuario.fecha_nacimiento instanceof Date
        ? usuario.fecha_nacimiento.toISOString().slice(0, 10)
        : String(usuario.fecha_nacimiento).slice(0, 10),
    telefonoPersonal: usuario.telefono_personal || '',
    estadoCuenta: usuario.estado_cuenta,
    tipoPerfil: roles,
    estadoAdmin: estadoAdmin || null
  };
}

app.get('/api/salud', async (req, res) => {
  try {
    const resultado = await pool.query(
      'SELECT current_database() AS base'
    );

    res.json({
      ok: true,
      base: resultado.rows[0].base
    });

  } catch (error) {
    console.error('error de base de datos:', error.message);

    res.status(500).json({
      error: 'no se pudo conectar a la base de datos.'
    });
  }
});

// Registro de usuarios.
app.post('/api/registro', async (req, res) => {
  const datos = req.body || {};

  const run = normalizarRun(datos.run);

  const nombre = String(datos.nombreCompleto || '')
    .trim()
    .replace(/\s+/g, ' ');

  const correo = String(datos.correo || '')
    .trim()
    .toLowerCase();

  const telefono = String(
    datos.telefonoPersonal || ''
  ).trim();

  const fecha = datos.fechaNacimiento;
  const contrasena = datos.contrasena;

  const region = String(datos.region || '').trim();
  const calle = String(datos.calle || '').trim();
  const numero = String(datos.numeroCasa || '').trim();

  const perfiles = [
    ...new Set(
      Array.isArray(datos.tipoPerfil)
        ? datos.tipoPerfil
        : []
    )
  ];

  if (!runValido(run)) {
    return res.status(400).json({
      error: 'ingresa un run válido.'
    });
  }

  if (nombre.length < 3 || nombre.length > 150) {
    return res.status(400).json({
      error: 'ingresa tu nombre completo.'
    });
  }

  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo) ||
    correo.length > 150
  ) {
    return res.status(400).json({
      error: 'ingresa un correo válido.'
    });
  }

  if (!fechaValidaYEdad(fecha)) {
    return res.status(400).json({
      error: 'revisa la fecha de nacimiento y la edad mínima.'
    });
  }

  if (!/^\d{8}$/.test(telefono)) {
    return res.status(400).json({
      error: 'el teléfono debe tener 8 números.'
    });
  }

  if (
    typeof contrasena !== 'string' ||
    contrasena.length < 8 ||
    Buffer.byteLength(contrasena, 'utf8') > 72
  ) {
    return res.status(400).json({
      error: 'la contraseña debe tener al menos 8 caracteres y no superar 72 bytes.'
    });
  }

  if (!region || !calle || !numero) {
    return res.status(400).json({
      error: 'completa tu dirección.'
    });
  }

  if (
    perfiles.length === 0 ||
    perfiles.some(
      rol => !['Cliente', 'Emprendedor'].includes(rol)
    )
  ) {
    return res.status(400).json({
      error: 'selecciona un tipo de perfil válido.'
    });
  }

  let cliente;

  try {
    cliente = await pool.connect();

    const hash = await bcrypt.hash(contrasena, 12);

    await cliente.query('BEGIN');

    const resultado = await cliente.query(
      `INSERT INTO usuarios (
        run,
        nombre_completo,
        correo,
        fecha_nacimiento,
        telefono_personal,
        contrasena_hash
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING
        id,
        run,
        nombre_completo,
        correo,
        fecha_nacimiento,
        telefono_personal,
        estado_cuenta`,
      [run, nombre, correo, fecha, telefono, hash]
    );

    const usuario = resultado.rows[0];

    for (const rol of perfiles) {
      const agregado = await cliente.query(
        `INSERT INTO usuario_roles (usuario_id, rol_id)
         SELECT $1, id
         FROM roles
         WHERE nombre = $2
         RETURNING rol_id`,
        [usuario.id, rol]
      );

      if (!agregado.rowCount) {
        throw new Error(`no existe el rol ${rol}`);
      }
    }

    await cliente.query(
      `INSERT INTO direcciones (
        usuario_id,
        region,
        calle,
        numero,
        principal
      )
      VALUES ($1, $2, $3, $4, TRUE)`,
      [usuario.id, region, calle, numero]
    );

    const estadoAdmin =
      datos.quiereSerAdmin === true
        ? 'Pendiente'
        : null;

    if (estadoAdmin) {
      await cliente.query(
        `INSERT INTO solicitudes_administrador (usuario_id)
         VALUES ($1)`,
        [usuario.id]
      );
    }

    await cliente.query('COMMIT');

    res.status(201).json({
      mensaje: 'cuenta creada con éxito.',
      usuario: usuarioParaReact(
        usuario,
        perfiles,
        estadoAdmin
      )
    });

  } catch (error) {
    if (cliente) {
      await cliente.query('ROLLBACK').catch(() => {});
    }

    if (error.code === '23505') {
      return res.status(409).json({
        error: 'ya existe una cuenta con ese run o correo.'
      });
    }

    console.error('error de registro:', error.message);

    res.status(500).json({
      error: 'no se pudo registrar el usuario.'
    });

  } finally {
    if (cliente) cliente.release();
  }
});

// Inicio de sesión.
app.post('/api/login', async (req, res) => {
  const run = normalizarRun(req.body?.run);
  const contrasena = req.body?.contrasena;

  if (!run || typeof contrasena !== 'string') {
    return res.status(400).json({
      error: 'ingresa tu run y contraseña.'
    });
  }

  try {
    const resultado = await pool.query(
      `SELECT
        id,
        run,
        nombre_completo,
        correo,
        fecha_nacimiento,
        telefono_personal,
        estado_cuenta,
        contrasena_hash
       FROM usuarios
       WHERE run = $1`,
      [run]
    );

    const usuario = resultado.rows[0];

    if (
      !usuario ||
      !(await bcrypt.compare(
        contrasena,
        usuario.contrasena_hash
      ))
    ) {
      return res.status(401).json({
        error: 'run o contraseña incorrectos.'
      });
    }

    if (usuario.estado_cuenta !== 'Activa') {
      return res.status(403).json({
        error: 'esta cuenta no está activa.'
      });
    }

    const rolesResultado = await pool.query(
      `SELECT r.nombre
       FROM roles r
       JOIN usuario_roles ur ON ur.rol_id = r.id
       WHERE ur.usuario_id = $1
       ORDER BY r.id`,
      [usuario.id]
    );

    const solicitud = await pool.query(
      `SELECT estado
       FROM solicitudes_administrador
       WHERE usuario_id = $1
       ORDER BY fecha_solicitud DESC, id DESC
       LIMIT 1`,
      [usuario.id]
    );

    const roles = rolesResultado.rows.map(
      fila => fila.nombre
    );

    await crearSesion(res, usuario.id, pool);

    res.json({
      usuario: usuarioParaReact(
        usuario,
        roles,
        solicitud.rows[0]?.estado || null
      )
    });

  } catch (error) {
    console.error('error de login:', error.message);

    res.status(500).json({
      error: 'no se pudo iniciar sesión.'
    });
  }
});

registrarRutasPerfil(app, pool);
registrarRutasEmpresas(app, pool);
registrarRutasNegocio(app, pool);
instalarMejoras(app, pool);

app.listen(PORT, () => {
  console.log(
    `backend disponible en http://localhost:${PORT}`
  );
});
