# RISHTEDAR — De Demo a Producción
## Checklist completo para entrega al cliente · Abril 2026

> **Cómo leer este documento:** Cada ítem tiene un nivel de prioridad (🔴 Bloqueante / 🟡 Importante / 🟢 Deseable), el archivo o área exacta que hay que tocar, qué hay que hacer, y cuánto trabajo estimado representa. Al terminar todos los 🔴, el sistema está vivo. Al terminar los 🟡, está completo. Los 🟢 son mejoras post-lanzamiento.

---

## RESUMEN EJECUTIVO

| Categoría | Ítems 🔴 | Ítems 🟡 | Ítems 🟢 |
|-----------|----------|----------|----------|
| Autenticación real | 2 | 1 | 0 |
| Datos reales vs mock | 5 | 6 | 0 |
| Assets faltantes | 3 | 0 | 0 |
| Pagos | 1 | 1 | 0 |
| Push / Email | 2 | 1 | 0 |
| Seguridad (RLS) | 2 | 1 | 0 |
| Funcionalidad admin | 0 | 4 | 2 |
| Schema / DB | 1 | 2 | 0 |
| **TOTAL** | **16** | **16** | **2** |

**Estimación total:** ~8–12 días de trabajo para un developer full-stack.
**Para lanzar con funcionalidad core:** ~4–5 días (solo los 🔴).

---

# BLOQUE 1 — AUTENTICACIÓN REAL

El sistema actualmente usa tokens hardcodeados en `lib/staff-tokens.ts` y guarda el estado en `localStorage`. Eso es válido para demo pero no para producción. Un cliente real con múltiples sucursales necesita login real.

---

### 🔴 AUTH-01 — Login del staff con Supabase Auth

**Qué hay hoy:** El dashboard login lee los tokens de `lib/staff-tokens.ts` y guarda el branch en `localStorage('rishtedar_branch')`. No hay sesión real, no hay expiración, no hay roles.

**Qué hay que hacer:**
1. Crear usuarios en Supabase Auth, uno por sucursal (o por persona del staff).
2. Agregar una tabla `staff_profiles` con columnas: `user_id` (FK a auth.users), `branch_id`, `role` (admin / gerente / cajero).
3. Reemplazar `BranchLogin.tsx` para usar `supabase.auth.signInWithPassword()`.
4. Reemplazar el chequeo de token en cada página del dashboard por `supabase.auth.getUser()` + lectura del `branch_id` del perfil.
5. Agregar `supabase.auth.signOut()` al botón "Cambiar sucursal".
6. Eliminar `lib/staff-tokens.ts` del repo (contiene secretos en plaintext).

**Archivos a tocar:**
- `components/dashboard/BranchLogin.tsx`
- `lib/staff-tokens.ts` → **eliminar**
- `app/dashboard/layout.tsx` (agregar middleware de sesión)
- `app/dashboard/login/page.tsx`
- Crear: `lib/services/authService.ts`

**Estimación:** 1.5 días

---

### 🔴 AUTH-02 — Identidad del cliente Circle con Supabase Auth (o al menos validación por teléfono)

**Qué hay hoy:** El Circle guarda nombre, teléfono y local favorito en `localStorage`. Si el usuario borra el caché, pierde su perfil. No hay forma de recuperar la cuenta desde otro dispositivo.

**Qué hay que hacer (opción A — completa):**
1. Implementar autenticación por teléfono (OTP SMS) usando Supabase Auth.
2. Al activar el Circle, pedir el teléfono, enviar un código de 6 dígitos, verificar, y crear sesión.
3. Leer el perfil desde Supabase en cada visita en lugar de `localStorage`.

**Qué hay que hacer (opción B — intermedia, más rápida):**
1. Mantener `localStorage` como caché.
2. Agregar un flujo de "recuperar mi cuenta" que pide el teléfono y busca en Supabase si ya existe ese número.
3. Sincronizar el estado local con Supabase en cada apertura de la app.

**Archivos a tocar:**
- `app/app/page.tsx`
- `components/app/IdentityForm.tsx`
- `lib/stores/clientStore.ts` (o donde viva el estado del cliente)
- Crear: `lib/services/circleAuthService.ts`

**Recomendación:** Opción B para lanzamiento rápido, migrar a A en v2.

**Estimación:** 1 día (opción B) / 2.5 días (opción A)

---

### 🟡 AUTH-03 — Middleware de protección de rutas del dashboard

**Qué hay hoy:** Las rutas `/dashboard/*` no tienen protección a nivel de Next.js. Cualquiera que sepa la URL puede intentar acceder.

**Qué hay que hacer:**
1. Crear `middleware.ts` en la raíz del proyecto.
2. Para las rutas `/dashboard/*`, verificar que haya sesión activa de Supabase.
3. Si no hay sesión, redirigir a `/dashboard/login`.

**Archivos a tocar:**
- Crear: `middleware.ts`

**Estimación:** 0.5 días

---

# BLOQUE 2 — DATOS REALES (eliminar los mocks del camino crítico)

Este es el bloque más grande. Varios componentes del dashboard y del flujo público siguen leyendo datos de constantes hardcodeadas. Para producción, todos deben leer de Supabase.

---

### 🔴 DATA-01 — La carta del menú debe venir de Supabase

**Qué hay hoy:** `OrderFlow.tsx`, `SearchFlow.tsx`, y `LocationMenuPreview.tsx` leen de `DEMO_MENU_ITEMS` y `DEMO_CATEGORIES` — constantes JavaScript definidas en el mismo archivo o importadas. Las tablas `menu_items`, `menu_categories` y `promotions` en Supabase están vacías.

**Qué hay que hacer:**
1. Poblar Supabase con la carta real: las categorías y los 60+ platos con nombre, descripción, precio, categoría, tags de dieta, alérgenos.
2. Crear `lib/services/menuService.ts` con las funciones `getMenuItems(branchId)`, `getCategories()`, `getActivePromotions(branchId)`.
3. Reemplazar las importaciones de `DEMO_MENU_ITEMS` en `OrderFlow.tsx`, `SearchFlow.tsx`, y `LocationMenuPreview.tsx` por llamadas al servicio.
4. Agregar estados de loading y error correctos (skeleton loaders, mensajes de "menú no disponible").
5. Eliminar los archivos de constantes de demo una vez migrado.

**Archivos a tocar:**
- `components/order/OrderFlow.tsx`
- `components/search/SearchFlow.tsx`
- `components/locales/LocationMenuPreview.tsx`
- Crear: `lib/services/menuService.ts`
- Supabase: poblar `menu_items`, `menu_categories`

**Estimación:** 2 días (incluyendo la carga de datos)

---

### 🔴 DATA-02 — PromotionsCMS debe persistir realmente y fallar honestamente

**Qué hay hoy:** `PromotionsCMS.tsx` parte con `DEMO_PROMOTIONS` y si falla el insert a Supabase, igual agrega al estado local y muestra un mensaje de éxito. El operador no sabe si la promoción se guardó o no.

**Qué hay que hacer:**
1. Eliminar `DEMO_PROMOTIONS` como estado inicial — la lista debe cargarse desde Supabase al montar el componente.
2. En el `create`/`update`/`delete`: si Supabase falla, mostrar un toast de error real, NO agregar al estado local.
3. Solo actualizar el estado local si la operación en Supabase fue exitosa.
4. Agregar manejo de loading en cada acción (spinner en el botón mientras guarda).

**Archivos a tocar:**
- `components/dashboard/PromotionsCMS.tsx`

**Estimación:** 0.5 días

---

### 🔴 DATA-03 — LiveOrdersFeed sin datos demo al arrancar

**Qué hay hoy:** `LiveOrdersFeed.tsx` siembra el estado inicial con `DEMO_ORDERS`. Si no hay pedidos reales, el staff ve pedidos ficticios. Esto puede confundir en operación real.

**Qué hay que hacer:**
1. Eliminar `DEMO_ORDERS` del estado inicial.
2. Al montar, hacer un fetch inicial de órdenes del día desde Supabase (`orders` where `created_at >= today` and `branch_id = currentBranch`).
3. Establecer la suscripción realtime de Supabase para nuevos pedidos.
4. Si no hay órdenes, mostrar un empty state: *"No hay pedidos aún hoy."*

**Archivos a tocar:**
- `components/dashboard/LiveOrdersFeed.tsx`

**Estimación:** 0.5 días

---

### 🔴 DATA-04 — KPIs, Analytics y Revenue Chart con datos reales

**Qué hay hoy:** `KPICards.tsx`, `AnalyticsView.tsx`, y `RevenueChart.tsx` retornan números mockeados. El dashboard puede mostrar $4.200.000 de ingresos un día en que no hubo ningún pedido.

**Qué hay que hacer:**
1. Crear `lib/services/analyticsService.ts` con queries a Supabase:
   - `getOrdersToday(branchId)` → count de órdenes del día
   - `getRevenueToday(branchId)` → suma de `final_price` del día
   - `getNewClientsToday(branchId)` → count de `customer_phone` que aparecen por primera vez
   - `getRevenueByDay(branchId, days)` → array de [fecha, monto] para el gráfico
   - `getTopDishes(branchId, limit)` → platos más pedidos
2. Conectar los tres componentes a ese servicio.
3. Agregar skeleton loaders mientras cargan los datos.

**Archivos a tocar:**
- `components/dashboard/KPICards.tsx`
- `components/dashboard/AnalyticsView.tsx`
- `components/dashboard/RevenueChart.tsx`
- Crear: `lib/services/analyticsService.ts`

**Estimación:** 1.5 días

---

### 🔴 DATA-05 — ReservationsView y ReservationsToday con datos reales

**Qué hay hoy:** Ambos componentes (`ReservationsView.tsx` y `ReservationsToday.tsx`) muestran reservaciones mockeadas. Las reservas que el cliente hace desde el formulario de `/reservar` se guardan en Supabase, pero el dashboard no las lee.

**Qué hay que hacer:**
1. Crear `lib/services/reservationService.ts` con `getReservations(branchId, date?)`.
2. Conectar `ReservationsToday.tsx` para leer las de hoy.
3. Conectar `ReservationsView.tsx` para el CRUD completo: listar, cancelar, marcar como llegado.
4. Las acciones (confirmar asistencia, cancelar) deben hacer UPDATE en Supabase y reflejar el cambio en la lista.

**Archivos a tocar:**
- `components/dashboard/ReservationsView.tsx`
- `components/dashboard/ReservationsToday.tsx`
- Crear: `lib/services/reservationService.ts`

**Estimación:** 1 día

---

### 🟡 DATA-06 — MenuView del dashboard con persistencia real

**Qué hay hoy:** El editor de menú en el dashboard opera localmente. Los cambios no persisten a Supabase.

**Qué hay que hacer:**
1. Conectar el editor a `menuService.ts` (crear, actualizar, eliminar items).
2. La imagen del plato debe subirse a Supabase Storage (bucket `menu-images`).
3. Confirmar con toast de éxito/error en cada operación.

**Archivos a tocar:**
- `components/dashboard/MenuView.tsx`
- `lib/services/menuService.ts` (agregar mutations)

**Estimación:** 1 día

---

### 🟡 DATA-07 — OrdersView del dashboard con datos reales y acciones

**Qué hay hoy:** La vista de órdenes muestra datos mockeados. Las acciones (confirmar, cancelar, reembolsar) operan solo en estado local.

**Qué hay que hacer:**
1. Cargar órdenes desde Supabase con filtros funcionales (fecha, estado, tipo, cliente).
2. Las acciones de cambio de estado deben hacer UPDATE en `orders.status`.
3. El cambio de estado debe disparar la notificación push al cliente (ver BLOQUE 4).

**Archivos a tocar:**
- `components/dashboard/OrdersView.tsx`

**Estimación:** 1 día

---

### 🟡 DATA-08 — HorariosView con persistencia real

**Qué hay hoy:** Los botones "Guardar" en horarios hacen un `console.log` y muestran un toast de éxito sin hacer nada en Supabase.

**Qué hay que hacer:**
1. Crear tabla `branch_hours` en Supabase: `branch_id`, `day_of_week`, `open_time`, `close_time`, `is_closed`.
2. Cargar los horarios actuales desde esa tabla al montar el componente.
3. El "Guardar" debe hacer upsert a Supabase.
4. El sitio público (home, locales) debe leer los horarios de la misma tabla.

**Archivos a tocar:**
- `components/dashboard/HorariosView.tsx`
- Supabase: crear tabla `branch_hours`
- `components/home/LocationsSection.tsx` (leer horarios dinámicos)

**Estimación:** 1 día

---

### 🟡 DATA-09 — LoyaltyConfigView con persistencia real

**Qué hay hoy:** La configuración del programa Circle (thresholds de tiers, puntos por acción) no persiste.

**Qué hay que hacer:**
1. Crear tabla `loyalty_config` en Supabase: `bronze_threshold`, `silver_threshold`, `gold_threshold`, `points_per_order`, `points_per_reservation`, etc.
2. Cargar la config al montar, guardar al "Guardar".
3. El sistema de acumulación de puntos debe leer de esta tabla (no valores hardcodeados).

**Archivos a tocar:**
- `components/dashboard/LoyaltyConfigView.tsx`
- `lib/services/loyaltyService.ts`
- Supabase: crear tabla `loyalty_config`

**Estimación:** 1 día

---

### 🟡 DATA-10 — ReservationForm con disponibilidad real por local

**Qué hay hoy:** Los slots de hora son fijos (12:00 a 22:30 siempre disponibles) sin importar si el local está cerrado ese día, si el slot ya tiene el cupo lleno, o si hay un evento privado.

**Qué hay que hacer:**
1. Al seleccionar local + fecha, consultar `branch_hours` para verificar si ese día está abierto.
2. Consultar `reservations` para contar cuántas mesas están tomadas por slot.
3. Desactivar los slots que superen la capacidad máxima por local.
4. Desactivar slots en días cerrados.

**Archivos a tocar:**
- `components/reservar/ReservationForm.tsx`
- `lib/services/reservationService.ts`

**Estimación:** 1 día

---

### 🟡 DATA-11 — Disponibilidad real del pedido demo en API

**Qué hay hoy:** `app/api/orders/[orderId]/route.ts` tiene una ruta que devuelve un pedido demo hardcodeado. En staging parece real.

**Qué hay que hacer:**
1. Eliminar la rama que devuelve el pedido demo.
2. Si el orderId no existe en Supabase, devolver 404 limpio.

**Archivos a tocar:**
- `app/api/orders/[orderId]/route.ts`

**Estimación:** 0.25 días

---

# BLOQUE 3 — ASSETS FALTANTES

Tres archivos que el código referencia y que no existen en `public/`. No tumban el sitio, pero sí rompen el SEO y las notificaciones.

---

### 🔴 ASSET-01 — og-image.jpg (Open Graph)

**Qué hay hoy:** `app/layout.tsx` define `openGraph.images` apuntando a `/og-image.jpg`. El archivo no existe.

**Efecto:** Cuando alguien comparte el link de Rishtedar en WhatsApp, Instagram, LinkedIn o Twitter/X, no aparece ninguna imagen de preview — solo el título. Para un restaurant premium, eso es una pérdida de impacto enorme.

**Qué hay que hacer:**
1. Diseñar una imagen 1200×630 px con el logo de Rishtedar, el tagline *"Donde la India se sienta a la mesa"*, y una foto premium de un plato o del ambiente.
2. Guardar como `/public/og-image.jpg`.
3. Verificar que `app/layout.tsx` lo esté referenciando correctamente.

**Estimación:** 0.25 días (diseño aparte)

---

### 🔴 ASSET-02 — logo.png (Schema.org / SEO estructurado)

**Qué hay hoy:** `components/seo/SchemaOrg.tsx` referencia `/logo.png` para el schema de organización (datos estructurados de Google). El archivo no existe.

**Efecto:** Google no puede indexar el logo del negocio en sus resultados enriquecidos. Para búsquedas de "restaurant indio Santiago", la ausencia del logo perjudica la apariencia en resultados.

**Qué hay que hacer:**
1. Exportar el logo de Rishtedar en formato PNG con fondo transparente, mínimo 512×512 px.
2. Guardar como `/public/logo.png`.

**Estimación:** 0.25 días (diseño aparte)

---

### 🔴 ASSET-03 — icons/badge-72.png (Push Notifications)

**Qué hay hoy:** `public/sw.js` (el Service Worker de notificaciones) y `lib/services/notificationService.ts` referencian `/icons/badge-72.png` como el badge que aparece en la barra de notificaciones de Android. El archivo no existe.

**Efecto:** En Android, cuando llega una notificación push (por ejemplo, "Tu pedido está en camino"), el badge en la barra de notificaciones queda vacío o roto. No tumba la notificación, pero se ve poco profesional.

**Qué hay que hacer:**
1. Crear un ícono de 72×72 px en formato PNG, monocromático (solo el logo o ícono de cubiertos de Rishtedar).
2. Guardar como `/public/icons/badge-72.png`.
3. Revisar si hay otros íconos de la carpeta `/icons/` referenciados en `manifest.json` que también falten.

**Estimación:** 0.25 días

---

# BLOQUE 4 — PAGOS

---

### 🔴 PAY-01 — MercadoPago con credenciales de producción

**Qué hay hoy:** La integración con MercadoPago existe y el flujo de checkout está construido. Lo que no está verificado es si las credenciales son de sandbox (prueba) o de producción.

**Qué hay que hacer:**
1. Obtener las credenciales de producción de MercadoPago del cliente (Public Key + Access Token de producción).
2. Actualizar las variables de entorno en Vercel: `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_PUBLIC_KEY`.
3. Hacer una transacción de prueba real con monto mínimo para verificar que el flujo completo funciona: pedido → checkout → pago → retorno → confirmación.
4. Verificar que el webhook de MercadoPago (que notifica el estado del pago) apunte a la URL correcta de producción.

**Variables de entorno necesarias:**
```
MERCADOPAGO_ACCESS_TOKEN=APP_USR-...  (producción, no sandbox)
MERCADOPAGO_PUBLIC_KEY=APP_USR-...    (producción)
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_USR-...
```

**Estimación:** 0.5 días (incluyendo test de transacción real)

---

### 🟡 PAY-02 — Webhook de confirmación de pago robusto

**Qué hay hoy:** No está claro si el webhook que recibe la confirmación de MercadoPago (cuando el pago es exitoso) actualiza el estado del pedido en Supabase. El flujo del cliente puede llegar a `/order/confirmation` sin que el pedido esté marcado como pagado en la base de datos.

**Qué hay que hacer:**
1. Verificar o crear `app/api/payments/webhook/route.ts`.
2. Al recibir `payment.updated` o `payment.created` con status `approved`, actualizar `orders.status` a `confirmed` en Supabase.
3. Firmar el webhook con el `webhook_secret` de MercadoPago para evitar llamadas falsas.

**Estimación:** 0.5 días

---

# BLOQUE 5 — PUSH NOTIFICATIONS Y EMAIL

---

### 🔴 PUSH-01 — NotificationPrompt con identidad correcta del cliente

**Qué hay hoy:** `components/order/OrderConfirmation.tsx` monta `<NotificationPrompt>` sin pasarle `customerPhone` ni `businessId`. La suscripción se registra en Supabase sin saber a qué cliente o negocio pertenece, por lo que las notificaciones futuras no se pueden enrutar correctamente.

**Qué hay que hacer:**
1. Después de confirmar el pedido, recuperar el `customerPhone` del formulario de checkout y el `businessId` del local elegido.
2. Pasar esos valores al componente `NotificationPrompt` como props.
3. El componente debe incluirlos en el payload del POST a `/api/push/subscribe`.
4. Verificar que la tabla `push_subscriptions` guarda: `endpoint`, `customer_phone`, `business_id`, `branch_id`.

**Archivos a tocar:**
- `components/order/OrderConfirmation.tsx`
- `components/order/NotificationPrompt.tsx` (agregar props)
- `app/api/push/subscribe/route.ts` (verificar que guarda bien)

**Estimación:** 0.5 días

---

### 🔴 PUSH-02 — VAPID keys configuradas en producción

**Qué hay hoy:** Las push notifications necesitan un par de claves VAPID (pública y privada) para funcionar. Si no están configuradas como variables de entorno en producción, el Service Worker no puede suscribirse.

**Qué hay que hacer:**
1. Generar un par de claves VAPID: `npx web-push generate-vapid-keys`
2. Agregar a Vercel:
   ```
   NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
   VAPID_PRIVATE_KEY=...
   VAPID_EMAIL=mailto:admin@rishtedar.cl
   ```
3. Verificar que `app/api/push/send/route.ts` usa estas variables.
4. Hacer una prueba completa: suscribirse desde el celular → confirmar pedido → cambiar estado desde el dashboard → verificar que llega la notificación.

**Estimación:** 0.5 días

---

### 🟡 EMAIL-01 — Resend configurado para confirmaciones transaccionales

**Qué hay hoy:** Los flows de reserva y de pedido mencionan que el cliente recibirá un email de confirmación, pero Resend no está confirmado como configurado y enviando.

**Qué hay que hacer:**
1. Verificar o crear cuenta en Resend con el dominio `rishtedar.cl`.
2. Configurar DNS del dominio para que Resend pueda enviar (registros SPF, DKIM, DMARC).
3. Agregar `RESEND_API_KEY` a las variables de entorno de Vercel.
4. Crear o verificar las funciones de envío:
   - Confirmación de pedido: número de orden, ítems, total, local, ETA estimado.
   - Confirmación de reserva: local, fecha, hora, personas, número de reserva.
   - Bienvenida al Circle: nombre, tier inicial, cómo acumular puntos.
5. Probar cada email en móvil y desktop (Gmail, Outlook, Apple Mail).

**Variables de entorno:**
```
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@rishtedar.cl
```

**Estimación:** 1 día

---

# BLOQUE 6 — SEGURIDAD (RLS)

---

### 🔴 SEC-01 — RLS en loyalty_points y game_scores

**Qué hay hoy:** Las tablas `loyalty_points` y `game_scores` son legibles por el rol `anon` (usuario no autenticado). Cualquiera con acceso a la API de Supabase puede leer los puntos y scores de todos los clientes.

**Qué hay que hacer:**
En Supabase SQL Editor, ejecutar:

```sql
-- loyalty_points: solo el dueño puede leer sus propios datos
ALTER TABLE loyalty_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cliente lee sus propios puntos"
ON loyalty_points FOR SELECT
USING (customer_phone = current_setting('request.jwt.claims', true)::json->>'phone');

-- game_scores: el leaderboard es público, pero solo el dueño puede insertar/actualizar
ALTER TABLE game_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leaderboard público"
ON game_scores FOR SELECT
USING (true);

CREATE POLICY "Solo el cliente puede insertar su score"
ON game_scores FOR INSERT
WITH CHECK (customer_phone = current_setting('request.jwt.claims', true)::json->>'phone');
```

Ajustar según el modelo de autenticación que se implemente (AUTH-02).

**Estimación:** 0.5 días (incluyendo testing de que el leaderboard sigue funcionando)

---

### 🔴 SEC-02 — Columna `notes` en tabla `orders` (verificar drift)

**Qué hay hoy:** `app/api/delivery/[token]/route.ts` hace un SELECT que incluye la columna `notes` de la tabla `orders`. La auditoría detectó que esta columna puede no existir en el schema live de Supabase, lo que haría que el endpoint del driver falle silenciosamente.

**Qué hay que hacer:**
1. En Supabase, verificar el schema real de `orders`: ¿existe la columna `notes`?
2. Si no existe: `ALTER TABLE orders ADD COLUMN notes TEXT;`
3. Si existe pero con otro nombre: actualizar la query en el código.
4. Hacer una prueba real del endpoint: generar un token de driver, abrir `/driver/[token]`, verificar que carga sin errores.

**Archivos a tocar:**
- `app/api/delivery/[token]/route.ts`
- Supabase: verificar/agregar columna

**Estimación:** 0.25 días

---

### 🟡 SEC-03 — Delivery-photos bucket: decidir y documentar si es público o privado

**Qué hay hoy:** El bucket `delivery-photos` existe en Supabase Storage pero hay contradicción: el SQL original lo define como público, `supabase/migrate-v2.sql` lo define como privado con policies. Actualmente está público.

**Qué hay que hacer:**
1. Decidir: ¿las fotos de entrega deben ser públicas (el cliente puede verlas sin autenticación) o privadas (solo el sistema)?
   - **Recomendación:** Públicas para el cliente, privadas para terceros. Usar signed URLs de corta duración.
2. Si se elige privado: actualizar el tracker del cliente para que solicite la URL firmada a través de una API route, no directo desde el storage URL.
3. Actualizar `supabase/migrate-v2.sql` para que sea la única fuente de verdad del schema.
4. Eliminar el SQL viejo de drivers que contradice el nuevo.

**Estimación:** 0.5 días

---

# BLOQUE 7 — FUNCIONALIDAD ADMIN FALTANTE

---

### 🟡 ADMIN-01 — Delivery dashboard con asignación real de repartidor

**Qué hay hoy:** El delivery dashboard muestra órdenes pero la asignación de repartidor y la generación del link de driver no están del todo conectadas al flujo real.

**Qué hay que hacer:**
1. Al hacer click en "Asignar driver" en el dashboard, mostrar un form con nombre del driver.
2. Crear un registro en la tabla `drivers`: `order_id`, `driver_name`, `token` (UUID único), `status`.
3. Generar el link `https://rishtedar.cl/driver/[token]` y mostrarlo para que el staff pueda enviarlo al repartidor por WhatsApp.
4. El dashboard debe actualizar el estado de la orden cuando el driver cambia su estado.

**Archivos a tocar:**
- `components/dashboard/DeliveryView.tsx` (o equivalente)
- `app/api/delivery/assign/route.ts` (crear si no existe)

**Estimación:** 1 día

---

### 🟡 ADMIN-02 — Game tokens server-side (no solo localStorage)

**Qué hay hoy:** Los 3 intentos semanales del juego se guardan en `localStorage`. Un usuario técnico puede abrir las DevTools, borrar esa entrada, y jugar ilimitadamente. El leaderboard queda invalidado.

**Qué hay que hacer:**
1. Agregar columna `weekly_tokens_used` y `week_start` a `loyalty_points` (o crear tabla separada `game_tokens`).
2. Antes de permitir una jugada, consultar el servidor: `POST /api/game/check-tokens`.
3. Al terminar una jugada, decrementar en servidor: `POST /api/game/score` también decrementa el contador.
4. Reset automático cada lunes a medianoche (Supabase scheduled function o cron en Vercel).

**Estimación:** 1 día

---

### 🟢 ADMIN-03 — Notificación push automática al cambiar estado de orden

**Qué hay hoy:** El sistema de push existe pero las notificaciones se envían manualmente o no se envían. El cliente no recibe un aviso cuando su pedido pasa de "Preparando" a "En camino".

**Qué hay que hacer:**
1. En cada endpoint que cambia `orders.status`, después del UPDATE, buscar las suscripciones push del cliente (`push_subscriptions where customer_phone = ?`).
2. Enviar notificación: *"🛵 Tu pedido está en camino — 10-15 min"*, *"✅ Tu pedido fue entregado"*, etc.
3. Verificar que funciona en iOS Safari (donde las push son más restrictivas) y en Android Chrome.

**Estimación:** 1 día

---

### 🟢 ADMIN-04 — Reset semanal del leaderboard

**Qué hay hoy:** No hay mecanismo de reset. Los scores de juego se acumulan indefinidamente.

**Qué hay que hacer:**
1. Crear un Supabase Edge Function o un endpoint en Vercel con un cron job que corra cada lunes a las 00:01.
2. La función archiva los scores de la semana anterior en una tabla `game_scores_archive`.
3. Resetea `game_scores` para la nueva semana.
4. Opcionalmente, envía un push/email a los ganadores de la semana anterior con su premio.

**Estimación:** 0.5 días

---

# BLOQUE 8 — SCHEMA / BASE DE DATOS

---

### 🟡 DB-01 — Un único archivo SQL como fuente de verdad

**Qué hay hoy:** Hay dos archivos SQL en el repo (`supabase/migrations/` y `supabase/migrate-v2.sql`) que se contradicen en algunos puntos (bucket delivery-photos, políticas de RLS). El estado real de Supabase no coincide 100% con ninguno de los dos.

**Qué hay que hacer:**
1. Auditar el schema real de Supabase (exportar con `supabase db dump`).
2. Crear un único archivo `supabase/schema.sql` que represente el estado actual de la base de datos.
3. Eliminar o archivar los archivos SQL anteriores.
4. Documentar en el README cómo aplicar el schema a un Supabase nuevo (para cuando haya que crear un entorno de staging).

**Estimación:** 0.5 días

---

### 🟡 DB-02 — Tablas faltantes para funcionalidad completa

Las siguientes tablas están referenciadas en el código pero pueden no existir o estar incompletas en Supabase live:

| Tabla | Para qué | Acción |
|-------|----------|--------|
| `branch_hours` | Horarios dinámicos por local | Crear |
| `loyalty_config` | Configuración del Circle | Crear |
| `game_tokens` | Control server-side de intentos | Crear o agregar columnas a `loyalty_points` |
| `staff_profiles` | Roles y permisos del staff | Crear (depende de AUTH-01) |
| `menu_images` | Bucket de Storage para fotos de menú | Crear bucket en Supabase Storage |

**Estimación:** 0.5 días (solo la parte SQL; la integración en código está en DATA-06 y DATA-08)

---

# BLOQUE 9 — VARIABLES DE ENTORNO (checklist completo)

Antes de ir a producción, todas estas variables deben estar configuradas en Vercel:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...      # Solo en server-side, NUNCA en NEXT_PUBLIC_

# MercadoPago
MERCADOPAGO_ACCESS_TOKEN=APP_USR-...  # Producción (no sandbox)
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_USR-...

# Push Notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BN...
VAPID_PRIVATE_KEY=...
VAPID_EMAIL=mailto:admin@rishtedar.cl

# Email
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@rishtedar.cl

# App
NEXT_PUBLIC_APP_URL=https://rishtedar.cl
NODE_ENV=production
```

**Acción antes de deploy:** Auditar que ninguna variable de sandbox/desarrollo esté hardcodeada en el código (grep por `sandbox`, `test_key`, `localhost` en archivos de producción).

---

# ORDEN RECOMENDADO DE EJECUCIÓN

Si se trabaja con un developer, este es el orden lógico para no bloquear dependencias:

```
SEMANA 1 (4–5 días):
  Día 1: ASSET-01, ASSET-02, ASSET-03, SEC-02 (rápidos, sin riesgo)
  Día 2: PAY-01 + PAY-02 (pagos en producción)
  Día 3: DATA-01 parte 1 (poblar Supabase con menú real)
  Día 4: DATA-01 parte 2 (conectar código al menú real)
  Día 5: DATA-02, DATA-03, DATA-11 (mocks eliminados del camino crítico)

SEMANA 2 (5–6 días):
  Día 6: AUTH-01 (login staff real)
  Día 7: AUTH-02 + AUTH-03 (login cliente + middleware)
  Día 8: SEC-01, SEC-03 (RLS + delivery photos)
  Día 9: PUSH-01, PUSH-02, EMAIL-01 (notificaciones y email)
  Día 10: DATA-04, DATA-05 (analytics y reservas reales)

SEMANA 3 (si hay tiempo):
  DATA-06 a DATA-10 (funcionalidad admin completa)
  ADMIN-01, ADMIN-02 (delivery real, tokens de juego)
  DB-01, DB-02 (limpieza de schema)
  ADMIN-03, ADMIN-04 (notificaciones automáticas, leaderboard)
```

---

# LO QUE YA ESTÁ LISTO Y NO HAY QUE TOCAR

Para no rehacer trabajo que ya funciona:

- ✅ Estructura de rutas completa (Next.js App Router)
- ✅ Diseño visual 100% — no hay nada que cambiar en CSS/Tailwind/Framer
- ✅ Flujo de checkout (pasos, validaciones, UI)
- ✅ Tracker de pedido (UI y lógica de estados)
- ✅ Flujo de reserva (UI de 3 pasos, validaciones)
- ✅ Circle/App (onboarding, TierCard, QR, UI completa)
- ✅ El Festín (juego funcional, scoring, UI)
- ✅ Driver view (UI, foto upload, Google Maps link)
- ✅ Dashboard sidebar y layout
- ✅ Scanner QR (html5-qrcode, parsing del formato correcto)
- ✅ BranchLogin (bug miami/miami-wynwood corregido)
- ✅ Deep-link ?item= (corregido)
- ✅ Aplicación de promociones al carrito (corregido)
- ✅ Tablas Supabase: orders, reservations, loyalty_points, push_subscriptions, drivers, delivery_tracking, game_scores (existen)
- ✅ Bucket delivery-photos (existe y operativo)
- ✅ Circle routing (/circle/dashboard → /app)
- ✅ Manifest.json sin screenshot faltante
- ✅ Build sin errores, lint sin errores

---

*Documento técnico de transición demo → producción.*
*Elaborado en base a auditoría completa del repo. Abril 2026.*
*Rishtedar · rishtedar.cl*
