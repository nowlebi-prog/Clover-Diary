import fs from 'node:fs';

export function buildWidgetScript(template, env) {
  const rawUrl = env.VITE_SUPABASE_URL || '';
  const key = env.VITE_SUPABASE_ANON_KEY || '';
  let config = null;
  if (rawUrl || key) {
    const url = new URL(rawUrl);
    if (url.protocol !== 'https:' || !url.hostname.endsWith('.supabase.co') || url.username || url.password || url.port || url.search || url.hash || url.pathname !== '/') {
      throw new Error('Widget requires an HTTPS Supabase project URL.');
    }
    let publicKey = /^sb_publishable_[a-zA-Z0-9_-]+$/.test(key);
    if (!publicKey && key.split('.').length === 3) {
      try { publicKey = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString('utf8')).role === 'anon'; } catch {}
    }
    if (!publicKey) throw new Error('Widget accepts only a public anon or publishable key.');
    config = { url: url.origin, key };
  }
  if (!template.includes('/*CLOVER_CONFIG*/ null')) throw new Error('Widget configuration marker is missing.');
  return template.replace('/*CLOVER_CONFIG*/ null', JSON.stringify(config));
}

export function cloverWidgetPlugin(env) {
  const templatePath = new URL('./CloverWidget.js', import.meta.url);
  const compile = () => buildWidgetScript(fs.readFileSync(templatePath, 'utf8'), env);
  return {
    name: 'clover-iphone-widget',
    generateBundle() { this.emitFile({ type: 'asset', fileName: 'CloverWidget.js', source: compile() }); },
    configureServer(server) {
      server.middlewares.use('/CloverWidget.js', (_req, res) => {
        try {
          res.setHeader('Content-Type', 'text/javascript; charset=utf-8');
          res.setHeader('Cache-Control', 'no-store');
          res.end(compile());
        } catch { res.statusCode = 503; res.end('Widget configuration is unavailable.'); }
      });
    }
  };
}
