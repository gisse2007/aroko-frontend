# OPTIMIZACION.md — Aroko Frontend

Documentación de la optimización del bundle de producción y de la guía de despliegue.
Última actualización: agosto 2026 · Vite 8 (rolldown) · React 19

---

## 1. Resumen ejecutivo

| Métrica | Antes | Después | Mejora |
|---|---|---|---|
| JS inicial (raw) | ~914 kB | **356.4 kB** | −61 % |
| JS inicial (gzip) | ~290 kB | **108.9 kB** | −62 % |
| `modulepreload` erróneos en `index.html` | 2 (vendor-pdf + vendor-motion) | **0** | ✅ |

El JS inicial queda compuesto únicamente por lo imprescindible para el primer render:

| Chunk | Raw | Gzip |
|---|---:|---:|
| `vendor-react` (react + jsx-runtime + react-dom + scheduler + react-router) | 225.4 kB | 71.2 kB |
| `index` (entry: App, landing, auth, contextos) | 59.8 kB | 15.6 kB |
| `axios` (+ `src/api/axios.js`) | 40.3 kB | 15.5 kB |
| `vendor-icons` (react-icons/fi) | 26.1 kB | 4.2 kB |
| `AuthContext` | 2.5 kB | 1.1 kB |
| `preload-helper` (helper de Vite para `lazy()`) | 1.2 kB | 0.7 kB |
| `rolldown-runtime` | 0.8 kB | 0.5 kB |
| `image` (`src/utils/image.js`) | 0.3 kB | 0.2 kB |
| **TOTAL** | **356.4 kB** | **108.9 kB** |

Los vendors pesados ahora son 100 % bajo demanda:

| Chunk | Raw | Gzip | Brotli | Se carga cuando… |
|---|---:|---:|---:|---|
| `vendor-pdf` (jspdf + autotable + fast-png/pako/fflate/iobuffer/@babel) | 422.0 kB | 135.0 kB | 113.6 kB | El usuario exporta un PDF (ventas, compras, pedidos, etc.) |
| `vendor-canvas` (html2canvas) | 194.9 kB | 45.3 kB | 36.7 kB | Exportación con captura de componentes |
| `vendor-motion` (framer-motion + motion-dom + motion-utils) | 121.9 kB | 39.3 kB | 35.2 kB | Se visita `/novedades`, `/nosotros` o se abre el carrito |

---

## 2. Diagnóstico y corrección del `modulepreload` de vendor-pdf / vendor-motion

### Síntoma

Tras el build, `dist/index.html` incluía:

```html
<link rel="modulepreload" href="/assets/vendor-pdf-*.js">    <!-- 432 kB ❌ -->
<link rel="modulepreload" href="/assets/vendor-motion-*.js"> <!-- 125 kB ❌ -->
```

El navegador descargaba (y parseaba) jspdf y framer-motion **en la carga inicial**,
aunque la app no los usa hasta exportar un PDF o visitar rutas lazy. Esto anulaba
el code-splitting.

### Causa raíz

Vite emite `modulepreload` para **todas las dependencias estáticas (transitivas)
del entry**. El problema no era quién importaba los vendors, sino **dónde los
colocaba rolldown**:

1. **`react/jsx-runtime` dentro de `vendor-motion`.**
   El entry renderiza cada elemento JSX con `jsx-runtime`; si este módulo vive en
   `vendor-motion`, el entry importa ese chunk estáticamente → Vite lo preprecarga.
   La función `manualChunks` tenía la regla correcta
   (`node_modules/react/** → vendor-react`), pero rolldown la ignoró para estos
   módulos (scheduler sí obedeció; react y jsx-runtime no).

2. **Helper `\0vite/preload-helper.js` dentro de `vendor-pdf`.**
   El entry usa `React.lazy()` → importa estáticamente el helper de Vite para
   dynamic imports. Al devolver `undefined` para módulos virtuales,
   `manualChunks` dejaba que rolldown lo fusionara con un vendor pesado
   (elegó `vendor-pdf`) → el entry "necesitaba" los 432 kB de jspdf.

Diagnóstico verificado compilando con sourcemaps temporales e inspeccionando
`map.sources` por chunk.

### Solución aplicada (`vite.config.js`)

Se reemplazó `manualChunks` por la API nativa de rolldown **`output.codeSplitting`**
(con grupos priorizados; el primer `test` que coincide gana):

```js
codeSplitting: {
  groups: [
    // 1) Helper de Vite para lazy(): chunk propio diminuto (evita arrastrar vendor-pdf)
    { name: 'preload-helper', test: /preload-helper/ },
    // 2) Núcleo React: DEBE incluir jsx-runtime (si cae en vendor-motion,
    //    index.html genera un modulepreload de ~125 kB innecesario)
    { name: 'vendor-react',
      test: /[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/ },
    { name: 'vendor-motion', test: /[\\/]node_modules[\\/](framer-motion|motion-dom|motion-utils)[\\/]/ },
    { name: 'vendor-icons',  test: /[\\/]node_modules[\\/]react-icons[\\/]/ },
    { name: 'vendor-pdf',
      test: /[\\/]node_modules[\\/](jspdf|jspdf-autotable|fast-png|iobuffer|fflate|pako|@babel)[\\/]/ },
    { name: 'vendor-canvas', test: /[\\/]node_modules[\\/]html2canvas[\\/]/ },
    { name: 'vendor-maps',   test: /[\\/]node_modules[\\/](leaflet|react-leaflet)[\\/]/ },
  ],
},
```

Resultado verificado en `dist/index.html`: solo se precargan
`rolldown-runtime`, `preload-helper`, `axios`, `vendor-react`, `vendor-icons`,
`AuthContext` e `image`.

> ⚠️ **Regla para futuros cambios:** si añades una librería pesada, agrégala a un
> grupo aquí (o créale uno propio) e impórtala siempre con `import()` dinámico si
> no es crítica para el primer render. Después de cada cambio, revisa que
> `dist/index.html` no preprecargue chunks > 50 kB.

---

## 3. Estrategia de carga completa

- **Rutas críticas sin lazy** (primer render inmediato): `LandingPage`, `Login`,
  `Registro`, `RecuperarPassword`.
- **Todo lo demás con `React.lazy()`**: catálogo, nosotros, novedades, perfil
  cliente y las ~18 pantallas del dashboard (cada una su propio chunk).
- **PDF/canvas siempre dinámicos**: todos los servicios usan
  `await Promise.all([import("jspdf"), import("jspdf-autotable")])`.
- **Carrito y checkout lazy** (`CartDrawer`, `CheckoutModal`) montados bajo
  `<Suspense>` solo al abrirse.
- **Otros ajustes activos**:
  - `build.target: 'es2020'` (menos transpilación/polyfills).
  - Minificador OXC (por defecto en Vite 8), sin sourcemaps en producción.
  - Plugin propio `arokoCompression`: emite `*.gz` (nivel 9) y `*.br`
    (calidad 11) junto a cada asset comprimible — sin dependencias externas.
  - `preconnect` a fonts.googleapis.com, fonts.gstatic.com e images.unsplash.com.
  - `<link rel="preload" as="image">` del hero (debe coincidir EXACTAMENTE con
    `HERO_IMG` en `Hero.jsx` para evitar doble descarga).
  - Imágenes con `loading="lazy"`, `decoding="async"` y `width/height` explícitos (CLS).

---

## 4. Guía de despliegue

### Comandos

```bash
npm ci          # instalar dependencias exactas
npm run build   # genera dist/ (+ *.gz y *.br por asset)
npm run preview # smoke test local del build (http://localhost:4173)
```

**Directorio a publicar: `dist/`** (incluye los pares `.gz`/`.br`).

### Requisitos del hosting

1. **SPA fallback**: cualquier ruta que no sea archivo debe servir `index.html`
   (ya configurado en `vercel.json`, `public/_headers` y `public/.htaccess`).
2. **Compresión**: servir `.br`/`.gz` pregenerados según `Accept-Encoding`
   (Apache: reglas incluidas en `.htaccess`; Nginx: usar `ngx_brotli` +
   `gzip_static on`, o habilitar compresión dinámica).
3. **Caché**:
   - `/assets/*` → `Cache-Control: public, max-age=31536000, immutable`
     (los nombres llevan hash de contenido).
   - `index.html` → sin caché (`max-age=0` / `no-cache`) para que los usuarios
     reciban los nuevos hashes en cada deploy.
4. **Cabeceras de seguridad** (CSP, HSTS, XFO, nosniff, Referrer-Policy, COOP/CORP,
   Permissions-Policy): definidas en `vercel.json` (Vercel), `public/_headers`
   (Netlify/Cloudflare Pages) y `public/.htaccess` (Apache).

> 🔴 **Antes de productionizar**: la CSP y los endpoints de API apuntan a
> `http://localhost:3000` (`connect-src`, `img-src`). Sustitúyelo por la URL real
> de la API en `vercel.json`, `public/_headers` y `public/.htaccess`.

### Por plataforma

| Plataforma | Qué hacer |
|---|---|
| **Vercel** | Deploy directo del repo (usa `vercel.json`: rewrites + headers). Build: `npm run build`, output: `dist`. |
| **Netlify / Cloudflare Pages** | Build `npm run build`, output `dist`; `public/_headers` se copia automáticamente a la raíz del deploy. |
| **Apache** | Subir `dist/` completo (incluye `.htaccess`). Requiere `mod_headers`, `mod_deflate`, `mod_rewrite`; opcional `mod_brotli`. |
| **Nginx** | Servir `dist/`; habilitar `gzip_static on;` y `brotli_static on;` (ngx_brotli); SPA fallback con `try_files $uri $uri/ /index.html;`; replicar cabeceras de seguridad y cache. |

---

## 5. Checklist de verificación post-build / post-deploy

- [ ] `npm run build` termina sin errores ni warnings de rolldown.
- [ ] `dist/index.html` NO contiene `modulepreload` de `vendor-pdf`, `vendor-motion`,
      `vendor-canvas` ni `vendor-maps`.
- [ ] Cada asset crítico tiene sus pares `.gz` y `.br` en `dist/assets/`.
- [ ] `npm run preview` carga la landing sin errores en consola.
- [ ] Login de administrador → navegación completa del dashboard sin errores.
- [ ] Exportar un PDF (p. ej. Ventas): en Network debe aparecer `vendor-pdf-*.js`
      cargándose SOLO en ese momento.
- [ ] Visitar `/novedades` o `/nosotros`: `vendor-motion-*.js` se carga bajo demanda.
- [ ] En producción: responder 200 al recargar una ruta profunda (p. ej. `/ventas`)
      y cabeceras `immutable` en `/assets/*`.

---

## 6. Historial de esta iteración

1. **Diagnosticado** `modulepreload` de `vendor-pdf`/`vendor-motion` en
   `dist/index.html` mediante build temporal con sourcemaps e inspección de
   `map.sources` por chunk.
2. **Corregido** `vite.config.js`: `manualChunks` → `codeSplitting` con grupos
   priorizados (`preload-helper` propio; jsx-runtime forzado a `vendor-react`).
3. **Eliminados** los scripts temporales `verify-bundle.mjs` y el script de
   diagnóstico.
4. **Build final** verificado: JS inicial 356.4 kB raw / 108.9 kB gzip;
   sin preloads de vendors pesados; pares `.gz`/`.br` emitidos.