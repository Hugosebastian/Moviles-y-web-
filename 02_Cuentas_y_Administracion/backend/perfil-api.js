
const crypto = require('node:crypto');
const bcrypt = require('bcrypt');

const COOKIE = 'cv_sesion';
const DURACION_MS = 12 * 60 * 60 * 1000;

const hashToken = token =>
  crypto.createHash('sha256').update(token).digest('hex');

function leerCookie(req) {
  const linea = req.headers.cookie || '';
  const parte = linea
    .split(';')
    .map(x => x.trim())
    .find(x => x.startsWith(`${COOKIE}=`));

  return parte ? parte.slice(COOKIE.length + 1) : null;
}

function opcionesCookie() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: DURACION_MS
  };
}

async function crearSesion(res, usuarioId, pool) {
  const token = crypto.randomBytes(32).toString('hex');

  await pool.query(
    `INSERT INTO sesiones (usuario_id, token_hash, expira_en)
     VALUES ($1, $2, $3)`,
    [
      usuarioId,
      hashToken(token),
      new Date(Date.now() + DURACION_MS)
    ]
  );

  res.cookie(COOKIE, token, opcionesCookie());
}

function errorServidor(res, error) {
  console.error('error en perfil:', error.message);

  return res.status(500).json({
    error: 'ocurrió un error en el servidor.'
  });
}

async function autenticar(req, res, next) {
  const token = leerCookie(req);

  if (!token || !/^[a-f0-9]{64}$/.test(token)) {
    return res.status(401).json({
      error: 'inicia sesión nuevamente.'
    });
  }

  try {
    const resultado = await req.db.query(
      `SELECT s.usuario_id, u.estado_cuenta
       FROM sesiones s
       JOIN usuarios u ON u.id = s.usuario_id
       WHERE s.token_hash = $1
         AND s.expira_en > NOW()`,
      [hashToken(token)]
    );

    if (
      !resultado.rows.length ||
      resultado.rows[0].estado_cuenta !== 'Activa'
    ) {
      return res.status(401).json({
        error: 'la sesión ya no es válida.'
      });
    }

    req.usuarioId = resultado.rows[0].usuario_id;
    req.tokenHash = hashToken(token);
    next();

  } catch (error) {
    errorServidor(res, error);
  }
}

async function obtenerUsuario(pool, id) {
  const resultado = await pool.query(
    `SELECT id, run, nombre_completo, correo,
            fecha_nacimiento, telefono_personal,
            estado_cuenta
     FROM usuarios
     WHERE id = $1`,
    [id]
  );

  const usuario = resultado.rows[0];
  if (!usuario) return null;

  const roles = await pool.query(
    `SELECT r.nombre
     FROM roles r
     JOIN usuario_roles ur ON ur.rol_id = r.id
     WHERE ur.usuario_id = $1
     ORDER BY r.id`,
    [id]
  );

  const solicitud = await pool.query(
    `SELECT estado
     FROM solicitudes_administrador
     WHERE usuario_id = $1
     ORDER BY fecha_solicitud DESC, id DESC
     LIMIT 1`,
    [id]
  );

  const nombresRoles = roles.rows.map(x => x.nombre);

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
    tipoPerfil: nombresRoles,
    estadoAdmin: nombresRoles.includes('Administrador')
      ? 'Aprobado'
      : (solicitud.rows[0]?.estado || null)
  };
}

async function obtenerDirecciones(pool, id) {
  const resultado = await pool.query(
    `SELECT id, region, comuna, calle, numero, principal
     FROM direcciones
     WHERE usuario_id = $1
     ORDER BY principal DESC, id ASC`,
    [id]
  );

  return resultado.rows.map(x => ({
    id: String(x.id),
    region: x.region,
    comuna: x.comuna || '',
    calle: x.calle,
    numeroCasa: x.numero,
    principal: x.principal
  }));
}

function registrarRutasPerfil(app, pool) {
  // Comprobar el origen en solicitudes que modifican datos.
  app.use((req, res, next) => {
    const origen = req.headers.origin;
    const permitido =
      process.env.FRONTEND_ORIGIN || 'http://localhost:5173';

    if (
      origen &&
      origen !== permitido &&
      !['GET', 'HEAD', 'OPTIONS'].includes(req.method)
    ) {
      return res.status(403).json({
        error: 'origen no permitido.'
      });
    }

    next();
  });

  app.use('/api/perfil', (req, res, next) => {
    req.db = pool;
    next();
  });

  app.use('/api/logout', (req, res, next) => {
    req.db = pool;
    next();
  });

  // Cerrar sesión.
  app.post('/api/logout', autenticar, async (req, res) => {
    try {
      await pool.query(
        'DELETE FROM sesiones WHERE token_hash = $1',
        [req.tokenHash]
      );

      res.clearCookie(COOKIE, {
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
      });

      res.json({ mensaje: 'sesión cerrada.' });

    } catch (error) {
      errorServidor(res, error);
    }
  });

  // Consultar el perfil.
  app.get('/api/perfil', autenticar, async (req, res) => {
    try {
      res.json({
        usuario: await obtenerUsuario(pool, req.usuarioId),
        direcciones: await obtenerDirecciones(
          pool,
          req.usuarioId
        )
      });

    } catch (error) {
      errorServidor(res, error);
    }
  });

  // Editar nombre, correo y teléfono.
  app.patch('/api/perfil', autenticar, async (req, res) => {
    const telefono = String(
      req.body?.telefonoPersonal ?? ''
    ).trim();

    const nombre = String(
      req.body?.nombreCompleto ?? ''
    ).trim().replace(/\s+/g, ' ');

    const correo = String(
      req.body?.correo ?? ''
    ).trim().toLowerCase();

    if (!/^\d{8}$/.test(telefono)) {
      return res.status(400).json({
        error: 'el teléfono debe tener 8 dígitos.'
      });
    }

    if (nombre.length < 3 || nombre.length > 150) {
      return res.status(400).json({
        error: 'ingresa un nombre válido.'
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

    try {
      await pool.query(
        `UPDATE usuarios
         SET nombre_completo = $1,
             correo = $2,
             telefono_personal = $3
         WHERE id = $4`,
        [nombre, correo, telefono, req.usuarioId]
      );

      res.json({
        usuario: await obtenerUsuario(pool, req.usuarioId)
      });

    } catch (error) {
      if (error.code === '23505') {
        return res.status(409).json({
          error: 'ese correo ya está registrado.'
        });
      }

      errorServidor(res, error);
    }
  });

  // Consultar direcciones.
  app.get(
    '/api/perfil/direcciones',
    autenticar,
    async (req, res) => {
      try {
        res.json({
          direcciones: await obtenerDirecciones(
            pool,
            req.usuarioId
          )
        });

      } catch (error) {
        errorServidor(res, error);
      }
    }
  );

  // Agregar dirección.
  app.post(
    '/api/perfil/direcciones',
    autenticar,
    async (req, res) => {
      const region = String(req.body?.region || '').trim();
      const calle = String(req.body?.calle || '').trim();
      const numero = String(
        req.body?.numeroCasa || ''
      ).trim();

      if (
        !region ||
        !calle ||
        !numero ||
        region.length > 100 ||
        calle.length > 150 ||
        numero.length > 20
      ) {
        return res.status(400).json({
          error: 'revisa los datos de la dirección.'
        });
      }

      try {
        const resultado = await pool.query(
          `INSERT INTO direcciones (
            usuario_id, region, calle, numero, principal
          )
          VALUES ($1, $2, $3, $4, FALSE)
          RETURNING id`,
          [req.usuarioId, region, calle, numero]
        );

        res.status(201).json({
          id: String(resultado.rows[0].id),
          direcciones: await obtenerDirecciones(
            pool,
            req.usuarioId
          )
        });

      } catch (error) {
        errorServidor(res, error);
      }
    }
  );

  // Cambiar contraseña.
  app.patch(
    '/api/perfil/contrasena',
    autenticar,
    async (req, res) => {
      const actual = req.body?.actual;
      const nueva = req.body?.nueva;

      if (
        typeof actual !== 'string' ||
        typeof nueva !== 'string' ||
        nueva.length < 8 ||
        Buffer.byteLength(nueva, 'utf8') > 72
      ) {
        return res.status(400).json({
          error: 'la contraseña debe tener al menos 8 caracteres y no superar 72 bytes.'
        });
      }

      try {
        const resultado = await pool.query(
          `SELECT contrasena_hash
           FROM usuarios
           WHERE id = $1`,
          [req.usuarioId]
        );

        if (
          !resultado.rows.length ||
          !(await bcrypt.compare(
            actual,
            resultado.rows[0].contrasena_hash
          ))
        ) {
          return res.status(401).json({
            error: 'la contraseña actual es incorrecta.'
          });
        }

        const hash = await bcrypt.hash(nueva, 12);
        const cliente = await pool.connect();

        try {
          await cliente.query('BEGIN');

          await cliente.query(
            `UPDATE usuarios
             SET contrasena_hash = $1
             WHERE id = $2`,
            [hash, req.usuarioId]
          );

          await cliente.query(
            `DELETE FROM sesiones
             WHERE usuario_id = $1
               AND token_hash <> $2`,
            [req.usuarioId, req.tokenHash]
          );

          await cliente.query('COMMIT');

        } catch (error) {
          await cliente.query('ROLLBACK');
          throw error;

        } finally {
          cliente.release();
        }

        res.json({
          mensaje: 'contraseña actualizada correctamente.'
        });

      } catch (error) {
        errorServidor(res, error);
      }
    }
  );

  // Eliminar la cuenta.
  app.delete('/api/perfil', autenticar, async (req, res) => {
    const clave = req.body?.contrasena;

    if (typeof clave !== 'string') {
      return res.status(400).json({
        error: 'confirma tu contraseña.'
      });
    }

    try {
      const resultado = await pool.query(
        `SELECT contrasena_hash
         FROM usuarios
         WHERE id = $1`,
        [req.usuarioId]
      );

      if (
        !resultado.rows.length ||
        !(await bcrypt.compare(
          clave,
          resultado.rows[0].contrasena_hash
        ))
      ) {
        return res.status(401).json({
          error: 'contraseña incorrecta.'
        });
      }

      await pool.query(
        'DELETE FROM usuarios WHERE id = $1',
        [req.usuarioId]
      );

      res.clearCookie(COOKIE, {
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
      });

      res.json({ mensaje: 'cuenta eliminada.' });

    } catch (error) {
      if (error.code === '23503') {
        return res.status(409).json({
          error: 'la cuenta tiene datos asociados que deben gestionarse antes de eliminarla.'
        });
      }

      errorServidor(res, error);
    }
  });
}

module.exports = {
  crearSesion,
  registrarRutasPerfil
};
