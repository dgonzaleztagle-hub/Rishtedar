# Plan Maestro — Dashboard KPIs Rishtedar

> Documento vivo. Última actualización: 2026-04-20.
> Punto de entrada cuando lleguen credenciales: leer este archivo y retomar desde "Estado de bloqueos".

---

## 1. Visión del cliente

Dashboard en tiempo real / muy actualizado con 11 KPIs:

1. Tráfico web total y por local
2. Reservas generadas
3. Pedidos propios generados
4. Conversión web (%)
5. Base de datos captada (leads/clientes)
6. Clientes nuevos vs recurrentes
7. Ticket promedio
8. Fuente de tráfico (Google, IG, TikTok, ChatGPT, referral)
9. ROI campañas / píxeles (lectura APIs Meta/Google)
10. Carritos abandonados
11. Local más fuerte / más débil digitalmente

Accesos, pixels y cuentas a nombre de Rishtedar desde día 1.

---

## 2. Inventario — qué hay hoy (auditoría 2026-04-20)

### Funcional en producción
- Schema v1 Supabase con: `orders`, `order_items`, `reservations`, `promotions`, `menu_items`, `subscribers`, `delivery_tracking`, `staff_profiles`, `push_subscriptions`.
- Multi-branch: `business_id` TEXT en tablas relevantes + 5 locales hardcodeados en [lib/locations.ts](lib/locations.ts).
- Dashboard operacional: órdenes, reservas, delivery, menú, horarios, promociones, lealtad, scanner.
- Auth real Supabase con roles (staff_profiles).
- Cart cliente: Zustand + localStorage ([lib/store/cart.ts](lib/store/cart.ts)) — sin persistencia backend.
- Realtime alerts ([hooks/useRealtimeAlerts.ts](hooks/useRealtimeAlerts.ts)).

### Esqueleto sin datos reales
- `app/dashboard/analytics/page.tsx` + `AnalyticsView.tsx` → UI bonita, **100% demo hardcodeado** (revenue por hora, embudo 150→12, top platos, ROI promos). Hay que conectar o reemplazar.
- `KPICards.tsx` → 4 KPIs hardcodeados.

### Planeado, no construido
- **Schema v2** (`supabase/schema-v2.sql`) documentado pero **no aplicado** en prod. Introduce tabla `businesses`, `loyalty_points`, elimina `daily_analytics`.
- **Toteat**: solo docs (`toteatApi_v2.yaml`, `toteat_docs_home.html`). Cero código de integración.

### Lo que NO existe
- Sin tracking web: cero GA4, Meta Pixel, GTM, gtag, fbq, UTM capture.
- Sin tabla de sesiones / page_views / eventos.
- Sin persistencia de carritos (no se pueden medir abandonados).
- Sin endpoints agregados (`/api/kpis/*` no existen).
- Sin deduplicación de clientes (teléfono no es PK único, no hay lógica nuevo vs recurrente).
- Sin integraciones Meta / Google Ads / GA4 Data API.

---

## 3. Gap analysis por KPI

| # | KPI | Estado | Qué falta |
|---|-----|--------|-----------|
| 1 | Tráfico web total / por local | 🔴 0% | GA4 instalado + GA4 Data API + tabla `analytics_sessions` |
| 2 | Reservas generadas | 🟢 100% data | Solo falta endpoint agregado `/api/kpis/reservations` |
| 3 | Pedidos propios | 🟢 100% data | Endpoint agregado `/api/kpis/orders` |
| 4 | Conversión web % | 🔴 0% | Requiere #1 + eventos de conversión instrumentados |
| 5 | Base de datos captada | 🟡 50% | Data hay (customers/subscribers), falta endpoint + definición "lead" vs "cliente" |
| 6 | Nuevo vs recurrente | 🟡 30% | Falta deduplicación robusta + job nocturno de clasificación |
| 7 | Ticket promedio | 🟡 web sí, real no | Web: endpoint simple. Real (web+local): requiere Toteat |
| 8 | Fuente de tráfico | 🔴 0% | UTM capture + GA4 + convención documentada para marketing |
| 9 | ROI campañas | 🔴 0% | Google Ads API + Meta Marketing API (OAuth, solo lectura) |
| 10 | Carritos abandonados | 🔴 0% | Tabla `carts` backend + eventos `cart_updated` + job detector abandono |
| 11 | Comparativa locales | 🟡 parcial | Derivable una vez #1-#10 estén por `business_id` |

---

## 4. Plan de ejecución — 4 fases

### FASE 0 — Preparación (sin bloqueos, podemos empezar YA)

Todo esto no depende de credenciales del cliente ni de Toteat.

- [ ] Aplicar `schema-v2.sql` (o crear migración incremental).
- [ ] Crear tabla `analytics_sessions` (visitor_id, session_id, business_id, utm_source, utm_medium, utm_campaign, utm_content, referrer, landing_page, device, created_at, ended_at).
- [ ] Crear tabla `analytics_events` (session_id, event_name, payload JSONB, created_at) — eventos: `page_view`, `view_menu`, `add_to_cart`, `remove_from_cart`, `begin_checkout`, `reservation_started`, `reservation_completed`, `purchase`, `lead_captured`.
- [ ] Crear tabla `carts` backend (cart_id, session_id, business_id, items JSONB, updated_at, abandoned_at, recovered_at).
- [ ] Crear tabla `customers_unified` o agregar campos de deduplicación (normalized_phone, normalized_email, first_seen_at, last_seen_at, total_orders, total_spent, is_returning).
- [ ] Definir convención UTM para equipo de marketing (doc entregable al cliente).

### FASE 1 — Instrumentación tracking (sin bloqueos)

- [ ] Instalar GA4 vía GTM. Cuenta a crear a nombre de Rishtedar (requiere correo corporativo del cliente).
- [ ] Instalar Meta Pixel vía GTM. Business Manager a nombre de Rishtedar.
- [ ] Instalar TikTok Pixel (opcional, si hacen ads ahí).
- [ ] Capa de eventos unificada: un `trackEvent(name, payload)` que dispara a GA4, Meta Pixel y nuestra tabla `analytics_events` en paralelo.
- [ ] UTM capture: middleware Next que lee query params al entrar, guarda en cookie/localStorage, attacha a cada evento y al customer al registrarse.
- [ ] `visitor_id` persistente (cookie 2 años) + `session_id` (30 min inactividad).
- [ ] Instrumentar páginas clave: home, menú, carrito, checkout, reservas, confirmación.

### FASE 2 — Backend del dashboard (sin bloqueos)

- [ ] Endpoints agregados `/api/kpis/*`:
  - `/api/kpis/overview` (resumen header)
  - `/api/kpis/traffic` (sesiones, páginas, fuentes)
  - `/api/kpis/conversion` (embudo)
  - `/api/kpis/orders` (conteo, revenue, ticket)
  - `/api/kpis/reservations`
  - `/api/kpis/customers` (nuevo vs recurrente, base captada)
  - `/api/kpis/carts` (abandonados, tasa de recuperación)
  - `/api/kpis/branches` (comparativa)
- [ ] Cada endpoint acepta `?branch=&from=&to=`.
- [ ] Cache server-side (5–15 min) para KPIs pesados.
- [ ] Job nocturno de consolidación (Supabase cron o edge function): llena tablas agregadas `kpis_daily` para queries rápidas.
- [ ] Job detector de carrito abandonado: marca `abandoned_at` si `updated_at` > 30 min sin `purchase`.
- [ ] Deduplicación de clientes: normalizar phone/email, merge manual si hay match.

### FASE 3 — Frontend dashboard (sin bloqueos, paralelizable con F2)

- [ ] Reescribir `AnalyticsView.tsx` contra endpoints reales (ya no demo).
- [ ] Filtros: rango de fechas, local, canal.
- [ ] Gráficos: line (tráfico/revenue), bar (comparativa locales), funnel (conversión), pie (fuentes).
- [ ] Realtime para: reservas/pedidos entrantes (Supabase Realtime ya existe en el stack).
- [ ] Auto-refresh 5 min para métricas agregadas.
- [ ] Vista comparativa de locales ("más fuerte / más débil").
- [ ] Exportar CSV.

### FASE 4 — Integraciones externas (BLOQUEADAS por credenciales)

**Bloqueo A — Toteat** (esperando gerente desde 2026-04-17)
- [ ] `lib/services/toteatService.ts` con 4 credenciales.
- [ ] `lib/utils/toteatMappers.ts` Product→MenuItem, Order→ToteatOrder.
- [ ] `app/api/webhooks/toteat/menu` y `/orders`.
- [ ] `supabase/toteat-migration.sql` (toteat_product_id, toteat_order_id).
- [ ] Sync menú + push pedidos pagados + lectura ventas totales para ticket real.

**Bloqueo B — Google Ads / GA4** (esperando que el cliente cree/entregue acceso a cuentas)
- [ ] OAuth flow con cuenta Rishtedar.
- [ ] `lib/services/googleAdsService.ts` — lectura de campañas, costo, ROAS.
- [ ] `lib/services/ga4Service.ts` — lectura de sesiones/conversiones (complementa data propia).
- [ ] Endpoint `/api/kpis/roi/google`.

**Bloqueo C — Meta Marketing API** (esperando acceso Business Manager)
- [ ] OAuth con System User de Rishtedar.
- [ ] `lib/services/metaAdsService.ts`.
- [ ] Endpoint `/api/kpis/roi/meta`.

---

## 5. Estado de bloqueos (chequear al retomar)

| Bloqueo | Solicitado | Responsable | Estado |
|---------|------------|-------------|--------|
| Credenciales Toteat (xir, xil×4, xiu, xapitoken) | 2026-04-17 | Gerente cliente | ⏳ Pendiente |
| Ventana de pruebas en local piloto Toteat | — | Cliente | ⏳ No solicitada aún |
| Confirmación menú igual en 4 locales | — | Cliente | ⏳ |
| Método de pago MercadoPago configurado | — | Cliente | ⏳ |
| Correos corporativos Rishtedar para cuentas | — | Cliente | ⏳ |
| Acceso Google Ads (modo read via MCC o OAuth) | — | Cliente / equipo marketing | ⏳ |
| Acceso Meta Business Manager | — | Cliente / equipo marketing | ⏳ |
| Lista de admin/owner por plataforma | — | Cliente | ⏳ |

---

## 6. Preguntas abiertas

- ¿Definición de "lead" vs "cliente"? (¿suscriptor newsletter = lead? ¿reserva sin pedido = lead?)
- ¿Ventana de "carrito abandonado"? (propuesta: 30 min sin actividad y sin purchase)
- ¿Periodo default del dashboard? (hoy / 7d / 30d)
- ¿Quién es el owner técnico del lado cliente para coordinar Toteat y ads?
- ¿Presupuesto/alcance para email de recuperación de carritos abandonados? (fuera del scope actual)

---

## 7. Estimación honesta

- FASE 0 + 1 + 2 + 3 (todo lo no bloqueado): **40–60h de desarrollo**.
- FASE 4 integraciones: **20–30h adicionales** una vez desbloqueado, distribuidas según lleguen credenciales.
- Total realista: **60–90h** para dashboard completo production-ready.

---

## 8. Cómo retomar

Cuando el usuario diga "Claude, aquí están las credenciales":

1. Leer este archivo completo.
2. Ir a sección 5 (Estado de bloqueos) y actualizar.
3. Verificar avance real de FASE 0–3 con `git log` + revisar archivos clave.
4. Retomar desde la tarea pendiente más temprana no bloqueada.
5. Actualizar este doc al cerrar cada bloque.
