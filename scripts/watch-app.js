const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

// Written after each successful rebuild; server/dev-reload.js watches this file
// to signal connected browsers to reload.
const SIGNAL_FILE = path.join(__dirname, '../public/__dev-signal');

const devBanner = `
(function () {
  var es = new EventSource('/__dev-reload');
  es.addEventListener('reload', function () { location.reload(); });
  es.onerror = function () { es.close(); };
})();
`;

(async () => {
  const ctx = await esbuild.context({
    entryPoints: ['src/app.tsx'],
    bundle: true,
    platform: 'browser',
    format: 'iife',
    outfile: 'public/app.bundle.js',
    minify: false,
    sourcemap: true,
    target: ['chrome90', 'firefox90'],
    define: {
      'process.env.NODE_ENV': '"development"',
    },
    banner: { js: devBanner },
    plugins: [
      {
        name: 'live-reload-signal',
        setup(build) {
          build.onEnd((result) => {
            if (result.errors.length === 0) {
              fs.writeFileSync(SIGNAL_FILE, String(Date.now()));
              console.log('[watch] rebuilt at', new Date().toLocaleTimeString());
            } else {
              console.error('[watch] build errors:', result.errors.length);
            }
          });
        },
      },
    ],
  });

  await ctx.watch();
  console.log('[watch] esbuild watching src/ for changes…');
})();
