const esbuild = require('esbuild');

(async () => {
  await esbuild.build({
    entryPoints: ['public/app.js'],
    bundle: true,
    platform: 'browser',
    format: 'iife',
    outfile: 'public/app.bundle.js',
    minify: false,
    sourcemap: true,
    target: ['chrome90', 'firefox90'],
    define: {
      'process.env.NODE_ENV': '"production"',
    },
  });
})();
