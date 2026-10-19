-- Ejecutar en pgAdmin para comprobar tablas y registros.
SELECT current_database() AS base, current_user AS usuario_postgresql;
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
SELECT 'usuarios' AS tabla, COUNT(*) AS cantidad FROM usuarios
UNION ALL SELECT 'roles', COUNT(*) FROM roles
UNION ALL SELECT 'empresas', COUNT(*) FROM empresas
UNION ALL SELECT 'publicaciones', COUNT(*) FROM publicaciones
UNION ALL SELECT 'pedidos', COUNT(*) FROM pedidos
UNION ALL SELECT 'cotizaciones', COUNT(*) FROM cotizaciones
UNION ALL SELECT 'conversaciones', COUNT(*) FROM conversaciones
UNION ALL SELECT 'mensajes_chat', COUNT(*) FROM mensajes_chat
UNION ALL SELECT 'listas_deseos', COUNT(*) FROM listas_deseos;
