# nexo-frontend

Interfaz web de **Nexo**, sistema de gestión para salones de belleza (alternativa a Treinta).

**Stack:** React 18 con Vite 5, Tailwind CSS 3 y React Router. En producción se sirve con `serve`.

**Paleta:** rosado pastel (`#FCE4EC`, `#F8BBD0` y `#F48FB1`).

## Variables de entorno

| Variable       | Descripción                                                         |
| -------------- | ------------------------------------------------------------------- |
| `VITE_API_URL` | URL pública del backend, por ejemplo `https://nexo-backend-production.up.railway.app` |

> Vite incrusta `VITE_API_URL` **en tiempo de build**. Si la cambias en Railway, vuelve a desplegar el servicio.

## Scripts

- `npm run build`: genera `dist/`
- `npm start`: `serve -s dist` en `$PORT` (con fallback para la SPA)

## Módulos

- **Resumen:** ventas, costo y ganancia neta del día; gráfico de 7 días; pedidos, más vendidos y stock bajo.
- **Ventas:** venta rápida (monto y costo) o desde el catálogo; muestra la ganancia neta.
- **Inventario:** productos con variantes y stock, y servicios con su duración.
- **Pedidos:** flujo Vendedor → Casa Matriz → Cliente final.
- **Historial:** auditoría de quién hizo qué y cuándo, con detalle antes/después.
- **Equipo y Perfil:** roles (Dueño, Empleado, Vendedor) y personalización.
