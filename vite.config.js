import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import zlib from 'node:zlib'

/**
 * Plugin de compresión Gzip + Brotli (sin dependencias externas).
 * Emite `*.gz` (nivel 9) y `*.br` (calidad 11) junto a cada asset
 * comprimible del bundle de producción. El servidor/hosting los sirve
 * directamente cuando el cliente envía `Accept-Encoding: gzip|br`.
 */
const COMPRESSIBLE = /\.(js|mjs|css|html|svg|json|txt|xml)$/i

function arokoCompression() {
  return {
    name: 'aroko-gzip-brotli',
    apply: 'build',
    enforce: 'post',
    generateBundle(_, bundle) {
      // Snapshot de claves: evita re-iterar los assets que emitimos aquí.
      // Rolldown no permite asignar al objeto `bundle`: usamos this.emitFile().
      for (const fileName of Object.keys(bundle)) {
        const file = bundle[fileName]
        if (!file || !COMPRESSIBLE.test(fileName)) continue

        // Los chunks JS exponen `code`; los assets (css/html/svg/json) `source`
        const raw = file.type === 'chunk' ? file.code : file.source
        if (!raw) continue
        const source = Buffer.from(raw)

        this.emitFile({
          type: 'asset',
          fileName: `${fileName}.gz`,
          source: zlib.gzipSync(source, { level: 9 }),
        })

        this.emitFile({
          type: 'asset',
          fileName: `${fileName}.br`,
          source: zlib.brotliCompressSync(source, {
            params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11 },
          }),
        })
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), arokoCompression()],
  build: {
    // Objetivo moderno: menos transpilación y polyfills => JS más ligero
    target: 'es2020',
    // Vite 8 usa OXC como minificador por defecto (esbuild está deprecado)
    sourcemap: false,
    rollupOptions: {
      output: {
        // Vite 8 (rolldown): API nativa `codeSplitting` (reemplaza manualChunks,
        // que en rolldown coloca mal módulos compartidos como jsx-runtime o el
        // preload helper). El orden de los grupos define la prioridad: gana el
        // primero cuyo `test` coincida.
        codeSplitting: {
          groups: [
            // Helper de Vite para lazy()/dynamic imports (módulo virtual \0vite/preload-helper).
            // Debe vivir en su propio chunk diminuto: si no, rolldown lo fusiona con un
            // vendor pesado (p.ej. vendor-pdf) y el entry termina precargando 400+ kB.
            { name: 'preload-helper', test: /preload-helper/ },
            // Núcleo React + jsx-runtime. jsx-runtime DEBE estar aquí: el entry lo importa
            // estáticamente para cada elemento JSX; si cae en vendor-motion, index.html
            // genera un modulepreload de ~125 kB innecesario.
            {
              name: 'vendor-react',
              test: /[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/,
            },
            {
              name: 'vendor-motion',
              test: /[\\/]node_modules[\\/](framer-motion|motion-dom|motion-utils)[\\/]/,
            },
            { name: 'vendor-icons', test: /[\\/]node_modules[\\/]react-icons[\\/]/ },
            {
              name: 'vendor-pdf',
              test: /[\\/]node_modules[\\/](jspdf|jspdf-autotable|fast-png|iobuffer|fflate|pako|@babel)[\\/]/,
            },
            { name: 'vendor-canvas', test: /[\\/]node_modules[\\/]html2canvas[\\/]/ },
            { name: 'vendor-maps', test: /[\\/]node_modules[\\/](leaflet|react-leaflet)[\\/]/ },
          ],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
})