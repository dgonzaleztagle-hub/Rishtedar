---
name: Toteat Integration — Full Workflow
description: Bloqueado por credenciales. Una vez lleguen → rediseñar menú + orden → cocina
type: project
---

# Toteat Integration — Full Scope

**Status:** ⏳ BLOQUEADO (esperando credenciales del gerente)  
**Timeline:** Post-credenciales (~3-4 semanas estimated)  
**Scope Completo:** Menu sync + Orden → Cocina + KPIs

---

## Contexto Actual

### Blocker
- ❌ Credenciales de Toteat no llegaron (esperando del gerente)
- ❌ Sin credenciales → no puedo hacer API pull del menú

### Lo que Existe Hoy
- ✅ Dashboard menú (hardcodeado/demo)
- ✅ Orders system (sin integración real)
- ❌ Menú real de Toteat → no sincronizado
- ❌ Flujo orden → cocina → no está automated

### Lo que Debe Pasar (Una vez lleguen credenciales)

```
1. PULL MENÚ
   Credenciales Toteat
   ↓
   API Toteat → traer items, precios, extras
   ↓
   Sincronizar en BD (mapeo categorías, atributos)

2. REDISEÑAR MENÚ
   - Carrito de compra
   - Seleccionar extras
   - Validar disponibilidad
   - Calcular precio final
   
3. ORDEN → COCINA
   Cliente paga (MP o manual)
   ↓
   Orden va a BD
   ↓
   Push a pantalla de cocina (KITCHEN_DISPLAY_SYSTEM)
   ↓
   Cocina marca "listo"
   ↓
   Cliente notificado

4. DELIVERY/TAKEOUT
   - Si delivery: asignar driver, tracking
   - Si takeout: cliente retira (QR check-in)
```

---

## Detalle Técnico: Qué Necesita Cambiar

### 1. Menu Architecture (Hoy vs. Después)

**HOY (Demo/Hardcodeado):**
```typescript
// components/MenuView.tsx
const DEMO_MENU = [
  { id: 1, name: "Biryani", price: 15000, category: "main" },
  // ...
];
```

**DESPUÉS (Sincronizado Toteat):**
```typescript
// app/api/menu/route.ts → fetches from DB
// menu items sincronizados vía Toteat API
// extras/complementos mapeados
// precios dinámicos
```

---

### 2. Order Flow Rediseño

**Flujo Actual:**
- Cliente ve demo items
- Ordena (sin pagar realmente)
- Aparece en dashboard (pero sin ir a cocina)

**Flujo Futuro:**
```
1. Cliente entra, ve menú REAL de Toteat
2. Selecciona items + extras
3. Calcula precio final (con impuestos?)
4. Procesa pago (MP, manual, etc.)
5. ORDEN → API orders/create
6. ORDER → DB orders + order_items
7. ORDEN → Pantalla de cocina (realtime via Supabase)
8. Cocina marca items como "ready"
9. Cliente ve "Tu orden está lista"
10. Entrega (delivery/takeout)
```

---

### 3. Kitchen Display System

**Qué necesita:**
- Pantalla en cocina que ve órdenes en realtime
- Items por marcar "listo"
- Prioridad por tiempo (FIFO o custom)
- Notificación visual/sonora cuando llega orden

**Tecnología:**
- Supabase realtime (postgres_changes)
- Framer Motion (animaciones)
- Simple, sin complejidad

---

### 4. Menu Rediseño UX

**Cambios en UI:**
- Menu items con imágenes REALES (de Toteat)
- Extras/complementos como expandible
- Carrito visual (cantidad, subtotal)
- Validación "cantidad disponible"
- Indicador "sin stock" o "tiempo de prep"

**Cambios en Código:**
```typescript
// NEW: app/api/menu/sync/route.ts
// Cron job o manual trigger para sincronizar desde Toteat

// NEW: components/MenuItemSelector.tsx
// Componente para elegir item + extras

// NEW: components/CartSummary.tsx
// Mostrar orden antes de pagar

// EXISTING: app/api/orders/create/route.ts
// Validar contra menú real (no hardcodeado)
```

---

## Secuencia: Qué Hace Cuándo

### Fase A: Credenciales Toteat (0 días)
```
Credenciales llegan
→ Guardar en .env.local
→ Test API Toteat sandbox
```

### Fase B: Menu Sync (1-2 días)
```
Crear endpoint: GET /api/menu/sync
Lógica:
  1. Fetch desde Toteat API
  2. Map categorías (Toteat → nuestro schema)
  3. Map extras (complementos → nuestro schema)
  4. Upsert en DB menu_items
  5. Verificar imágenes (guardar URLs o descargar)
  6. Actualizar precios
  
Resultado: menu_items en DB sincronizado
```

### Fase C: Menu UI Rediseño (3-4 días)
```
1. Nueva estructura de componentes:
   - MenuCategory (loop categorías)
   - MenuItem (con imagen, precio, click para expandir)
   - ItemSelector (popup/modal con extras)
   - CartSummary (floating, mini preview)

2. Lógica:
   - State: selected items + quantities
   - Fetch extras cuando click en item
   - Calcular subtotal en realtime
   - Handle "sin stock"

3. Conexión:
   - GET /api/menu → lista items + extras
   - POST /api/orders/create ← carrito completo
```

### Fase D: Kitchen Display (2-3 días)
```
1. Nueva página: /dashboard/kitchen
   - Tabla/grid de órdenes
   - Items a marcar "ready"
   - Sonido/notificación cuando orden nueva

2. Lógica:
   - Supabase realtime listener en orders tabla
   - Filter: order_status = 'pending', branch = staff's branch
   - Click item → UPDATE order_items.status = 'ready'
   - Cuando todos items ready → UPDATE order.status = 'ready_for_delivery'

3. Cliente ve:
   - Notificación push "Tu orden está lista"
   - En app: estado "Listo para retirar/entregar"
```

### Fase E: Delivery/Takeout Split (1-2 días)
```
1. En checkout: opción delivery O takeout
2. Si takeout:
   - Mostrar "Retira en: XX:XX"
   - QR para check-in en tienda
   
3. Si delivery:
   - Seleccionar dirección
   - Asignar driver (o tercero)
   - Tracking en tiempo real
```

---

## Dependencias & Blockages

### Esperar Credenciales
- ❌ Sin credenciales → no puedo sincronizar menú
- ❌ Sin menú real → no puedo testear orden → cocina
- ⏳ Timeline: "Cuando lleguen" (unknown)

### Una Vez Lleguen, Necesito
- ✅ API key de Toteat
- ✅ Documentación de endpoints (items, extras, precios)
- ✅ Imágenes de items (dónde están? URL pública o debo descargar?)
- ✅ Categorías/subcategorías (¿cómo está estructurado?)

### No Espera Nada Más
- ✅ Orders API ya existe
- ✅ Auth ya existe
- ✅ BD ya existe
- ✅ Realtime (Supabase) ya existe

---

## Impacto en Priorización Global

**Esto cambia CUÁNDO hacer qué:**

### AHORA (Sin Toteat)
- ✅ Arreglar P0 security (Orders, Reservations) → 3h
- ✅ UI/UX improvements (dashboard, reservations)
- ✅ Bug fixes menores

### CUANDO LLEGUEN CREDENCIALES
- 🔴 Pause todo lo demás
- ✅ Sprint: Menu sync (2 días)
- ✅ Sprint: Menu UI (4 días)
- ✅ Sprint: Kitchen display (3 días)
- ✅ Sprint: Testing en sandbox Toteat

### DESPUÉS DE TOTEAT MVP
- ✅ Delivery request external (Uber Direct)
- ✅ Analytics/KPIs (ahora con datos reales)
- ✅ Migrations a BD propia del negocio

---

## Checklist: Cuando Lleguen Credenciales

Antes de empezar dev:

- [ ] Credenciales en .env (API key, secret)
- [ ] Documentación Toteat API (endpoints, response schema)
- [ ] Catálogo Toteat (items, categorías, extras)
- [ ] Precios (¿son fijos o dinámicos por tiempo?)
- [ ] Imágenes (¿dónde? URL pública?)
- [ ] Horario (¿abren/cierran? ¿hay items con disponibilidad hora?)

Sin esto → no puedo empezar.

---

## Tech Stack para Toteat

```
Frontend:
- Next.js API route: GET /api/menu (fetch from Toteat)
- Framer Motion: animaciones al agregar al carrito
- Zustand: estado global del carrito

Backend:
- API Toteat (HTTP client)
- DB: menu_items, order_items (schema existente)
- Supabase realtime: kitchen display

Extras:
- Sharp/next/image: procesar imágenes de Toteat
- Cron (node-cron o similar): sync periódico
```

---

## Próximos Pasos

1. **Hoy:** Esperar credenciales (nada que hacer)
2. **Cuando lleguen:** 
   - Validar API en sandbox
   - Planificar sprint (2 semanas?)
   - Asignar resources
3. **Dev:** Seguir checklist de Fase B-E

---

## Documentación Existente

- Orders flow: `memory/reservations_staff_dashboard.md`
- Auth: `memory/auth_system.md`
- KPIs: `memory/dashboard_plan.md`
