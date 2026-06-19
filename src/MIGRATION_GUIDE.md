# 📘 Documento Técnico de Migración: Base44 → Supabase + React

> **App origen:** Gestión de Prensa y Premios (Base44)
> **Fecha del documento:** 19 de junio de 2026
> **Stack destino:** React (Vite) + Supabase (Postgres + Auth + Storage + Edge Functions)

---

## 1. DESCRIPCIÓN GENERAL

### Propósito
Aplicación interna de gestión y automatización de **envíos de contenido editorial** para una agencia de prensa que trabaja con varios medios (La Razón, ABC, Expansión, El Economista, etc.). La app actúa como **frontend operativo** que recopila datos + archivos, los **reenvía a un workflow externo (Make/n8n)** mediante webhooks y deja registro de cada envío.

### Casos de uso principales
1. **Publicaciones de empresa**: subir un Word + imágenes/PDFs de una entrevista/redaccional y enviarlo al sistema de maquetación del medio.
2. **Premios / Eventos**: registrar un evento de premios con vídeo de YouTube, imágenes, PDFs y hasta 6 noticias asociadas (que pueden generarse automáticamente con **IA + búsqueda en internet**).
3. **Historial / Reenvío**: consultar todos los envíos hechos y poder relanzarlos si fallan.

### Usuarios objetivo
- Equipo interno de la agencia de prensa (1 perfil, todos administradores en la práctica).
- No es una app pública ni multi-tenant: todos los usuarios autenticados ven los mismos datos.

### Flujo principal de negocio
```
Usuario rellena formulario → Sube archivos (Storage) → Frontend llama Edge Function →
Edge Function reenvía payload a webhook externo (Make/n8n) → Make procesa y publica →
Frontend guarda registro en BD (entidad Envio) con status enviado/error
```

---

## 2. ENTIDADES / BASE DE DATOS

### 2.1 Resumen

| Entidad | Uso real | Registros prod. | Notas |
|---|---|---|---|
| `Envio` | **Activa**. Log de todos los envíos. | **249** | Tabla principal de lectura |
| `Publicacion` | ⚠️ Definida pero **NO usada** | 0 | Schema legacy, no escribir |
| `Premio` | ⚠️ Definida pero **NO usada** | 0 | Schema legacy, no escribir |
| `User` (built-in Base44) | Auth | (n/d) | Solo `etobcn@yahoo.es` activo |

> **⚠️ Importante para la migración:** Solo `Envio` contiene datos reales. Las entidades `Publicacion` y `Premio` están definidas en el esquema pero **el código nunca las usa** — los formularios escriben directamente en `Envio`. En Supabase **no es necesario migrarlas**, salvo que se quiera mantener compatibilidad futura.

---

### 2.2 Entidad `Envio` (tabla principal)

Tabla Postgres sugerida: `envios`

| Campo | Tipo Base44 | Tipo Postgres sugerido | Nullable | Default | Notas |
|---|---|---|---|---|---|
| `id` | string (built-in) | `uuid` PK | NO | `gen_random_uuid()` | Reemplaza el id de Base44 |
| `created_date` | datetime (built-in) | `timestamptz` | NO | `now()` | Equivalente a `created_at` |
| `updated_date` | datetime (built-in) | `timestamptz` | NO | `now()` | Equivalente a `updated_at` (trigger) |
| `created_by_id` | string (built-in) | `uuid` FK → `auth.users` | YES | `auth.uid()` | Quién creó el registro |
| `tipo` | enum | `text` con CHECK | NO | — | `'publicacion'` \| `'premio'` |
| `fecha_envio` | datetime ISO | `timestamptz` | NO | `now()` | Cuándo se hizo el envío |
| `status` | enum | `text` con CHECK | NO | `'enviado'` | `'enviado'` \| `'error'` |
| **Campos de PUBLICACIÓN** | | | | | (solo se llenan si `tipo='publicacion'`) |
| `nombre_empresa` | string | `text` | YES | — | Nombre del cliente |
| `fecha_publicacion` | date | `date` | YES | — | Fecha de salida en el medio |
| `medio` | string | `text` | YES | — | Ver lista de enums abajo |
| `formato` | string | `text` | YES | — | Ver lista de enums abajo |
| `enlaces` | boolean | `boolean` | YES | `false` | Si lleva enlaces |
| `premio` | string | `text` | YES | — | Premio asociado (texto libre, opcional) |
| `documento_word_urls` | string[] | `text[]` | YES | `'{}'` | URLs de Word subidos |
| `imagenes_urls` | string[] | `text[]` | YES | `'{}'` | URLs de imágenes y PDFs |
| **Campos de PREMIO** | | | | | (solo se llenan si `tipo='premio'`) |
| `nombre_premio` | string | `text` | YES | — | Nombre del premio/evento |
| `fecha_gala` | date | `date` | YES | — | Fecha de la gala |
| `youtube_url` | string | `text` | YES | — | URL del vídeo |
| `drive_url` | string | `text` | YES | — | URL de Google Drive (NO se escribe nunca desde el código actual, solo se lee) |
| `imagen_grupal_urls` | string[] | `text[]` | YES | `'{}'` | URLs de imágenes grupales del premio |

#### Enums declarados en el schema

| Campo | Valores válidos |
|---|---|
| `tipo` | `publicacion`, `premio` |
| `status` | `enviado`, `error` (default `enviado`) |

#### Enums adicionales hardcodeados en frontend (no en el schema de `Envio`, pero validados en `pages/Publicaciones`)

| Campo | Valores válidos |
|---|---|
| `medio` | `A Tu Salud`, `ABC`, `Actualidad Económica`, `Economista`, `Mundo`, `Periódico`, `Expansión`, `Razón`, `Vanguardia`, `Europa`, `Renfe`, `Salud & Vida`, `Tu economía` |
| `formato` | `Redaccional`, `Entrevista`, `2 Entrevistas` |

#### Índices recomendados
```sql
CREATE INDEX envios_fecha_envio_desc_idx ON envios (fecha_envio DESC);
CREATE INDEX envios_tipo_idx ON envios (tipo);
CREATE INDEX envios_created_by_id_idx ON envios (created_by_id);
CREATE INDEX envios_status_idx ON envios (status);
```
Justificación: la query principal de la página `Envios` ordena por `fecha_envio DESC` y luego filtra por `tipo`.

#### DDL completo sugerido
```sql
CREATE TABLE envios (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  created_by_id   uuid REFERENCES auth.users(id) ON DELETE SET NULL,

  tipo            text NOT NULL CHECK (tipo IN ('publicacion','premio')),
  fecha_envio     timestamptz NOT NULL DEFAULT now(),
  status          text NOT NULL DEFAULT 'enviado' CHECK (status IN ('enviado','error')),

  -- Publicación
  nombre_empresa       text,
  fecha_publicacion    date,
  medio                text,
  formato              text,
  enlaces              boolean DEFAULT false,
  premio               text,
  documento_word_urls  text[] DEFAULT '{}',
  imagenes_urls        text[] DEFAULT '{}',

  -- Premio
  nombre_premio       text,
  fecha_gala          date,
  youtube_url         text,
  drive_url           text,
  imagen_grupal_urls  text[] DEFAULT '{}'
);

CREATE INDEX envios_fecha_envio_desc_idx ON envios (fecha_envio DESC);
CREATE INDEX envios_tipo_idx ON envios (tipo);
CREATE INDEX envios_created_by_id_idx ON envios (created_by_id);
```

### 2.3 Relaciones
- **No hay relaciones FK entre entidades del dominio.** Todo está embebido en `Envio` (los arrays de URLs son arrays simples, no FKs).
- Única FK: `created_by_id → auth.users.id`.

### 2.4 Campos calculados / derivados
- Ninguno almacenado.
- En frontend se derivan visualmente: badges de estado, conteos de archivos (`envio.documento_word_urls.length`), formato de fechas.

---

## 3. ROLES Y PERMISOS

### 3.1 Roles existentes
- **`admin`** (todos los usuarios de la app son admin en la práctica).
- **`user`** (definido en Base44 pero no usado).

### 3.2 Matriz de permisos (estado actual)

| Acción | admin | user |
|---|---|---|
| Crear `Envio` | ✅ | ✅ |
| Listar `Envio` | ✅ (ve TODOS) | ✅ (ve TODOS) |
| Editar `Envio` | — (no se hace en UI) | — |
| Eliminar `Envio` | — (no se hace en UI) | — |
| Invocar `webhookPublicaciones` | ✅ | ✅ |
| Invocar `webhookPremiosPublicar` | ✅ | ✅ |
| Invocar `webhookPremiosNoticias` | ✅ | ✅ |

### 3.3 Restricciones por propiedad / departamento
- **NO existe restricción "por propiedad"**: el listado de `Envios` muestra todos los registros sin filtrar por `created_by_id`. Es una app de equipo donde todos ven todo.
- **No hay departamentos, delegaciones ni multi-tenant.**

### 3.4 Política RLS sugerida en Supabase

```sql
ALTER TABLE envios ENABLE ROW LEVEL SECURITY;

-- Todos los usuarios autenticados pueden leer todo
CREATE POLICY "envios_select_authenticated" ON envios
  FOR SELECT TO authenticated USING (true);

-- Solo usuarios autenticados pueden insertar; created_by_id se rellena automático
CREATE POLICY "envios_insert_authenticated" ON envios
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by_id);

-- (Opcional, si se quiere permitir edición posterior)
CREATE POLICY "envios_update_owner_or_admin" ON envios
  FOR UPDATE TO authenticated
  USING (auth.uid() = created_by_id OR (auth.jwt() ->> 'role') = 'admin');
```

---

## 4. PÁGINAS Y COMPONENTES

### 4.1 Mapa de páginas

| Página | Ruta | Rol | Layout | Componente principal |
|---|---|---|---|---|
| Publicaciones (home) | `/` y `/Publicaciones` | autenticado | `Layout.jsx` (sidebar) | `pages/Publicaciones.jsx` |
| Premios | `/Premios` | autenticado | `Layout.jsx` | `pages/Premios.jsx` |
| Envíos (historial) | `/Envios` | autenticado | `Layout.jsx` | `pages/Envios.jsx` |

> El `mainPage` actual en `pages.config.js` es **`Publicaciones`** → ruta `/` carga el formulario de publicaciones.

### 4.2 Página: `Publicaciones`

- **Rol:** autenticado.
- **Entidades:** lee `location.state.reenvio` (Envio previo); **escribe** en `Envio` tras el envío.
- **Integraciones:** `UploadFile` (Storage), `webhookPublicaciones` (Edge Function).

#### Formulario
| Campo | Componente | Obligatorio | Validación |
|---|---|---|---|
| `nombre_empresa` | `DarkInput` | ✅ (en schema) | texto libre |
| `fecha` | `DarkInput` type=date | ✅ | YYYY-MM-DD |
| `medio` | `DarkSelect` | ✅ | uno de los 13 enums |
| `formato` | `DarkSelect` | ✅ | uno de los 3 enums |
| `enlaces` | `ToggleSwitch` | NO | boolean (default false) |
| `premio` | `DarkInput` (optional) | NO | texto libre |
| Word (drop zone) | `FileDropZone` (.doc,.docx) | NO | un solo archivo |
| Imágenes/PDFs | `FileDropZone` multiple | NO | varios archivos |

> ⚠️ El frontend **NO bloquea** el envío si faltan campos; el schema sí lo marca como obligatorio. La validación cliente debería añadirse en la migración.

#### Botones de acción reseteo
- **Actualizar** (arriba derecha): resetea form + adjuntos + status.
- **Eliminar adjuntos** (en card de Adjuntos): limpia solo `wordFiles` y `mediaFiles`.

#### Modo "Reenvío"
Si `location.state.reenvio` viene desde `EnvioDetalle`, el formulario se prerellena con los datos del envío anterior (pero los archivos hay que volver a subirlos — no se guardan los blobs originales, solo URLs).

### 4.3 Página: `Premios`

- **Rol:** autenticado.
- **Entidades:** lee `location.state.reenvio`; **escribe** en `Envio` con `tipo='premio'`.
- **Integraciones:** `UploadFile` x6 (un dropzone por categoría), `webhookPremiosNoticias` (búsqueda IA), `webhookPremiosPublicar` (envío final).
- **LocalStorage:** clave `premios_noticias_guardadas` (hasta 10 entradas de noticias guardadas localmente).

#### Formulario principal
| Campo | Tipo | Notas |
|---|---|---|
| `nombre_premio` | texto | Obligatorio para buscar noticias |
| `fecha_gala` | date | Opcional |
| `enlace_video` | URL | YouTube |
| `noticia_premio` | URL | Noticia "oficial" del premio |

#### 6 dropzones de adjuntos
`Imagen Destacada`, `Imagen Cabecera`, `Imagen Grupal`, `PDF Gala`, `Noticia Papel`, `Autopublicidad`.

#### Módulo de Noticias (IA)
- Botón **🤖 Buscar Noticias con IA** → llama `webhookPremiosNoticias` con `{premio, fecha_gala}` (timeout 90s).
- Devuelve hasta **12 resultados**, el usuario selecciona hasta **6**.
- Cada noticia: `titulo`, `texto`, `link`.
- Permite **guardar localmente** sets de noticias para reutilizarlos.
- En el payload final del webhook, las 6 noticias se **aplanan** así:
  ```
  premio_noticias_titulo_1, premio_noticias_texto_1, premio_noticias_link_1
  premio_noticias_titulo_2, ...
  ... hasta premio_noticias_link_6
  ```

#### Datos que se guardan en `Envio` (reducidos vs payload)
Solo se persiste:
```
{tipo:'premio', fecha_envio, nombre_premio, fecha_gala, youtube_url, imagen_grupal_urls, status}
```
**Los demás archivos (destacada, cabecera, pdf gala, papel, autopublicidad) y las noticias NO se guardan en `Envio`** — se envían al webhook externo pero no quedan en BD. **Esto es por diseño**, pero debe documentarse: al "Volver a enviar" un premio, esos campos vienen vacíos.

### 4.4 Página: `Envios`

- **Rol:** autenticado.
- **Entidades:** lee `Envio.list('-fecha_envio', 100)` con react-query.
- **Filtro UI:** `todos | publicacion | premio` (cliente, no en query).
- **Acción:** click en una tarjeta abre modal `EnvioDetalle`.

### 4.5 Componente `EnvioDetalle`
Modal que muestra metadatos del envío y un botón **"Volver a enviar"** que hace `navigate('/Publicaciones'|'/Premios', { state: { reenvio: envio } })`.

### 4.6 Componentes compartidos
| Componente | Función |
|---|---|
| `Layout.jsx` | Sidebar con 3 ítems (Publicaciones, Premios, Envíos) |
| `components/shared/FormCard` | Card con título/descripción y body |
| `components/shared/DarkInput` | Input estilizado dark |
| `components/shared/DarkSelect` | Select estilizado dark |
| `components/shared/ToggleSwitch` | Switch Sí/No |
| `components/shared/FileDropZone` | Dropzone con files controlados/uncontrolados |

---

## 5. FUNCIONES BASE44 (Edge Functions)

### 5.1 `webhookPublicaciones`

| Atributo | Valor |
|---|---|
| **Trigger** | Manual desde `pages/Publicaciones` (al pulsar "Procesar Publicación") |
| **Entrada** | JSON con todos los campos del form + arrays `documento_word_urls` e `imagenes_urls` |
| **Salida** | `{success: true}` o `{error, detail}` |
| **Acción** | Proxy HTTP simple: hace POST al secret `WEBHOOK_PUBLICACIONES` (Make/n8n) |
| **Auth** | No exige auth (el webhook externo es la integración) |

#### Payload de entrada
```json
{
  "nombre_empresa": "string",
  "fecha": "YYYY-MM-DD",
  "medio": "string",
  "formato": "string",
  "enlaces": "boolean",
  "premio": "string",
  "documento_word_urls": ["url"],
  "imagenes_urls": ["url"]
}
```

### 5.2 `webhookPremiosPublicar`

| Atributo | Valor |
|---|---|
| **Trigger** | Manual desde `pages/Premios` (al pulsar "Publicar Evento de Premio") |
| **Entrada** | JSON con datos del premio + URLs de adjuntos + 18 campos planos de noticias |
| **Salida** | `{success: true}` o `{error, detail}` |
| **Acción** | Proxy HTTP a `WEBHOOK_PREMIOS_PUBLICAR` |

#### Payload de entrada
```json
{
  "premio": "string",
  "fecha_gala": "YYYY-MM-DD",
  "youtube_url": "url",
  "noticia_premio_url": "url",
  "imagen_destacada_urls": ["url"],
  "imagen_cabecera_urls": ["url"],
  "imagen_grupal_urls": ["url"],
  "pdf_gala_urls": ["url"],
  "noticia_papel_urls": ["url"],
  "autopublicidad_urls": ["url"],
  "premio_noticias_titulo_1": "string",
  "premio_noticias_texto_1": "string",
  "premio_noticias_link_1": "url",
  "...": "(idem hasta _6)"
}
```

### 5.3 `webhookPremiosNoticias` ⭐ (la más compleja)

| Atributo | Valor |
|---|---|
| **Trigger** | Manual desde `pages/Premios` (al pulsar "Buscar Noticias con IA"), timeout 90s |
| **Entrada** | `{premio: string, fecha_gala?: string}` |
| **Salida** | `{noticias: [{titulo, texto, link}, ...]}` o `{error}` |
| **Acción** | Llama a **InvokeLLM con `gemini_3_flash` + `add_context_from_internet=true`** para buscar noticias reales del premio en internet. |
| **Filtros aplicados** | Descarta links no-http y `google.com/search`. Mantiene redirectores de `vertexaisearch`. |
| **Prioridad de medios** (en el prompt) | larazon.es y suplementos regionales, medios económicos y locales |

#### ⚠️ Punto crítico para la migración
Esta función **depende de Base44 InvokeLLM con grounding en Google Search**. Al migrar:
1. **Sustituir por OpenAI** → no soporta web search nativo, requiere SerpAPI / Tavily / Brave Search + LLM.
2. **Sustituir por Gemini directo** (Google AI Studio API) → mantiene grounding pero hay que gestionar la API key de Google.
3. **Recomendado:** **Gemini 2.x con Google Search Grounding** (API directa) por paridad funcional.

---

## 6. INTEGRACIONES EXTERNAS

### 6.1 `base44.integrations.Core.UploadFile`

- **Usado en:** `pages/Publicaciones` (Word + imágenes/PDFs) y `pages/Premios` (6 categorías de adjuntos).
- **Tipo de archivos:** `.doc`, `.docx`, `image/*`, `.pdf`.
- **Devuelve:** `{file_url: string}` → URL pública persistente.
- **Sustitución en Supabase:**
  - Bucket **público** `envios-attachments` (los URLs públicos se reenvían a Make/n8n; necesitan ser accesibles sin firma).
  - Convención de paths: `{user_id}/{envio_tipo}/{timestamp}_{filename}`.
  - Función helper sugerida:
    ```ts
    async function uploadFile(file: File): Promise<string> {
      const path = `${user.id}/${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from('envios-attachments').upload(path, file);
      if (error) throw error;
      return supabase.storage.from('envios-attachments').getPublicUrl(path).data.publicUrl;
    }
    ```

### 6.2 Envío de emails
**No se usa.** No hay `SendEmail` en el código.

### 6.3 Webhooks externos (Make / n8n)
3 secretos configurados, ya operativos:
| Secret | Uso | Destino real |
|---|---|---|
| `WEBHOOK_PUBLICACIONES` | Reenvío de publicaciones | Make/n8n (URL en secret) |
| `WEBHOOK_PREMIOS_PUBLICAR` | Reenvío de premios | Make/n8n |
| `WEBHOOK_PREMIOS_NOTICIAS` | ⚠️ **Definido pero NO usado**. La búsqueda de noticias usa InvokeLLM, no este webhook. | — |

> **Acción en migración:** trasladar los 3 secrets a las **Edge Functions de Supabase** (`supabase secrets set WEBHOOK_PUBLICACIONES=...`). El webhook `WEBHOOK_PREMIOS_NOTICIAS` puede descartarse si se confirma que no se usa.

### 6.4 IA / LLM
`base44.asServiceRole.integrations.Core.InvokeLLM` con `gemini_3_flash` + búsqueda en internet — ver §5.3.

### 6.5 Notificaciones internas
**No hay.** No existen toasts/push/email transaccional al usuario.

---

## 7. WORKFLOWS Y TRANSICIONES DE ESTADO

### 7.1 Entidades con estado
Solo `Envio.status` con dos valores: `enviado` | `error`.

### 7.2 Transiciones
```
[crear Envio] ──┬─→ webhook 200 OK → status = 'enviado'
                └─→ webhook fail   → status = 'error'
```
Es un **estado terminal**: una vez creado el `Envio`, su `status` **no cambia**. Si falla, el usuario puede usar "Volver a enviar" que **crea un nuevo `Envio`** (no actualiza el anterior).

### 7.3 Efectos automáticos al cambiar de estado
**Ninguno.** No hay triggers, no hay notificaciones, no hay creación de registros secundarios.

### 7.4 Reglas de bloqueo
**Ninguna.** Cualquier usuario autenticado puede crear envíos sin restricciones.

---

## 8. DASHBOARD Y MÉTRICAS

❌ **La app NO tiene dashboard ni KPIs.** No hay gráficos (recharts está instalado pero no usado en ninguna página).

La página `Envios` es lo más cercano a un dashboard: un **listado paginado a 100 elementos** con filtro por tipo, sin agregaciones ni métricas.

> **Oportunidad para la nueva versión:** podría añadirse un dashboard simple en Supabase con métricas como envíos/mes, % de errores, distribución por medio, etc. mediante una **vista materializada** o una consulta agregada.

---

## 9. DEPENDENCIAS BASE44 A ELIMINAR

### 9.1 `base44.entities.*` → Supabase
| Uso actual | Sustitución |
|---|---|
| `base44.entities.Envio.create(data)` | `await supabase.from('envios').insert(data)` |
| `base44.entities.Envio.list('-fecha_envio', 100)` | `await supabase.from('envios').select('*').order('fecha_envio', {ascending: false}).limit(100)` |

> Recordatorio: renombrar `created_date` → `created_at` y `fecha_envio` permanece igual.

### 9.2 `base44.auth.*` → `supabase.auth`
| Base44 | Supabase |
|---|---|
| `base44.auth.me()` | `supabase.auth.getUser()` |
| `base44.auth.isAuthenticated()` | `(await supabase.auth.getSession()).data.session !== null` |
| `base44.auth.logout()` | `supabase.auth.signOut()` |
| `base44.auth.redirectToLogin()` | redirección manual a página `/login` con `signInWithPassword` o magic link |
| `AuthProvider` / `useAuth` (lib/AuthContext) | reescribir con `supabase.auth.onAuthStateChange` |

> Como solo hay 1 usuario activo (`etobcn@yahoo.es`), la **migración de auth es trivial**: crear el usuario manualmente en Supabase Auth con una password nueva o magic link.

### 9.3 `base44.functions.invoke()` → Edge Functions de Supabase
| Función actual | Edge Function destino | Notas |
|---|---|---|
| `webhookPublicaciones` | `supabase/functions/webhook-publicaciones/index.ts` | Mismo proxy HTTP, lee `Deno.env.get('WEBHOOK_PUBLICACIONES')` |
| `webhookPremiosPublicar` | `supabase/functions/webhook-premios-publicar/index.ts` | Idem |
| `webhookPremiosNoticias` | `supabase/functions/webhook-premios-noticias/index.ts` | **Reescritura completa**: sustituir InvokeLLM por **Gemini 2.x API directa con Google Search Grounding** (o alternativa). Mantener el filtro de URLs y el formato de respuesta `{noticias: [...]}`. |

Cliente Supabase:
```ts
const { data, error } = await supabase.functions.invoke('webhook-publicaciones', { body: payload });
```

### 9.4 `base44.integrations.*` → Supabase Storage / APIs externas
- `Core.UploadFile` → Supabase Storage (ver §6.1).
- `Core.InvokeLLM` → Gemini / OpenAI / Anthropic directo desde Edge Function (con secret de API).

### 9.5 `createPageUrl()`
- Importado desde `@/utils` pero su única lógica es devolver `/PageName`.
- **Sustitución:** usar rutas literales en React Router. Eliminar `createPageUrl` por completo y reemplazar `to={createPageUrl("Premios")}` por `to="/premios"` (en kebab-case si se quieren rutas más limpias).

### 9.6 `pages.config.js`
- Es una configuración de navegación auto-generada por Base44.
- **Sustitución:** definir las rutas explícitamente en `App.tsx` con React Router v6:
  ```tsx
  <Routes>
    <Route element={<Layout/>}>
      <Route index element={<Publicaciones/>} />
      <Route path="publicaciones" element={<Publicaciones/>} />
      <Route path="premios" element={<Premios/>} />
      <Route path="envios" element={<Envios/>} />
    </Route>
    <Route path="login" element={<Login/>} />
    <Route path="*" element={<NotFound/>} />
  </Routes>
  ```

### 9.7 Tabla de equivalencias rápidas

| Base44 SDK | Supabase |
|---|---|
| `base44.entities.X.create(d)` | `supabase.from('x').insert(d)` |
| `base44.entities.X.list(sort, limit)` | `supabase.from('x').select('*').order(...).limit(...)` |
| `base44.entities.X.filter({k:v})` | `supabase.from('x').select('*').match({k:v})` |
| `base44.auth.me()` | `supabase.auth.getUser()` |
| `base44.functions.invoke(name, payload)` | `supabase.functions.invoke(name, {body: payload})` |
| `base44.integrations.Core.UploadFile({file})` | `supabase.storage.from(bucket).upload(path, file)` |
| `base44.integrations.Core.InvokeLLM(...)` | fetch directo a Gemini/OpenAI desde Edge Function |

---

## 10. DATOS EXISTENTES (a migrar)

### 10.1 Volumen real (a 19/06/2026)

| Entidad | Registros |
|---|---|
| `Envio` | **249** |
| `Envio` con `tipo='publicacion'` | 228 |
| `Envio` con `tipo='premio'` | 21 |
| `Envio` con `status='enviado'` | 242 |
| `Envio` con `status='error'` | 7 |
| `Publicacion` | 0 (no usar) |
| `Premio` | 0 (no usar) |
| `User` activos | 1 (`etobcn@yahoo.es`) |

### 10.2 Archivos / documentos
Los `documento_word_urls` e `imagenes_urls` apuntan a URLs públicas del CDN de Base44 (`https://base44.app/api/apps/.../public/...`).

**Estrategia recomendada:**
1. **Opción A (mínima):** dejar las URLs antiguas como están. Mientras Base44 siga sirviendo los archivos, los envíos antiguos seguirán siendo legibles desde la nueva app. Los nuevos envíos irán a Supabase Storage.
2. **Opción B (limpia):** descargar todos los archivos referenciados, re-subirlos a Supabase Storage, y actualizar los URLs en la BD migrada. Requiere un script de migración batch.

### 10.3 Usuarios y contraseñas
- **No se pueden migrar contraseñas** desde Base44 (es OAuth gestionado por la plataforma).
- Solo hay 1 usuario → crearlo manualmente en Supabase Auth (email + password o magic link).

### 10.4 Plan de migración de datos

```
1. Export desde Base44: GET de los 249 registros vía API → CSV/JSON
2. Crear schema en Supabase (DDL del §2.2)
3. Crear usuario en supabase.auth y obtener su uuid
4. INSERT batch en `envios` mapeando created_by_id al uuid nuevo
5. (Opcional) script para re-hospedar archivos en Storage
6. Validación: SELECT count(*) por tipo y status debe coincidir con §10.1
```

---

## 11. PECULIARIDADES Y ADVERTENCIAS

### 11.1 Las entidades `Publicacion` y `Premio` están huérfanas
Existen en el schema pero **el código nunca las usa**. Toda la persistencia va a `Envio`. **No migrarlas** salvo que se quiera mantener compatibilidad histórica.

### 11.2 El registro `Envio` se crea SIEMPRE, falle o no el webhook
En `pages/Publicaciones` y `pages/Premios`:
```js
// Envia al webhook (puede fallar)
try { webhookSuccess = ... } catch { webhookError = ... }
// Luego crea el Envio SIEMPRE, con status según el resultado
await base44.entities.Envio.create({ ..., status: webhookSuccess ? 'enviado' : 'error' });
```
> Mantener este comportamiento es **crítico**: garantiza trazabilidad incluso si Make/n8n caen.

### 11.3 Manejo de timezone en fechas
Para evitar desfases de timezone en fechas tipo `date`, el frontend hace **slicing manual** del string:
```js
const soloFecha = String(envio.fecha_publicacion).slice(0, 10);
const [y, m, d] = soloFecha.split("-").map(Number);
new Date(y, m - 1, d); // local, no UTC
```
En Supabase Postgres usar tipo `date` (no `timestamptz`) para `fecha_publicacion` y `fecha_gala` mantiene este comportamiento.

### 11.4 Envío de premios: datos perdidos en BD
Como se mencionó en §4.3, al crear un `Envio` de tipo `premio` **solo se persisten 5 campos** (nombre, fecha gala, youtube, imagen_grupal, status). Los archivos de "Imagen Destacada", "PDF Gala", "Autopublicidad" etc. y las 6 noticias se envían al webhook pero **no quedan en BD**.

> **Consecuencia:** al "Volver a enviar" un premio, el usuario tiene que rellenarlo casi todo de cero. Si se quiere mejorar esto en la migración, expandir el schema de `envios` para incluir todos los campos del payload de premios.

### 11.5 LocalStorage para noticias guardadas
La página `Premios` guarda hasta 10 sets de noticias en `localStorage` con clave `premios_noticias_guardadas`. **No se migra a BD**. En la nueva versión podría considerarse persistirlas (tabla `noticias_guardadas` opcional).

### 11.6 Versiones de SDK inconsistentes en Edge Functions
- `webhookPremiosNoticias` importa `npm:@base44/sdk@0.8.25`.
- `webhookPremiosPublicar` importa `npm:@base44/sdk@0.8.21`.

En la migración a Supabase Edge Functions (Deno), esto desaparece: ya no se necesita ningún SDK de Base44.

### 11.7 El frontend NO valida campos obligatorios
El schema marca `nombre_empresa`, `fecha`, `medio`, `formato` como required, pero `pages/Publicaciones` no bloquea el submit. **Añadir validación con Zod** en la migración (zod ya está instalado).

### 11.8 InvokeLLM con `asServiceRole` 
`webhookPremiosNoticias` usa `base44.asServiceRole.integrations.Core.InvokeLLM` (no requiere auth de usuario). Al portarlo a Supabase, conviene **autenticar la Edge Function** (verificar el JWT del usuario antes de gastar créditos de Gemini).

### 11.9 Orden de migración recomendado
Para no romper nada durante el cambio:
```
1. Crear schema en Supabase + RLS + usuario.
2. Crear Edge Functions (con secrets) y probarlas aisladas.
3. Crear bucket de Storage con política pública de lectura.
4. Reescribir frontend: AuthContext, llamadas a SDK, rutas.
5. Migrar los 249 registros históricos.
6. (Opcional) re-subir archivos a Storage.
7. QA: prueba de extremo a extremo "crear publicación → ver en historial → volver a enviar".
8. Desactivar la app Base44 (mantenerla en read-only un tiempo).
```

### 11.10 Validaciones críticas que NO deben perderse
- `status='error'` si el webhook falla (no romper este patrón).
- La búsqueda de noticias debe **filtrar URLs no-http y google.com/search**.
- Las URLs de `vertexaisearch` SÍ son válidas — no filtrarlas.
- `created_date` se usa en la UI de `Envios` y `EnvioDetalle` para mostrar "Fecha de envío" → mantener como `created_at` y exponerlo en las queries.

---

## 12. ANEXO: STACK Y DEPENDENCIAS NPM REUTILIZABLES

Las siguientes dependencias del proyecto Base44 son **portables sin cambios** al nuevo proyecto React standalone:

- UI: `tailwindcss`, todos los `@radix-ui/*`, `lucide-react`, `framer-motion`, `class-variance-authority`, `clsx`, `tailwind-merge`
- Datos: `@tanstack/react-query`, `react-hook-form`, `zod`, `@hookform/resolvers`
- Fechas: `date-fns`, `moment`
- Routing: `react-router-dom`
- Componentes shadcn/ui (todos)

A reemplazar:
- `@base44/sdk` → `@supabase/supabase-js`
- `@base44/vite-plugin` → eliminar

---

**Fin del documento.**