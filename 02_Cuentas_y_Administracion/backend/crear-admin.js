
require('dotenv').config();

const bcrypt = require('bcrypt');
const pool = require('./db');

async function crearAdministrador() {
  let cliente;

  const run = process.env.ADMIN_RUN;
  const contrasena = process.env.ADMIN_PASSWORD;
  const correoAdmin = process.env.ADMIN_EMAIL;
  if (!run || !contrasena || contrasena.length < 12 || !correoAdmin) {
    console.error('Define ADMIN_RUN, ADMIN_EMAIL y ADMIN_PASSWORD (12+ caracteres) en el entorno antes de crear un administrador.');
    await pool.end();
    return;
  }

  try {
    cliente = await pool.connect();

    // Evitar sobrescribir una cuenta existente.
    const existente = await cliente.query(
      'SELECT id FROM usuarios WHERE run = $1',
      [run]
    );

    if (existente.rows.length > 0) {
      console.log(
        'ya existe una cuenta con ese run. no se modificó.'
      );
      return;
    }

    // Encriptar la contraseña.
    const hash = await bcrypt.hash(contrasena, 12);

    await cliente.query('BEGIN');

    // Crear usuario administrador.
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
      RETURNING id`,
      [
        run,
        'Administrador de Prueba',
        correoAdmin,
        '1995-01-01',
        '11111111',
        hash
      ]
    );

    const usuarioId = resultado.rows[0].id;

    // Asegurar que exista el rol administrador.
    await cliente.query(
      `INSERT INTO roles (nombre)
       VALUES ('Administrador')
       ON CONFLICT (nombre) DO NOTHING`
    );

    // Asignar el rol.
    await cliente.query(
      `INSERT INTO usuario_roles (
        usuario_id,
        rol_id
      )
      SELECT $1, id
      FROM roles
      WHERE nombre = 'Administrador'`,
      [usuarioId]
    );

    // Dejar aprobada la condición de administrador.
    await cliente.query(
      `INSERT INTO solicitudes_administrador (
        usuario_id,
        estado
      )
      VALUES ($1, 'Aprobada')`,
      [usuarioId]
    );

    await cliente.query('COMMIT');

    console.log('administrador creado correctamente.');
    console.log('run:', run);
    console.log('rol: Administrador');

  } catch (error) {
    if (cliente) {
      await cliente.query('ROLLBACK').catch(() => {});
    }

    console.error(
      'error al crear administrador:',
      error.message
    );

  } finally {
    if (cliente) cliente.release();
    await pool.end();
  }
}

crearAdministrador();
